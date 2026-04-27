<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\FacultyProfile;
use App\Models\SearchLog;
use App\Models\Thesis;
use App\Models\User;
use App\Models\VpaaProfile;
use App\Services\DailyQuoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class VpaaController extends Controller
{
    private const VPAA_ACTIVITY_ACTIONS = [
        'faculty.created',
        'faculty.updated',
    ];

    public function __construct(private DailyQuoteService $dailyQuoteService) {}

    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $this->resolveVpaaProfile($user);

        return response()->json([
            'data' => $this->formatVpaaProfile($profile),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|max:255|unique:users,email,' . $request->user()->id,
            'office' => 'nullable|string|max:255',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'role_title' => 'required|string|max:255',
            'area_of_oversight' => 'nullable|string|max:255',
            'office_hours' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $profile = $this->resolveVpaaProfile($user);

        $user->update([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
        ]);

        $profile->update([
            'office' => $validated['office'] ?? null,
            'role_title' => $validated['role_title'],
            'area_of_oversight' => $validated['area_of_oversight'] ?? null,
            'office_hours' => $validated['office_hours'] ?? null,
        ]);

        $profile->refresh()->load('user');

        return response()->json([
            'data' => $this->formatVpaaProfile($profile),
        ]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $totalFaculty = \App\Models\User::where('role', 'faculty')->count();
        $departmentChairs = \App\Models\FacultyProfile::where('faculty_role', 'Department Chair')->count();
        $roleChangesThisMonth = ActivityLog::whereMonth('created_at', now()->month)
            ->where('action', 'faculty.role_changed')
            ->count();
        $newAccountsThisMonth = \App\Models\User::whereMonth('created_at', now()->month)
            ->where('role', '!=', 'vpaa')
            ->count();
        $onLeave = \App\Models\FacultyProfile::where('status', 'on_leave')->count();

        $recentActivity = ActivityLog::with('user:id,name,avatar_url')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $recentTheses = Thesis::query()
            ->where('status', 'approved')
            ->whereRaw('"is_archived" = true')
            ->with(['submitter:id,name', 'category:id,name'])
            ->orderByDesc('archived_at')
            ->orderByDesc('updated_at')
            ->orderByDesc('created_at')
            ->limit(24)
            ->get()
            ->map(fn (Thesis $thesis) => $this->formatDashboardThesis($thesis));

        $topSearches = $this->resolveTopSearches();

        return response()->json([
            'stats' => [
                'total_faculty' => $totalFaculty,
                'department_chairs' => $departmentChairs,
                'role_changes_this_month' => $roleChangesThisMonth,
                'new_accounts_this_month' => $newAccountsThisMonth,
                'on_leave' => $onLeave,
            ],
            'recent_activity' => $recentActivity,
            'recent_theses' => $recentTheses,
            'top_searches' => $topSearches,
        ]);
    }

    private function formatDashboardThesis(Thesis $thesis): array
    {
        $categories = $this->resolveCategorySummaries($thesis);

        return [
            'id' => $thesis->id,
            'title' => $thesis->title,
            'author' => collect($thesis->authors ?? [])->filter()->implode(', ') ?: ($thesis->submitter?->name ?? 'Unknown author'),
            'authors' => collect($thesis->authors ?? [])->filter()->values()->all(),
            'abstract' => $thesis->abstract,
            'year' => $thesis->approved_at?->format('Y') ?? ($thesis->created_at?->format('Y') ?? null),
            'college' => $this->resolveCollegeForDepartment($thesis->department),
            'department' => $thesis->department,
            'program' => $thesis->program,
            'category' => $categories[0]['name'] ?? $thesis->category?->name,
            'categories' => $categories,
            'keywords' => collect($thesis->keywords ?? [])->filter()->values()->all(),
            'view_count' => (int) $thesis->view_count,
            'archived_at' => optional($thesis->archived_at)?->toISOString(),
            'approved_at' => optional($thesis->approved_at)?->toISOString(),
            'updated_at' => optional($thesis->updated_at)?->toISOString(),
        ];
    }

    private function resolveCollegeForDepartment(?string $department): ?string
    {
        $normalizedDepartment = trim((string) $department);

        if ($normalizedDepartment === '') {
            return null;
        }

        $departmentCollegeMap = config('academic.department_college_map', []);

        return isset($departmentCollegeMap[$normalizedDepartment])
            ? trim((string) $departmentCollegeMap[$normalizedDepartment])
            : null;
    }

    private function resolveCategorySummaries(Thesis $thesis): array
    {
        $categoryIds = collect($thesis->category_ids ?? [])
            ->filter(fn ($id) => is_string($id) && trim($id) !== '')
            ->values();

        if ($categoryIds->isEmpty() && $thesis->category_id) {
            $categoryIds = collect([$thesis->category_id]);
        }

        if ($categoryIds->isEmpty()) {
            return [];
        }

        $categories = Category::query()
            ->whereIn('id', $categoryIds)
            ->get(['id', 'name', 'slug'])
            ->keyBy('id');

        return $categoryIds
            ->map(fn (string $id) => $categories->get($id))
            ->filter()
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
            ])
            ->values()
            ->all();
    }

    private function resolveTopSearches()
    {
        $topThesisIds = SearchLog::query()
            ->whereNotNull('thesis_id')
            ->whereNotNull('clicked_at')
            ->select('thesis_id')
            ->selectRaw('COUNT(*) as click_hits')
            ->groupBy('thesis_id')
            ->orderByDesc('click_hits')
            ->limit(24)
            ->pluck('thesis_id');

        if ($topThesisIds->isEmpty()) {
            return collect();
        }

        $theses = Thesis::query()
            ->where('status', 'approved')
            ->whereRaw('"is_archived" = true')
            ->whereIn('id', $topThesisIds)
            ->with(['submitter:id,name', 'category:id,name'])
            ->get()
            ->keyBy('id');

        return $topThesisIds
            ->map(fn (string $id) => $theses->get($id))
            ->filter()
            ->map(fn (Thesis $thesis) => $this->formatDashboardThesis($thesis))
            ->values();
    }

    private function resolveVpaaProfile(User $user): VpaaProfile
    {
        return VpaaProfile::where('user_id', $user->id)
            ->with('user')
            ->firstOrFail();
    }

    private function formatVpaaProfile(VpaaProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'employee_id' => $profile->employee_id,
            'email' => $profile->user?->email,
            'office' => $profile->office,
            'first_name' => $profile->user?->first_name,
            'last_name' => $profile->user?->last_name,
            'full_name' => $profile->user?->name,
            'role_title' => $profile->role_title,
            'area_of_oversight' => $profile->area_of_oversight,
            'office_hours' => $profile->office_hours,
            'updated_at' => optional($profile->updated_at)?->toISOString(),
        ];
    }

    public function activityLog(Request $request): JsonResponse
    {
        $logs = ActivityLog::with([
                'user:id,name,avatar_url,role',
                'user.faculty:user_id,department,college',
                'user.student:user_id,department',
            ])
            ->whereIn('action', self::VPAA_ACTIVITY_ACTIONS)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        $thesisIds = $logs->where('subject_type', 'thesis')->pluck('subject_id')->filter()->unique()->values();
        $userIds = $logs->where('subject_type', 'user')->pluck('subject_id')->filter()->unique()->values();
        $facultyIds = $logs->where('subject_type', 'faculty')->pluck('subject_id')->filter()->unique()->values();

        $theses = Thesis::query()
            ->whereIn('id', $thesisIds)
            ->get()
            ->keyBy('id');

        $subjectUsers = User::query()
            ->with(['faculty:user_id,department,college', 'student:user_id,department'])
            ->select(['id', 'name', 'role'])
            ->whereIn('id', $userIds)
            ->get()
            ->keyBy('id');

        $facultyProfiles = FacultyProfile::query()
            ->with('user:id,name')
            ->whereIn('id', $facultyIds)
            ->get()
            ->keyBy('id');

        $departmentCollegeMap = collect(config('academic.department_college_map', []))
            ->merge(
                FacultyProfile::query()
                    ->whereNotNull('department')
                    ->whereNotNull('college')
                    ->where('department', '!=', '')
                    ->where('college', '!=', '')
                    ->get(['department', 'college'])
                    ->pluck('college', 'department')
                    ->all()
            );

        $allColleges = collect(config('academic.colleges', []))
            ->merge(
                FacultyProfile::query()
                    ->whereNotNull('college')
                    ->where('college', '!=', '')
                    ->orderBy('college')
                    ->pluck('college')
            )
            ->unique()
            ->values();

        $formattedLogs = $logs->map(function (ActivityLog $log) use ($theses, $subjectUsers, $facultyProfiles, $departmentCollegeMap) {
            $subjectThesis = $log->subject_type === 'thesis' ? $theses->get($log->subject_id) : null;
            $subjectUser = $log->subject_type === 'user' ? $subjectUsers->get($log->subject_id) : null;
            $subjectFaculty = $log->subject_type === 'faculty' ? $facultyProfiles->get($log->subject_id) : null;

            [$badge, $tone, $cta] = $this->presentActivityAction($log->action);

            $accountName = $log->user?->name
                ?? $subjectUser?->name
                ?? $subjectFaculty?->user?->name
                ?? 'System';

            $accountRole = $log->user?->role
                ?? $subjectUser?->role
                ?? ($subjectFaculty ? 'faculty' : null)
                ?? 'system';

            $department = $subjectThesis?->department
                ?? $subjectFaculty?->department
                ?? $subjectUser?->faculty?->department
                ?? $subjectUser?->student?->department
                ?? $log->user?->faculty?->department
                ?? $log->user?->student?->department;

            $college = $subjectFaculty?->college
                ?? $subjectUser?->faculty?->college
                ?? $log->user?->faculty?->college
                ?? ($department ? $departmentCollegeMap->get($department) : null)
                ?? 'No College Assigned';

            return [
                'id' => $log->id,
                'user_id' => $log->user_id,
                'badge' => $badge,
                'tone' => $tone,
                'request_record' => $this->buildActivityRecordLabel($log, $subjectThesis, $subjectUser, $subjectFaculty),
                'account' => $accountName,
                'role' => $accountRole,
                'college' => $college,
                'time' => $log->created_at?->diffForHumans(),
                'timestamp' => optional($log->created_at)?->toISOString(),
                'action' => $cta,
            ];
        });

        $summary = [
            'actions_today' => ActivityLog::query()
                ->whereIn('action', self::VPAA_ACTIVITY_ACTIONS)
                ->whereDate('created_at', now()->toDateString())
                ->count(),
            'approvals' => 0,
            'account_updates' => ActivityLog::query()->whereIn('action', [
                'faculty.created',
                'faculty.updated',
            ])->count(),
            'last_activity' => optional($logs->first()?->created_at)?->diffForHumans() ?? 'No recent activity',
        ];

        return response()->json([
            'data' => [
                'summary' => $summary,
                'colleges' => $allColleges,
                'logs' => $formattedLogs,
            ],
        ]);
    }

    public function dailyQuote(Request $request): JsonResponse
    {
        $quote = $this->dailyQuoteService->getTodayQuote();

        if (!$quote) {
            return response()->json([
                'data' => null,
                'message' => 'No daily quote available.',
            ]);
        }

        return response()->json(['data' => $quote]);
    }

    public function categories(Request $request): JsonResponse
    {
        $categories = Category::query()
            ->whereRaw('is_active = true')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $archivedTheses = Thesis::query()
            ->select([
                'id',
                'title',
                'abstract',
                'authors',
                'department',
                'program',
                'school_year',
                'approved_at',
                'archived_at',
                'created_at',
                'updated_at',
                'submitted_by',
                'category_id',
                'category_ids',
            ])
            ->with('submitter:id,name')
            ->where('status', 'approved')
            ->whereRaw('"is_archived" = true')
            ->orderByDesc('archived_at')
            ->orderByDesc('updated_at')
            ->orderByDesc('created_at')
            ->get();

        $categoryBuckets = $categories->mapWithKeys(fn (Category $category) => [$category->id => collect()]);

        foreach ($archivedTheses as $thesis) {
            foreach ($this->resolveCategoryIds($thesis) as $categoryId) {
                if ($categoryBuckets->has($categoryId)) {
                    $categoryBuckets[$categoryId]->push($thesis);
                }
            }
        }

        $data = $categories->map(function (Category $category) use ($categoryBuckets) {
                $theses = $categoryBuckets->get($category->id, collect());
                $latestThesis = $theses->first();

                return [
                    'id' => $category->id,
                    'slug' => $category->slug,
                    'label' => $category->name,
                    'description' => $category->description,
                    'document_count' => $theses->count(),
                    'updated_at' => $this->formatIsoTimestamp($latestThesis?->archived_at ?? $latestThesis?->approved_at),
                    'theses' => $theses->map(function (Thesis $thesis) {
                        return [
                            'id' => $thesis->id,
                            'title' => $thesis->title,
                            'author' => collect($thesis->authors ?? [])->filter()->implode(', ') ?: ($thesis->submitter?->name ?? 'Unknown author'),
                            'authors' => collect($thesis->authors ?? [])->filter()->values()->all(),
                            'abstract' => $thesis->abstract,
                            'year' => $thesis->approved_at?->format('Y') ?? ($thesis->created_at?->format('Y') ?? null),
                            'college' => $this->resolveCollegeForDepartment($thesis->department),
                            'department' => $thesis->department,
                            'program' => $thesis->program,
                            'school_year' => $thesis->school_year,
                            'categories' => $this->resolveCategorySummaries($thesis),
                            'keywords' => [],
                            'approved_at' => optional($thesis->approved_at)?->toISOString(),
                        ];
                    })->all(),
                ];
            })
            ->values();

        return response()->json([
            'data' => [
                'categories' => $data,
            ],
        ]);
    }

    private function formatIsoTimestamp(mixed $value): ?string
    {
        if (!$value) {
            return null;
        }

        if ($value instanceof Carbon) {
            return $value->toISOString();
        }

        try {
            return Carbon::parse($value)->toISOString();
        } catch (\Throwable) {
            return null;
        }
    }

    private function presentActivityAction(string $action): array
    {
        return match ($action) {
            'faculty.created' => ['Account Created', 'gold', 'Open'],
            'faculty.updated' => ['Account Edited', 'sage', 'View'],
            default => ['Activity Logged', 'maroon', 'View'],
        };
    }

    private function buildActivityRecordLabel(ActivityLog $log, ?Thesis $thesis, ?User $user, ?FacultyProfile $facultyProfile): string
    {
        return match ($log->action) {
            'faculty.created' => $user?->name ? "Faculty account: {$user->name}" : 'Faculty account created',
            'faculty.updated' => $facultyProfile?->user?->name
                ? "Faculty account updated: {$facultyProfile->user->name}"
                : ($user?->name ? "Faculty account updated: {$user->name}" : 'Faculty account updated'),
            default => str($log->action)->replace('.', ' ')->replace('_', ' ')->title()->toString(),
        };
    }

    private function resolveCategoryIds(Thesis $thesis): \Illuminate\Support\Collection
    {
        $categoryIds = collect($thesis->category_ids ?? [])
            ->filter(fn ($id) => is_string($id) && trim($id) !== '')
            ->values();

        if ($categoryIds->isEmpty() && $thesis->category_id) {
            $categoryIds = collect([$thesis->category_id]);
        }

        return $categoryIds->unique()->values();
    }
}
