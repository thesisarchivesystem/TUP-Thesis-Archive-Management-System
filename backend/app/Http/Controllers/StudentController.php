<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Category;
use App\Models\FacultyProfile;
use App\Models\Program;
use App\Models\SearchLog;
use App\Models\StudentProfile;
use App\Models\Thesis;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\DailyQuoteService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class StudentController extends Controller
{
    private const DASHBOARD_THESIS_CACHE_SECONDS = 60;

    public function __construct(
        private ActivityLogService $logger,
        private DailyQuoteService $dailyQuoteService,
        private NotificationService $notifications,
    ) {}

    public function advisers(Request $request): JsonResponse
    {
        $studentProfile = StudentProfile::query()
            ->where('user_id', $request->user()->id)
            ->first();
        $facultyProfile = FacultyProfile::query()
            ->where('user_id', $request->user()->id)
            ->first();
        $department = $studentProfile?->department ?? $facultyProfile?->department;

        $faculty = FacultyProfile::query()
            ->with('user:id,name,email')
            ->where('status', 'active')
            ->when($department, fn ($query, $department) => $query->where('department', $department))
            ->orderBy('department')
            ->orderBy('faculty_role')
            ->get();

        return response()->json([
            'data' => $faculty->map(function (FacultyProfile $profile) {
                return [
                    'id' => $profile->user_id,
                    'faculty_profile_id' => $profile->id,
                    'name' => $profile->user?->name,
                    'email' => $profile->user?->email,
                    'department' => $profile->department,
                    'faculty_role' => $profile->faculty_role,
                    'rank' => $profile->rank,
                ];
            })->values(),
        ]);
    }

    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        $profile = StudentProfile::query()
            ->with([
                'user:id,name,email',
                'adviser:id,name,email',
                'programModel:id,name,code',
            ])
            ->where('user_id', $user->id)
            ->first();

        if (!$profile) {
            return response()->json([
                'message' => 'Student profile not found.',
            ], 404);
        }

        $latestSubmission = Thesis::query()
            ->where('submitted_by', $user->id)
            ->with('adviser:id,name,email')
            ->orderByDesc('updated_at')
            ->orderByDesc('created_at')
            ->first();

        return response()->json([
            'data' => [
                'id' => $profile->id,
                'student_id' => $profile->student_id,
                'full_name' => $profile->user?->name,
                'email' => $profile->user?->email,
                'mobile' => null,
                'program' => $this->programDisplayLabel($profile),
                'department' => $profile->department,
                'year_level' => $profile->year_level,
                'thesis_title' => $latestSubmission?->title,
                'adviser_name' => $latestSubmission?->adviser?->name ?? $profile->adviser?->name,
                'adviser_email' => $latestSubmission?->adviser?->email ?? $profile->adviser?->email,
                'defense_schedule' => $this->formatLongDate($latestSubmission?->approved_at ?? $latestSubmission?->updated_at),
                'status' => $this->formatStudentStatus($latestSubmission?->status),
                'editable_by' => 'Faculty',
                'updated_at' => optional($profile->updated_at)?->toISOString(),
            ],
        ]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        $submissionStats = Thesis::query()
            ->where('submitted_by', $user->id)
            ->selectRaw('COUNT(*) as my_submissions')
            ->selectRaw('COALESCE(SUM(view_count), 0) as total_views')
            ->selectRaw("SUM(CASE WHEN status IN ('pending', 'under_review') THEN 1 ELSE 0 END) as pending_review")
            ->selectRaw("SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved")
            ->first();

        $recentTheses = $this->recentDashboardTheses();

        try {
            $topSearches = $this->resolveTopSearches();
        } catch (\Throwable $exception) {
            Log::warning('Student dashboard top searches failed to load.', [
                'message' => $exception->getMessage(),
            ]);
            $topSearches = [];
        }

        try {
            $quote = $this->dailyQuoteService->getTodayQuote();
        } catch (\Throwable $exception) {
            Log::warning('Student dashboard daily quote failed to load.', [
                'message' => $exception->getMessage(),
            ]);
            $quote = null;
        }

        return response()->json([
            'stats' => [
                'my_submissions' => (int) ($submissionStats?->my_submissions ?? 0),
                'total_views' => (int) ($submissionStats?->total_views ?? 0),
                'pending_review' => (int) ($submissionStats?->pending_review ?? 0),
                'approved' => (int) ($submissionStats?->approved ?? 0),
            ],
            'recent_theses' => $recentTheses,
            'top_searches' => $topSearches,
            'daily_quote' => $quote,
        ]);
    }

    private function recentDashboardTheses(): array
    {
        return Cache::remember('dashboard:recent-theses:v2', self::DASHBOARD_THESIS_CACHE_SECONDS, function () {
            $recentThesisModels = Thesis::query()
                ->select($this->dashboardThesisColumns())
                ->where('status', 'approved')
                ->whereRaw('"is_archived" = true')
                ->with(['submitter:id,name', 'category:id,name,slug'])
                ->orderByDesc('archived_at')
                ->orderByDesc('updated_at')
                ->orderByDesc('created_at')
                ->limit(24)
                ->get();

            $recentCategories = $this->preloadCategorySummaries($recentThesisModels);

            return $recentThesisModels
                ->map(fn (Thesis $thesis) => $this->formatDashboardThesis($thesis, $recentCategories))
                ->values()
                ->all();
        });
    }

    private function dashboardThesisColumns(): array
    {
        return [
            'id',
            'title',
            'abstract',
            'authors',
            'department',
            'program',
            'category_id',
            'category_ids',
            'submitted_by',
            'view_count',
            'approved_at',
            'archived_at',
            'updated_at',
            'created_at',
        ];
    }

    private function formatDashboardThesis(Thesis $thesis, ?\Illuminate\Support\Collection $categoriesById = null): array
    {
        $categories = $this->resolveCategorySummaries($thesis, $categoriesById);

        return [
            'id' => $thesis->id,
            'title' => $thesis->title,
            'author' => collect($thesis->authors ?? [])->filter()->implode(', ') ?: ($thesis->submitter?->name ?? 'Unknown author'),
            'authors' => collect($thesis->authors ?? [])->filter()->values()->all(),
            'abstract' => $thesis->abstract,
            'submitter_name' => $thesis->submitter?->name,
            'year' => $thesis->approved_at?->format('Y') ?? ($thesis->created_at?->format('Y') ?? null),
            'college' => $this->resolveCollegeForDepartment($thesis->department),
            'department' => $thesis->department,
            'program' => $thesis->program,
            'category' => $categories[0]['name'] ?? $thesis->category?->name,
            'categories' => $categories,
            'keywords' => collect($thesis->keywords ?? [])->filter()->values()->all(),
            'view_count' => (int) $thesis->view_count,
            'archived_at' => $this->formatIsoTimestamp($thesis->archived_at),
            'approved_at' => $this->formatIsoTimestamp($thesis->approved_at),
            'updated_at' => $this->formatIsoTimestamp($thesis->updated_at),
            'created_at' => $this->formatIsoTimestamp($thesis->created_at),
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

    private function resolveCategorySummaries(Thesis $thesis, ?\Illuminate\Support\Collection $categoriesById = null): array
    {
        $categoryIds = $this->resolveCategoryIds($thesis);

        if ($categoryIds->isEmpty()) {
            return [];
        }

        $categories = $categoriesById ?? Category::query()
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

    private function preloadCategorySummaries(\Illuminate\Support\Collection $theses): \Illuminate\Support\Collection
    {
        $categoryIds = $theses
            ->flatMap(fn (Thesis $thesis) => $this->resolveCategoryIds($thesis))
            ->unique()
            ->values();

        if ($categoryIds->isEmpty()) {
            return collect();
        }

        return Category::query()
            ->whereIn('id', $categoryIds)
            ->get(['id', 'name', 'slug'])
            ->keyBy('id');
    }

    private function resolveCategoryIds(Thesis $thesis): \Illuminate\Support\Collection
    {
        $categoryIds = collect($thesis->category_ids ?? [])
            ->filter(fn ($id) => is_string($id) && trim($id) !== '')
            ->values();

        if ($categoryIds->isEmpty() && $thesis->category_id) {
            return collect([$thesis->category_id]);
        }

        return $categoryIds;
    }

    private function resolveTopSearches()
    {
        if (!Schema::hasTable('search_logs')) {
            return [];
        }

        return Cache::remember('dashboard:top-searches:v2', self::DASHBOARD_THESIS_CACHE_SECONDS, function () {
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
                return [];
            }

            $theses = Thesis::query()
                ->select($this->dashboardThesisColumns())
                ->where('status', 'approved')
                ->whereRaw('"is_archived" = true')
                ->whereIn('id', $topThesisIds)
                ->with(['submitter:id,name', 'category:id,name,slug'])
                ->get()
                ->keyBy('id');

            $topCategories = $this->preloadCategorySummaries($theses->values());

            return $topThesisIds
                ->map(fn (string $id) => $theses->get($id))
                ->filter()
                ->map(fn (Thesis $thesis) => $this->formatDashboardThesis($thesis, $topCategories))
                ->values()
                ->all();
        });
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

    private function formatLongDate(mixed $value): ?string
    {
        if (!$value) {
            return null;
        }

        try {
            return Carbon::parse($value)->format('F j, Y');
        } catch (\Throwable) {
            return null;
        }
    }

    private function formatStudentStatus(?string $status): string
    {
        return match ($status) {
            'approved' => 'Approved',
            'rejected' => 'Needs Revision',
            'under_review' => 'For Final Review',
            'pending' => 'Pending Review',
            'draft' => 'Draft',
            default => 'No submission yet',
        };
    }

    public function index(Request $request): JsonResponse
    {
        $query = StudentProfile::with('user:id,name,email');

        if ($request->user()?->role === 'faculty') {
            $query->where('adviser_id', $request->user()->id);
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->whereHas('user', fn($q) => $q->where('name', 'ilike', "%{$search}%")
                ->orWhere('email', 'ilike', "%{$search}%"));
        }

        if ($request->has('department') && $request->input('department')) {
            $query->where('department', $request->input('department'));
        }

        $students = $query->paginate(20);

        return response()->json($students);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'first_name'         => 'required|string|max:255',
            'last_name'          => 'required|string|max:255',
            'suffix'             => 'nullable|string|max:50',
            'email'              => 'required|email|unique:users',
            'temporary_password' => 'required|string|min:8',
            'student_id'         => 'nullable|string|unique:student_profiles',
            'department'         => 'required|string',
            'program'            => 'required|string',
            'year_level'         => 'nullable|integer',
        ]);

        $studentId = $request->filled('student_id')
            ? (string) $request->student_id
            : $this->generateNextStudentId();

        $studentProfile = DB::transaction(function () use ($request, $studentId) {
            $program = $this->resolveProgramRecord($request->department, $request->program);
            $user = User::create([
                'first_name' => $request->first_name,
                'last_name'  => $request->last_name,
                'suffix'    => $request->input('suffix'),
                'name'      => trim(implode(' ', array_filter([$request->first_name, $request->last_name, $request->input('suffix')]))),
                'email'     => $request->email,
                'password'  => Hash::make($request->temporary_password),
                'role'      => 'student',
                'is_active' => DB::raw('true'),
            ]);

            $profile = StudentProfile::create([
                'user_id'    => $user->id,
                'student_id' => $studentId,
                'department' => $request->department,
                'program_id' => $program?->id,
                'course_id' => $program?->id,
                'program'    => $program?->code ?: $request->program,
                'course' => $program?->code ?: $request->program,
                'year_level' => $request->year_level,
                'adviser_id' => $request->user()->id,
                'created_by' => $request->user()->id,
            ]);

            Conversation::firstOrCreate(
                $this->sortedParticipantAttributes($user->id, $request->user()->id),
                [
                    'student_id' => $user->id,
                    'faculty_id' => $request->user()->id,
                ],
            );

            return $profile;
        });

        $this->logger->log($request->user(), 'student.created', 'user', $studentProfile->user_id, [
            'student_name' => $studentProfile->user?->name,
        ]);

        $this->notifications->notify(
            $request->user(),
            'student.created',
            'Student account created successfully',
            $studentProfile->user?->name,
            [
                'student_user_id' => $studentProfile->user_id,
                'student_profile_id' => $studentProfile->id,
            ],
        );

        return response()->json(['data' => $studentProfile->load('user:id,name,email', 'programModel:id,name,code')], 201);
    }

    private function generateNextStudentId(): string
    {
        $yearCode = now()->format('y');
        $prefix = "STU-{$yearCode}-";

        $latestMatch = StudentProfile::query()
            ->pluck('student_id')
            ->map(function (?string $studentId) {
                if (!$studentId || !preg_match('/(\d+)$/', $studentId, $matches)) {
                    return 0;
                }

                return (int) $matches[1];
            })
            ->max();

        $nextNumber = ((int) $latestMatch) + 1;

        return sprintf('%s%04d', $prefix, $nextNumber);
    }

    public function show(string $id): JsonResponse
    {
        $student = StudentProfile::with('user:id,name,email')->findOrFail($id);

        return response()->json(['data' => $student]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $student = StudentProfile::with('user')->findOrFail($id);
        $user = $student->user;

        $request->validate([
            'first_name'         => 'required|string|max:255',
            'last_name'          => 'required|string|max:255',
            'suffix'             => 'nullable|string|max:50',
            'email'              => 'required|email|unique:users,email,' . $user->id,
            'temporary_password' => 'nullable|string|min:8',
            'student_id'         => 'required|string|unique:student_profiles,student_id,' . $student->id,
            'department'         => 'required|string',
            'program'            => 'required|string',
            'year_level'         => 'nullable|integer',
        ]);

        DB::transaction(function () use ($request, $student, $user) {
            $program = $this->resolveProgramRecord($request->department, $request->program);
            $userPayload = [
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'suffix' => $request->input('suffix'),
                'name' => trim(implode(' ', array_filter([$request->first_name, $request->last_name, $request->input('suffix')]))),
                'email' => $request->email,
            ];

            if ($request->filled('temporary_password')) {
                $userPayload['password'] = Hash::make($request->temporary_password);
            }

            $user->update($userPayload);

            $student->update([
                'student_id' => $request->student_id,
                'department' => $request->department,
                'program_id' => $program?->id,
                'course_id' => $program?->id,
                'program' => $program?->code ?: $request->program,
                'course' => $program?->code ?: $request->program,
                'year_level' => $request->year_level,
            ]);
        });

        $this->logger->log($request->user(), 'student.updated', 'user', $student->user_id);

        $this->notifications->notify(
            $request->user(),
            'student.updated',
            'Student account edited successfully',
            $student->user?->name,
            [
                'student_user_id' => $student->user_id,
                'student_profile_id' => $student->id,
            ],
        );

        return response()->json(['data' => $student->fresh()->load('user', 'programModel:id,name,code')]);
    }

    public function destroy(string $id): JsonResponse
    {
        $student = StudentProfile::with('user')->findOrFail($id);
        $user = $student->user;
        $actor = request()->user();

        if ($actor?->role === 'faculty' && $student->adviser_id !== $actor->id) {
            return response()->json([
                'message' => 'You can only remove advisees assigned to your account.',
            ], 403);
        }

        DB::transaction(function () use ($student, $user) {
            Thesis::query()
                ->where('submitted_by', $student->user_id)
                ->update([
                    'submitter_name' => DB::raw("COALESCE(submitter_name, " . DB::getPdo()->quote((string) ($user?->name ?? 'Former student')) . ')'),
                ]);

            if ($user) {
                $user->delete();
            }
        });

        if ($actor) {
            $this->logger->log($actor, 'student.deleted', 'user', $student->user_id, [
                'student_name' => $user?->name,
                'preserved_thesis_records' => true,
            ]);
        }

        return response()->json([
            'message' => 'Student account deleted. Thesis records were preserved.',
        ]);
    }

    private function sortedParticipantAttributes(string $firstUserId, string $secondUserId): array
    {
        $participants = collect([$firstUserId, $secondUserId])->sort()->values();

        return [
            'participant_one_id' => $participants->get(0),
            'participant_two_id' => $participants->get(1),
        ];
    }

    private function resolveProgramRecord(?string $department, ?string $program): ?Program
    {
        $normalizedProgram = trim((string) $program);

        if ($normalizedProgram === '') {
            return null;
        }

        return Program::query()
            ->when(filled($department), function ($query) use ($department) {
                $query->whereHas('department', fn ($departmentQuery) => $departmentQuery->where('name', trim((string) $department)));
            })
            ->where(function ($query) use ($normalizedProgram) {
                $query
                    ->where('name', $normalizedProgram)
                    ->orWhere('code', $normalizedProgram);
            })
            ->first();
    }

    private function programDisplayLabel(StudentProfile $profile): ?string
    {
        return $profile->programModel?->code ?: $profile->program;
    }
}
