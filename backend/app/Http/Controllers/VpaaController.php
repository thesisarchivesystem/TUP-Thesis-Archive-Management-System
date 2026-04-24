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
            'mobile' => 'nullable|string|max:255',
            'office' => 'nullable|string|max:255',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'role_title' => 'required|string|max:255',
            'supervised_units' => 'nullable|string|max:255',
            'office_hours' => 'nullable|string|max:255',
            'signature_title' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $profile = $this->resolveVpaaProfile($user);

        $user->update([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
        ]);

        $profile->update([
            'mobile' => $validated['mobile'] ?? null,
            'office' => $validated['office'] ?? null,
            'role_title' => $validated['role_title'],
            'supervised_units' => $validated['supervised_units'] ?? null,
            'office_hours' => $validated['office_hours'] ?? null,
            'signature_title' => $validated['signature_title'] ?? null,
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
            ->with(['submitter:id,name', 'category:id,name'])
            ->orderByDesc('approved_at')
            ->orderByDesc('created_at')
            ->limit(8)
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
        return [
            'id' => $thesis->id,
            'title' => $thesis->title,
            'author' => collect($thesis->authors ?? [])->filter()->implode(', ') ?: ($thesis->submitter?->name ?? 'Unknown author'),
            'year' => $thesis->approved_at?->format('Y') ?? ($thesis->created_at?->format('Y') ?? null),
            'department' => $thesis->department,
            'program' => $thesis->program,
            'category' => $thesis->category?->name,
            'keywords' => collect($thesis->keywords ?? [])->filter()->take(2)->values()->all(),
            'view_count' => (int) $thesis->view_count,
            'approved_at' => optional($thesis->approved_at)?->toISOString(),
        ];
    }

    private function resolveTopSearches()
    {
        $topThesisIds = SearchLog::query()
            ->whereNotNull('thesis_id')
            ->select('thesis_id')
            ->selectRaw('COUNT(*) as search_hits')
            ->groupBy('thesis_id')
            ->orderByDesc('search_hits')
            ->limit(8)
            ->pluck('thesis_id');

        if ($topThesisIds->isEmpty()) {
            return collect();
        }

        $theses = Thesis::query()
            ->where('status', 'approved')
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
            'mobile' => $profile->mobile,
            'office' => $profile->office,
            'first_name' => $profile->user?->first_name,
            'last_name' => $profile->user?->last_name,
            'full_name' => $profile->user?->name,
            'role_title' => $profile->role_title,
            'supervised_units' => $profile->supervised_units,
            'office_hours' => $profile->office_hours,
            'signature_title' => $profile->signature_title,
            'updated_at' => optional($profile->updated_at)?->toISOString(),
        ];
    }

    public function activityLog(Request $request): JsonResponse
    {
        $logs = ActivityLog::with([
                'user:id,name,avatar_url,role',
                'user.faculty:user_id,department',
                'user.student:user_id,department',
            ])
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
            ->with(['faculty:user_id,department', 'student:user_id,department'])
            ->select(['id', 'name', 'role'])
            ->whereIn('id', $userIds)
            ->get()
            ->keyBy('id');

        $facultyProfiles = FacultyProfile::query()
            ->with('user:id,name')
            ->whereIn('id', $facultyIds)
            ->get()
            ->keyBy('id');

        $formattedLogs = $logs->map(function (ActivityLog $log) use ($theses, $subjectUsers, $facultyProfiles) {
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
                ?? $log->user?->student?->department
                ?? 'All Departments';

            return [
                'id' => $log->id,
                'badge' => $badge,
                'tone' => $tone,
                'request_record' => $this->buildActivityRecordLabel($log, $subjectThesis, $subjectUser, $subjectFaculty),
                'account' => $accountName,
                'role' => $accountRole,
                'department' => $department,
                'time' => $log->created_at?->diffForHumans(),
                'timestamp' => optional($log->created_at)?->toISOString(),
                'action' => $cta,
            ];
        });

        $summary = [
            'actions_today' => ActivityLog::query()->whereDate('created_at', now()->toDateString())->count(),
            'approvals' => ActivityLog::query()->where('action', 'thesis.approved')->count(),
            'account_updates' => ActivityLog::query()->whereIn('action', [
                'faculty.created',
                'student.created',
                'faculty.status_changed',
                'faculty.role_changed',
            ])->count(),
            'last_activity' => optional($logs->first()?->created_at)?->diffForHumans(),
        ];

        return response()->json([
            'data' => [
                'summary' => $summary,
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
            ->withCount(['theses as document_count' => function ($query) {
                $query->where('status', 'approved');
            }])
            ->withMax(['theses as latest_approved_at' => function ($query) {
                $query->where('status', 'approved');
            }], 'approved_at')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $data = $categories->map(function (Category $category) {
                $theses = Thesis::query()
                    ->where('category_id', $category->id)
                    ->where('status', 'approved')
                    ->select([
                        'id',
                        'title',
                        'authors',
                        'department',
                        'program',
                        'school_year',
                        'keywords',
                        'approved_at',
                        'created_at',
                        'submitted_by',
                    ])
                    ->with('submitter:id,name')
                    ->orderByDesc('approved_at')
                    ->limit(6)
                    ->get();

                return [
                    'id' => $category->id,
                    'slug' => $category->slug,
                    'label' => $category->name,
                    'description' => $category->description,
                    'document_count' => (int) $category->document_count,
                    'updated_at' => $this->formatIsoTimestamp($category->latest_approved_at),
                    'theses' => $theses->map(function (Thesis $thesis) {
                        return [
                            'id' => $thesis->id,
                            'title' => $thesis->title,
                            'author' => collect($thesis->authors ?? [])->filter()->implode(', ') ?: ($thesis->submitter?->name ?? 'Unknown author'),
                            'year' => $thesis->approved_at?->format('Y') ?? ($thesis->created_at?->format('Y') ?? null),
                            'department' => $thesis->department,
                            'program' => $thesis->program,
                            'school_year' => $thesis->school_year,
                            'keywords' => collect($thesis->keywords ?? [])->filter()->take(2)->values()->all(),
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
            'thesis.approved' => ['Approval Completed', 'sage', 'View'],
            'thesis.rejected' => ['Revision Requested', 'terracotta', 'Review'],
            'thesis.submitted' => ['File Submitted', 'sky', 'Open'],
            'faculty.created' => ['Account Created', 'gold', 'Open'],
            'student.created' => ['Student Added', 'sky', 'Open'],
            'faculty.status_changed' => ['Status Changed', 'terracotta', 'Review'],
            'faculty.role_changed' => ['Role Updated', 'sage', 'View'],
            'auth.login' => ['Access Granted', 'sage', 'View'],
            'auth.logout' => ['Session Closed', 'gold', 'Open'],
            default => ['Activity Logged', 'maroon', 'View'],
        };
    }

    private function buildActivityRecordLabel(ActivityLog $log, ?Thesis $thesis, ?User $user, ?FacultyProfile $facultyProfile): string
    {
        return match ($log->action) {
            'thesis.approved' => $thesis?->title ? "Approved thesis: {$thesis->title}" : 'Approved thesis record',
            'thesis.rejected' => $thesis?->title ? "Revision requested: {$thesis->title}" : 'Rejected thesis record',
            'thesis.submitted' => $thesis?->title ? "Submitted thesis: {$thesis->title}" : 'New thesis submission',
            'faculty.created' => $user?->name ? "Faculty account: {$user->name}" : 'Faculty account created',
            'student.created' => $user?->name ? "Student account: {$user->name}" : 'Student account created',
            'faculty.status_changed' => $facultyProfile?->user?->name
                ? "{$facultyProfile->user->name} status set to " . str($log->meta['status'] ?? 'updated')->replace('_', ' ')->title()
                : 'Faculty status updated',
            'faculty.role_changed' => $facultyProfile?->user?->name
                ? "Role updated for {$facultyProfile->user->name}"
                : 'Faculty role updated',
            'auth.login' => $log->user?->name ? "{$log->user->name} signed in" : 'User signed in',
            'auth.logout' => $log->user?->name ? "{$log->user->name} signed out" : 'User signed out',
            default => str($log->action)->replace('.', ' ')->replace('_', ' ')->title()->toString(),
        };
    }
}
