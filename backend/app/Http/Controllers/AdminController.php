<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\College;
use App\Models\Department;
use App\Models\FacultyProfile;
use App\Models\Program;
use App\Models\Section;
use App\Models\StudentProfile;
use App\Models\Thesis;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function __construct(private ActivityLogService $logger) {}

    public function dashboard(Request $request): JsonResponse
    {
        $now = now();
        $selectedYear = (int) $request->integer('year', $now->year);
        $minYear = max($now->year - 5, 2000);
        $selectedYear = min(max($selectedYear, $minYear), $now->year);
        $recentUploadsLimit = min(max((int) $request->integer('recent_uploads_limit', 8), 1), 50);
        $recentActivityLimit = min(max((int) $request->integer('recent_activity_limit', 6), 1), 50);
        $monthlySubmissions = collect(range(1, 12))
            ->map(function (int $month) use ($selectedYear) {
                $count = Thesis::query()
                    ->whereYear('created_at', $selectedYear)
                    ->whereMonth('created_at', $month)
                    ->count();

                return [
                    'month' => Carbon::create($selectedYear, $month, 1)->format('M'),
                    'value' => $count,
                ];
            })
            ->values();

        $departmentUploads = Thesis::query()
            ->select('department')
            ->selectRaw('COUNT(*) as total')
            ->whereYear('created_at', $selectedYear)
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->groupBy('department')
            ->orderByDesc('total')
            ->limit(7)
            ->get()
            ->map(fn ($row) => [
                'label' => $this->departmentShortCode((string) $row->department),
                'name' => (string) $row->department,
                'value' => (int) $row->total,
            ])
            ->values();

        $recentUploads = Thesis::query()
            ->with(['submitter:id,name', 'category:id,name'])
            ->orderByDesc('created_at')
            ->limit($recentUploadsLimit)
            ->get()
            ->map(fn (Thesis $thesis) => [
                'id' => $thesis->id,
                'title' => $thesis->title,
                'author' => collect($thesis->authors ?? [])->filter()->implode(', ') ?: ($thesis->submitter?->name ?? 'Unknown author'),
                'category' => $thesis->category?->name,
                'status' => $thesis->status,
                'department' => $thesis->department,
                'program' => $thesis->program,
                'course' => $thesis->course,
                'created_at' => optional($thesis->created_at)?->toISOString(),
            ]);

        $recentActivityActions = [
            'student.created',
            'student.updated',
            'student.deleted',
            'faculty.created',
            'faculty.updated',
            'faculty.role_changed',
            'faculty.status_changed',
            'admin.user_created',
            'admin.user_updated',
            'admin.user_status_updated',
            'thesis.submitted',
            'thesis.approved',
            'thesis.rejected',
            'thesis.archived',
            'thesis.uploaded',
        ];

        $recentActivity = ActivityLog::query()
            ->with('user:id,name')
            ->whereIn('action', $recentActivityActions)
            ->orderByDesc('created_at')
            ->limit($recentActivityLimit)
            ->get()
            ->map(fn (ActivityLog $log) => [
                'id' => $log->id,
                'title' => $this->formatAdminActivityTitle($log),
                'actor' => $log->user?->name ?? 'System',
                'action' => $log->action,
                'tone' => $this->formatAdminActivityTone($log->action),
                'timestamp' => optional($log->created_at)?->toISOString(),
                'relative_time' => $log->created_at?->diffForHumans(),
            ])
            ->values();

        $totalTheses = Thesis::query()->count();
        $currentMonthTheses = Thesis::query()
            ->whereYear('created_at', $now->year)
            ->whereMonth('created_at', $now->month)
            ->count();
        $previousMonthTheses = Thesis::query()
            ->whereYear('created_at', $now->copy()->subMonth()->year)
            ->whereMonth('created_at', $now->copy()->subMonth()->month)
            ->count();
        $monthlyGrowth = $previousMonthTheses > 0
            ? round((($currentMonthTheses - $previousMonthTheses) / $previousMonthTheses) * 100, 1)
            : ($currentMonthTheses > 0 ? 100.0 : 0.0);
        $approvedTheses = Thesis::query()->where('status', 'approved')->count();
        $pendingTheses = Thesis::query()->whereIn('status', ['pending', 'under_review'])->count();
        $revisionsNeeded = Thesis::query()->where('status', 'rejected')->count();

        return response()->json([
            'data' => [
                'stats' => [
                    'total_students' => User::query()->where('role', 'student')->count(),
                    'total_faculty' => User::query()->where('role', 'faculty')->count(),
                    'total_thesis_uploads' => Thesis::query()->count(),
                    'total_categories' => Category::query()->count(),
                    'active_users' => User::query()->whereRaw('"is_active" = true')->count(),
                    'colleges' => College::query()->count(),
                    'departments' => Department::query()->count(),
                    'programs' => Program::query()->count(),
                    'sections' => Section::query()->count(),
                ],
                'dashboard_metrics' => [
                    'total_theses' => $totalTheses,
                    'approved' => $approvedTheses,
                    'under_review' => $pendingTheses,
                    'revisions_needed' => $revisionsNeeded,
                    'monthly_growth_percentage' => $monthlyGrowth,
                ],
                'available_years' => collect(range($now->year, $minYear, -1))->values(),
                'selected_year' => $selectedYear,
                'monthly_submissions' => $monthlySubmissions,
                'department_uploads' => $departmentUploads,
                'recent_uploads' => $recentUploads,
                'recent_activity' => $recentActivity,
                'system_statistics' => [
                    'archived_theses' => Thesis::query()->whereRaw('"is_archived" = true')->count(),
                    'pending_theses' => Thesis::query()->whereIn('status', ['pending', 'under_review'])->count(),
                    'approved_theses' => Thesis::query()->where('status', 'approved')->count(),
                    'inactive_users' => User::query()->whereRaw('"is_active" = false')->count(),
                ],
            ],
        ]);
    }

    private function departmentShortCode(string $department): string
    {
        $words = collect(preg_split('/[\s\-]+/', trim($department)) ?: [])
            ->filter(fn (?string $word) => filled($word) && !in_array(strtolower((string) $word), ['of', 'and', 'department'], true))
            ->values();

        if ($words->isEmpty()) {
            return str($department)->upper()->substr(0, 3)->toString();
        }

        return $words
            ->take(4)
            ->map(fn (string $word) => strtoupper(substr($word, 0, 1)))
            ->implode('');
    }

    private function formatAdminActivityTitle(ActivityLog $log): string
    {
        $meta = is_array($log->meta) ? $log->meta : [];

        return match ($log->action) {
            'student.created' => 'New student account created',
            'student.updated' => 'Student account updated',
            'student.deleted' => 'Student account removed',
            'faculty.created' => 'New faculty account created',
            'faculty.updated' => 'Faculty account updated',
            'faculty.role_changed' => 'Faculty role assignment updated',
            'faculty.status_changed' => 'Faculty account status changed',
            'admin.user_created' => 'Admin created a user account',
            'admin.user_updated' => 'Admin updated a user account',
            'admin.user_status_updated' => 'Admin changed an account status',
            'thesis.submitted' => 'New thesis submitted for review',
            'thesis.approved' => 'A thesis submission was approved',
            'thesis.rejected' => 'A thesis submission needs revision',
            'thesis.archived' => 'A thesis was archived',
            'thesis.uploaded' => 'A thesis record was uploaded',
            default => filled($meta['identifier'] ?? null)
                ? sprintf('Activity recorded for %s', (string) $meta['identifier'])
                : str($log->action)->replace('.', ' ')->replace('_', ' ')->title()->toString(),
        };
    }

    private function formatAdminActivityTone(string $action): string
    {
        return match ($action) {
            'thesis.approved', 'student.created', 'faculty.created', 'admin.user_created' => 'green',
            'thesis.submitted', 'thesis.uploaded', 'student.updated', 'faculty.updated', 'faculty.role_changed', 'admin.user_updated' => 'blue',
            'thesis.rejected', 'admin.user_status_updated' => 'orange',
            default => 'rose',
        };
    }

    public function users(Request $request): JsonResponse
    {
        $role = $request->query('role');
        $search = trim((string) $request->query('search', ''));

        $users = User::query()
            ->with([
                'faculty.college:id,name',
                'faculty.departmentModel:id,name',
                'student.college:id,name',
                'student.departmentModel:id,name',
                'student.programModel:id,name',
                'student.sectionModel:id,name',
            ])
            ->when(
                in_array($role, ['faculty', 'student'], true),
                fn ($query) => $query->where('role', $role),
                fn ($query) => $query->whereIn('role', ['faculty', 'student'])
            )
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($searchQuery) use ($search) {
                    $searchQuery
                        ->where('name', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%");
                });
            })
            ->orderBy('role')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => $this->formatManagedUser($user));

        return response()->json(['data' => $users]);
    }

    public function storeUser(Request $request): JsonResponse
    {
        $validated = $request->validate($this->userValidationRules());
        $isActive = $this->normalizeBooleanInput($validated['is_active'] ?? null, true);

        $user = DB::transaction(function () use ($validated, $request, $isActive) {
            $user = new User();
            $user->first_name = $validated['first_name'];
            $user->last_name = $validated['last_name'];
            $user->suffix = $validated['suffix'] ?? null;
            $user->email = $validated['email'];
            $user->password = Hash::make($validated['temporary_password']);
            $user->role = $validated['role'];
            $user->save();

            $this->syncUserActiveState($user, $isActive);
            $this->upsertRoleProfile($user, $validated, $request->user()?->id, $isActive);

            return $user->fresh()->load([
                'faculty.college:id,name',
                'faculty.departmentModel:id,name',
                'student.college:id,name',
                'student.departmentModel:id,name',
                'student.programModel:id,name',
                'student.sectionModel:id,name',
            ]);
        });

        $this->logger->log($request->user(), 'admin.user_created', 'user', $user->id, ['role' => $user->role]);

        return response()->json(['data' => $this->formatManagedUser($user)], 201);
    }

    public function updateUser(Request $request, string $id): JsonResponse
    {
        $user = User::query()->with(['faculty', 'student'])->findOrFail($id);
        $validated = $request->validate($this->userValidationRules($user->id, false));
        $isActive = $this->normalizeBooleanInput($validated['is_active'] ?? null, (bool) $user->is_active);

        DB::transaction(function () use ($user, $validated, $request, $isActive) {
            $user->first_name = $validated['first_name'];
            $user->last_name = $validated['last_name'];
            $user->suffix = $validated['suffix'] ?? null;
            $user->email = $validated['email'];
            if (!empty($validated['temporary_password'])) {
                $user->password = Hash::make($validated['temporary_password']);
            }
            $user->save();
            $this->syncUserActiveState($user, $isActive);
            $this->upsertRoleProfile($user, $validated, $request->user()?->id, $isActive);
        });

        $freshUser = $user->fresh()->load([
            'faculty.college:id,name',
            'faculty.departmentModel:id,name',
            'student.college:id,name',
            'student.departmentModel:id,name',
            'student.programModel:id,name',
            'student.sectionModel:id,name',
        ]);

        $this->logger->log($request->user(), 'admin.user_updated', 'user', $freshUser->id, ['role' => $freshUser->role]);

        return response()->json(['data' => $this->formatManagedUser($freshUser)]);
    }

    public function toggleUserStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $user = User::query()->findOrFail($id);
        $this->syncUserActiveState($user, $this->normalizeBooleanInput($validated['is_active']));

        $this->logger->log($request->user(), 'admin.user_status_updated', 'user', $user->id, ['is_active' => $user->is_active]);

        return response()->json(['data' => $this->formatManagedUser($user->fresh()->load(['faculty', 'student']))]);
    }

    public function categories(): JsonResponse
    {
        return response()->json([
            'data' => Category::query()->orderBy('sort_order')->orderBy('name')->get(),
        ]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name'],
            'slug' => ['required', 'string', 'max:255', 'unique:categories,slug'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);
        $isActive = $this->normalizeBooleanInput($validated['is_active'] ?? null, true);

        $category = Category::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['slug']),
            'description' => $validated['description'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $isActive,
        ]);

        return response()->json(['data' => $category], 201);
    }

    public function updateCategory(Request $request, string $id): JsonResponse
    {
        $category = Category::query()->findOrFail($id);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('categories', 'name')->ignore($category->id)],
            'slug' => ['required', 'string', 'max:255', Rule::unique('categories', 'slug')->ignore($category->id)],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);
        $isActive = $this->normalizeBooleanInput($validated['is_active'] ?? null, (bool) $category->is_active);

        Category::query()
            ->whereKey($category->id)
            ->update([
                'name' => $validated['name'],
                'slug' => Str::slug($validated['slug']),
                'description' => $validated['description'] ?? null,
                'sort_order' => $validated['sort_order'] ?? $category->sort_order,
                'is_active' => DB::raw($isActive ? 'true' : 'false'),
                'updated_at' => now(),
            ]);

        return response()->json(['data' => $category->fresh()]);
    }

    public function structure(Request $request): JsonResponse
    {
        $this->bootstrapAcademicStructure();

        $isAdminRoute = $request->is('api/admin/*');

        $colleges = College::query()
            ->when(!$isAdminRoute, fn ($query) => $query->whereRaw('is_active = true'))
            ->with([
                'departments' => function ($departmentQuery) use ($isAdminRoute) {
                    $departmentQuery
                        ->when(!$isAdminRoute, fn ($query) => $query->whereRaw('is_active = true'))
                        ->with([
                            'programs' => function ($programQuery) use ($isAdminRoute) {
                                $programQuery
                                    ->when(!$isAdminRoute, fn ($query) => $query->whereRaw('is_active = true'))
                                    ->with([
                                        'sections' => function ($sectionQuery) use ($isAdminRoute) {
                                            $sectionQuery
                                                ->when(!$isAdminRoute, fn ($query) => $query->whereRaw('is_active = true'))
                                                ->orderBy('name');
                                        },
                                    ])
                                    ->orderBy('name');
                            },
                        ])
                        ->orderBy('name');
                },
            ])
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $colleges]);
    }

    public function storeCollege(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:colleges,name'],
            'code' => ['nullable', 'string', 'max:50', 'unique:colleges,code'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $college = College::create($validated);

        return response()->json(['data' => $college], 201);
    }

    public function updateCollege(Request $request, string $id): JsonResponse
    {
        $college = College::query()->findOrFail($id);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('colleges', 'name')->ignore($college->id)],
            'code' => ['nullable', 'string', 'max:50', Rule::unique('colleges', 'code')->ignore($college->id)],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $college->update($validated);

        return response()->json(['data' => $college->fresh()]);
    }

    public function storeDepartment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'college_id' => ['required', 'uuid', 'exists:colleges,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $department = Department::create($validated);

        return response()->json(['data' => $department], 201);
    }

    public function updateDepartment(Request $request, string $id): JsonResponse
    {
        $department = Department::query()->findOrFail($id);
        $validated = $request->validate([
            'college_id' => ['required', 'uuid', 'exists:colleges,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $department->update($validated);

        return response()->json(['data' => $department->fresh()]);
    }

    public function storeProgram(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'department_id' => ['required', 'uuid', 'exists:departments,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $program = Program::create($validated);

        return response()->json(['data' => $program], 201);
    }

    public function updateProgram(Request $request, string $id): JsonResponse
    {
        $program = Program::query()->findOrFail($id);
        $validated = $request->validate([
            'department_id' => ['required', 'uuid', 'exists:departments,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $program->update($validated);

        return response()->json(['data' => $program->fresh()]);
    }

    public function storeSection(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'program_id' => ['required', 'uuid', 'exists:programs,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $section = Section::create($validated);

        return response()->json(['data' => $section], 201);
    }

    public function updateSection(Request $request, string $id): JsonResponse
    {
        $section = Section::query()->findOrFail($id);
        $validated = $request->validate([
            'program_id' => ['required', 'uuid', 'exists:programs,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $section->update($validated);

        return response()->json(['data' => $section->fresh()]);
    }

    private function userValidationRules(?string $userId = null, bool $requirePassword = true): array
    {
        $passwordRules = $requirePassword
            ? ['required', 'string', 'min:8']
            : ['nullable', 'string', 'min:8'];

        return [
            'role' => ['required', Rule::in(['faculty', 'student'])],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'suffix' => ['nullable', 'string', 'max:50'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($userId)],
            'temporary_password' => $passwordRules,
            'is_active' => ['nullable', 'boolean'],
            'faculty_id' => ['nullable', 'string', Rule::unique('faculty_profiles', 'faculty_id')->ignore($userId, 'user_id')],
            'student_id' => ['nullable', 'string', Rule::unique('student_profiles', 'student_id')->ignore($userId, 'user_id')],
            'college_id' => ['nullable', 'uuid', 'exists:colleges,id'],
            'department_id' => ['nullable', 'uuid', 'exists:departments,id'],
            'program_id' => ['nullable', 'uuid', 'exists:programs,id'],
            'course_id' => ['nullable', 'uuid', 'exists:programs,id'],
            'section_id' => ['nullable', 'uuid', 'exists:sections,id'],
            'section' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'college' => ['nullable', 'string', 'max:255'],
            'program' => ['nullable', 'string', 'max:255'],
            'course' => ['nullable', 'string', 'max:255'],
            'faculty_role' => ['nullable', 'string', 'max:255'],
            'rank' => ['nullable', 'string', 'max:255'],
            'year_level' => ['nullable', 'integer', 'min:1', 'max:10'],
        ];
    }

    private function upsertRoleProfile(User $user, array $validated, ?string $actorId, bool $isActive): void
    {
        if ($user->role === 'faculty') {
            $department = $this->resolveDepartmentName($validated['department_id'] ?? null, $validated['department'] ?? null);
            $college = $this->resolveCollegeName($validated['college_id'] ?? null, $validated['college'] ?? null, $validated['department_id'] ?? null);

            FacultyProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'faculty_id' => $validated['faculty_id'] ?? $this->generateFacultyId(),
                    'department' => $department,
                    'college' => $college,
                    'college_id' => $validated['college_id'] ?? null,
                    'department_id' => $validated['department_id'] ?? null,
                    'rank' => $validated['rank'] ?? null,
                    'faculty_role' => $validated['faculty_role'] ?? 'Faculty',
                    'status' => $isActive ? 'active' : 'inactive',
                    'created_by' => $actorId,
                ]
            );

            $user->student()?->delete();
        }

        if ($user->role === 'student') {
            $department = $this->resolveDepartmentName($validated['department_id'] ?? null, $validated['department'] ?? null);
            $college = $this->resolveCollegeName($validated['college_id'] ?? null, $validated['college'] ?? null, $validated['department_id'] ?? null);
            $programId = $validated['course_id'] ?? $validated['program_id'] ?? null;
            $program = $this->resolveProgramName($programId, $validated['course'] ?? $validated['program'] ?? null);
            $section = $this->resolveSectionName($validated['section_id'] ?? null, $validated['section'] ?? null);

            StudentProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'student_id' => $validated['student_id'] ?? $this->generateStudentId(),
                    'college_id' => $validated['college_id'] ?? null,
                    'department_id' => $validated['department_id'] ?? null,
                    'program_id' => $programId,
                    'course_id' => $programId,
                    'section_id' => $validated['section_id'] ?? null,
                    'department' => $department,
                    'program' => $program,
                    'course' => $program,
                    'section' => $section,
                    'year_level' => $validated['year_level'] ?? null,
                    'created_by' => $actorId,
                ]
            );

            $user->faculty()?->delete();
        }
    }

    private function formatManagedUser(User $user): array
    {
        $faculty = $user->faculty;
        $student = $user->student;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'suffix' => $user->suffix,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => (bool) $user->is_active,
            'faculty_id' => $faculty?->faculty_id,
            'student_id' => $student?->student_id,
            'college_id' => $faculty?->college_id ?? $student?->college_id,
            'college' => $faculty?->college ?? $student?->college?->name,
            'department_id' => $faculty?->department_id ?? $student?->department_id,
            'department' => $faculty?->department ?? $student?->department,
            'program_id' => $student?->program_id,
            'program' => $student?->program,
            'course_id' => $student?->course_id,
            'course' => $student?->course,
            'section_id' => $student?->section_id,
            'section' => $student?->section,
            'year_level' => $student?->year_level,
            'rank' => $faculty?->rank,
            'faculty_role' => $faculty?->faculty_role,
            'created_at' => optional($user->created_at)?->toISOString(),
        ];
    }

    private function generateFacultyId(): string
    {
        return 'FAC-' . now()->format('Y') . '-' . str_pad((string) (FacultyProfile::query()->count() + 1), 4, '0', STR_PAD_LEFT);
    }

    private function generateStudentId(): string
    {
        return 'STU-' . now()->format('Y') . '-' . str_pad((string) (StudentProfile::query()->count() + 1), 4, '0', STR_PAD_LEFT);
    }

    private function normalizeBooleanInput(mixed $value, bool $default = false): bool
    {
        if ($value === null) {
            return $default;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $default;
    }

    private function syncUserActiveState(User $user, bool $isActive): void
    {
        User::query()
            ->whereKey($user->id)
            ->update([
                'is_active' => DB::raw($isActive ? 'true' : 'false'),
                'updated_at' => now(),
            ]);

        $user->forceFill(['is_active' => $isActive]);
    }

    private function resolveCollegeName(?string $collegeId, ?string $fallback, ?string $departmentId = null): ?string
    {
        if ($collegeId) {
            return College::query()->find($collegeId)?->name;
        }

        if ($departmentId) {
            $department = Department::query()->with('college')->find($departmentId);
            if ($department?->college?->name) {
                return $department->college->name;
            }
        }

        return $fallback ?: null;
    }

    private function resolveDepartmentName(?string $departmentId, ?string $fallback): ?string
    {
        if ($departmentId) {
            return Department::query()->find($departmentId)?->name;
        }

        return $fallback ?: null;
    }

    private function resolveProgramName(?string $programId, ?string $fallback): ?string
    {
        if ($programId) {
            return Program::query()->find($programId)?->name;
        }

        return $fallback ?: null;
    }

    private function resolveSectionName(?string $sectionId, ?string $fallback): ?string
    {
        if ($sectionId) {
            return Section::query()->find($sectionId)?->name;
        }

        return $fallback ?: null;
    }

    private function bootstrapAcademicStructure(): void
    {
        if (College::query()->exists()) {
            return;
        }

        $collegeCodeMap = [
            'COLLEGE OF ARCHITECTURE AND FINE ARTS' => 'CAFA',
            'COLLEGE OF ENGINEERING' => 'COE',
            'COLLEGE OF INDUSTRIAL EDUCATION' => 'CIE',
            'COLLEGE OF INDUSTRIAL TECHNOLOGY' => 'CIT',
            'COLLEGE OF LIBERAL ARTS' => 'CLA',
            'COLLEGE OF SCIENCE' => 'COS',
        ];

        $programMap = [
            'Architecture Department' => [
                ['name' => 'BS Architecture', 'code' => 'BSArch'],
            ],
            'Fine Arts Department' => [
                ['name' => 'BFA', 'code' => 'BFA'],
            ],
            'Graphics Department' => [
                ['name' => 'BS Graphics Technology', 'code' => 'BSGT'],
            ],
            'Mathematics Department' => [
                ['name' => 'Bachelor of Science in Mathematics', 'code' => 'BSMath'],
            ],
            'Computer Studies Department' => [
                ['name' => 'Bachelor of Science in Computer Science', 'code' => 'BSCS'],
                ['name' => 'Bachelor of Science in Information Technology', 'code' => 'BSIT'],
                ['name' => 'Bachelor of Science in Information Systems', 'code' => 'BSIS'],
            ],
            'Mechanical Engineering' => [
                ['name' => 'Bachelor of Science in Mechanical Engineering', 'code' => 'BSME'],
            ],
            'Civil Engineering' => [
                ['name' => 'Bachelor of Science in Civil Engineering', 'code' => 'BSCE'],
            ],
            'Electrical Engineering' => [
                ['name' => 'Bachelor of Science in Electrical Engineering', 'code' => 'BSEE'],
            ],
            'Electronics Communication Engineering' => [
                ['name' => 'Bachelor of Science in Electronics Engineering', 'code' => 'BSECE'],
            ],
            'Hospitality Management Department' => [
                ['name' => 'Bachelor of Science in Hospitality Management', 'code' => 'BSHM'],
            ],
        ];

        $departmentCollegeMap = collect(config('academic.department_college_map', []))
            ->mapWithKeys(fn ($college, $department) => [trim((string) $department) => trim((string) $college)])
            ->filter(fn ($college, $department) => $department !== '' && $college !== '');

        $collegeNames = collect(config('academic.colleges', []))
            ->map(fn ($college) => trim((string) $college))
            ->filter()
            ->merge($departmentCollegeMap->values())
            ->unique()
            ->values();

        DB::transaction(function () use ($collegeCodeMap, $collegeNames, $departmentCollegeMap, $programMap) {
            $colleges = $collegeNames->mapWithKeys(function (string $collegeName) use ($collegeCodeMap) {
                $college = College::query()->firstOrCreate(
                    ['name' => $collegeName],
                    [
                        'code' => $collegeCodeMap[$collegeName] ?? $this->makeAcademicCode($collegeName),
                        'is_active' => 'true',
                    ],
                );

                return [$collegeName => $college];
            });

            $departmentCollegeMap->each(function (string $collegeName, string $departmentName) use ($colleges, $programMap) {
                $college = $colleges->get($collegeName);
                if (!$college) {
                    return;
                }

                $department = Department::query()->firstOrCreate(
                    [
                        'college_id' => $college->id,
                        'name' => $departmentName,
                    ],
                    [
                        'code' => $this->makeAcademicCode($departmentName),
                        'is_active' => 'true',
                    ],
                );

                foreach ($programMap[$departmentName] ?? [] as $programData) {
                    Program::query()->firstOrCreate(
                        [
                            'department_id' => $department->id,
                            'name' => $programData['name'],
                        ],
                        [
                            'code' => $programData['code'],
                            'is_active' => 'true',
                        ],
                    );
                }
            });
        });
    }

    private function makeAcademicCode(string $name): string
    {
        $words = collect(preg_split('/\s+/', trim($name)) ?: [])
            ->filter()
            ->reject(fn (string $word) => in_array(strtolower($word), ['of', 'and', 'the', 'in'], true))
            ->map(fn (string $word) => strtoupper(substr($word, 0, 1)));

        return $words->take(4)->implode('');
    }
}
