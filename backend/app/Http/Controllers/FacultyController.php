<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\FacultyProfile;
use App\Models\SearchLog;
use App\Models\SharedFile;
use App\Models\SharedFileRecipient;
use App\Models\StudentProfile;
use App\Models\Thesis;
use App\Models\Category;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\DailyQuoteService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class FacultyController extends Controller
{
    private const FACULTY_ACTIVITY_ACTIONS = [
        'thesis.approved',
        'thesis.rejected',
        'thesis.archived',
        'faculty.created',
        'faculty.updated',
    ];

    public function __construct(
        private ActivityLogService $logger,
        private DailyQuoteService $dailyQuoteService,
        private NotificationService $notifications,
    ) {}

    public function profile(Request $request): JsonResponse
    {
        $profile = FacultyProfile::query()
            ->with('user')
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $adviseeCount = StudentProfile::query()
            ->where('adviser_id', $request->user()->id)
            ->count();

        return response()->json([
            'data' => $this->formatFacultyProfile($profile, $adviseeCount),
        ]);
    }

    public function activityLog(Request $request): JsonResponse
    {
        $facultyProfile = FacultyProfile::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $logs = ActivityLog::with([
                'user:id,name,avatar_url',
                'user.faculty:user_id,department',
                'user.student:user_id,department',
            ])
            ->where(function ($query) use ($request, $facultyProfile) {
                $query->where(function ($actionQuery) {
                    $actionQuery->whereIn('action', self::FACULTY_ACTIVITY_ACTIONS);
                })->where(function ($scopeQuery) use ($request, $facultyProfile) {
                    $scopeQuery->where('user_id', $request->user()->id)
                    ->orWhere(function ($nested) use ($facultyProfile) {
                        $nested->where('subject_type', 'thesis')
                            ->whereIn('subject_id', Thesis::query()
                                ->where('department', $facultyProfile->department)
                                ->pluck('id'));
                    });
                });
            })
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        $thesisIds = $logs->where('subject_type', 'thesis')->pluck('subject_id')->filter()->unique()->values();
        $theses = Thesis::query()
            ->whereIn('id', $thesisIds)
            ->with('submitter:id,name', 'adviser:id,name')
            ->get()
            ->keyBy('id');

        $departments = collect([$facultyProfile->department])
            ->merge($logs->pluck('user.student.department'))
            ->merge($logs->pluck('user.faculty.department'))
            ->merge($theses->pluck('department'))
            ->filter()
            ->unique()
            ->sort()
            ->values();

        $formattedLogs = $logs->map(function (ActivityLog $log) use ($theses) {
            $subjectThesis = $log->subject_type === 'thesis' ? $theses->get($log->subject_id) : null;
            [$badge, $tone, $cta] = $this->presentFacultyActivityAction($log->action);

            return [
                'id' => $log->id,
                'user_id' => $log->user_id,
                'badge' => $badge,
                'tone' => $tone,
                'request_record' => $this->buildFacultyActivityRecordLabel($log, $subjectThesis),
                'account' => $log->user?->name ?? $subjectThesis?->submitter?->name ?? 'System',
                'department' => $subjectThesis?->department ?? $log->user?->faculty?->department ?? $facultyProfile->department,
                'time' => $log->created_at?->diffForHumans(),
                'timestamp' => optional($log->created_at)?->toISOString(),
                'action' => $cta,
            ];
        })->values();

        $summary = [
            'actions_today' => $logs->filter(fn (ActivityLog $log) => $log->created_at?->isToday())->count(),
            'approvals' => $logs->where('action', 'thesis.approved')->count(),
            'files_shared' => $logs->where('action', 'thesis.archived')->count(),
            'notes_added' => $logs->whereIn('action', ['thesis.rejected', 'faculty.created', 'faculty.updated'])->count(),
            'last_activity' => optional($logs->first()?->created_at)?->diffForHumans() ?? 'No recent activity',
        ];

        return response()->json([
            'data' => [
                'summary' => $summary,
                'departments' => $departments,
                'logs' => $formattedLogs,
            ],
        ]);
    }

    public function libraryIndex(Request $request): JsonResponse
    {
        $facultyProfile = FacultyProfile::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $items = $this->visibleSharedFilesForFaculty($request->user(), $facultyProfile)
            ->with(['uploader:id,name,email', 'category:id,name,slug', 'recipients.user:id,name,email'])
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        $latestTimestamp = $items
            ->pluck('created_at')
            ->filter()
            ->max();
        $configuredColleges = collect(config('academic.colleges', []))
            ->filter()
            ->map(fn ($college) => trim((string) $college))
            ->unique()
            ->sort()
            ->values();
        $configuredDepartmentMap = collect(config('academic.department_college_map', []))
            ->filter(fn ($college, $department) => filled($department) && filled($college));
        $profileDepartmentMap = FacultyProfile::query()
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->get(['department', 'college'])
            ->mapWithKeys(function (FacultyProfile $profile) {
                $department = trim((string) $profile->department);
                $college = trim((string) ($profile->college ?? ''));

                return $department !== '' && $college !== ''
                    ? [$department => $college]
                    : [];
            });
        $mergedDepartmentMap = $configuredDepartmentMap
            ->merge($profileDepartmentMap)
            ->mapWithKeys(fn ($college, $department) => [trim((string) $department) => trim((string) $college)])
            ->filter(fn ($college, $department) => $department !== '' && $college !== '');
        $departmentsByCollege = $configuredColleges
            ->mapWithKeys(function (string $college) use ($mergedDepartmentMap) {
                $departments = $mergedDepartmentMap
                    ->filter(fn ($mappedCollege) => $mappedCollege === $college)
                    ->keys()
                    ->sort()
                    ->values()
                    ->all();

                return [$college => $departments];
            });
        $availableColleges = $configuredColleges->all();

        return response()->json([
            'data' => [
                'department' => $facultyProfile->department,
                'college' => $facultyProfile->college,
                'stats' => [
                    'total_files' => $items->count(),
                    'shared_libraries' => $items->where('is_draft', false)->count(),
                    'files_needing_review' => $items->where('is_draft', true)->count(),
                    'storage_used' => $items->isEmpty()
                        ? 0
                        : (int) round(($items->filter(fn (SharedFile $file) => filled($file->file_url))->count() / $items->count()) * 100),
                    'last_sync' => $this->formatIsoTimestamp($latestTimestamp),
                ],
                'share_options' => [
                    'scopes' => [
                        ['value' => 'all_colleges', 'label' => 'All Colleges'],
                        ['value' => 'all_departments', 'label' => 'All Departments'],
                        ['value' => 'specific_college', 'label' => 'Specific College'],
                        ['value' => 'specific_department', 'label' => 'Specific Department'],
                        ['value' => 'specific_users', 'label' => 'Specific User'],
                    ],
                    'colleges' => $availableColleges,
                    'departments_by_college' => $departmentsByCollege,
                ],
                'items' => $items->map(function (SharedFile $file) {
                    return [
                        'id' => $file->id,
                        'title' => $file->title,
                        'type' => $file->resource_type,
                        'author' => collect($file->authors ?? [])->filter()->implode(', ') ?: ($file->uploader?->name ?? 'Unknown author'),
                        'department' => $file->department,
                        'college' => $file->college,
                        'program' => $file->program,
                        'category' => $this->resolveSharedFileCategorySummaries($file)[0]['name'] ?? $file->category?->name,
                        'categories' => $this->resolveSharedFileCategorySummaries($file),
                        'category_ids' => collect($file->category_ids ?? [])->filter()->values()->all(),
                        'year' => $file->created_at?->format('Y'),
                        'file_url' => $file->file_url,
                        'file_name' => $file->file_name,
                        'is_draft' => (bool) $file->is_draft,
                        'share_scope' => $file->share_scope,
                        'share_scope_label' => $this->presentShareScopeLabel($file),
                        'shared_with_count' => $file->share_scope === 'specific_users'
                            ? $file->recipients->count()
                            : null,
                        'shared_with_users' => $file->share_scope === 'specific_users'
                            ? $file->recipients
                                ->map(fn (SharedFileRecipient $recipient) => [
                                    'id' => $recipient->user?->id,
                                    'name' => $recipient->user?->name,
                                    'email' => $recipient->user?->email,
                                ])
                                ->filter(fn (array $recipient) => filled($recipient['id']))
                                ->values()
                                ->all()
                            : [],
                        'created_at' => $this->formatIsoTimestamp($file->created_at),
                        'shared_at' => $this->formatIsoTimestamp($file->shared_at),
                    ];
                })->values(),
            ],
        ]);
    }

    public function libraryShow(Request $request, string $id): JsonResponse
    {
        $facultyProfile = FacultyProfile::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $file = $this->visibleSharedFilesForFaculty($request->user(), $facultyProfile)
            ->with(['category:id,name,slug', 'uploader:id,name', 'recipients.user:id,name,email'])
            ->findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $file->id,
                'title' => $file->title,
                'type' => $file->resource_type,
                'author' => collect($file->authors ?? [])->filter()->implode(', ') ?: ($file->uploader?->name ?? 'Unknown author'),
                'authors' => collect($file->authors ?? [])->filter()->values()->all(),
                'abstract' => $file->abstract,
                'keywords' => collect($file->keywords ?? [])->filter()->values()->all(),
                'category_id' => $file->category_id,
                'department' => $file->department ?: $facultyProfile->department,
                'college' => $file->college ?: $facultyProfile->college,
                'program' => $file->program,
                'category' => $this->resolveSharedFileCategorySummaries($file)[0]['name'] ?? $file->category?->name,
                'categories' => $this->resolveSharedFileCategorySummaries($file),
                'category_ids' => collect($file->category_ids ?? [])->filter()->values()->all(),
                'school_year' => $file->school_year,
                'year' => $file->created_at?->format('Y'),
                'file_url' => $file->file_url,
                'file_name' => $file->file_name,
                'is_draft' => (bool) $file->is_draft,
                'share_scope' => $file->share_scope,
                'share_scope_label' => $this->presentShareScopeLabel($file),
                'target_college' => $file->target_college,
                'target_department' => $file->target_department,
                'shared_with_count' => $file->share_scope === 'specific_users' ? $file->recipients->count() : null,
                'shared_with_users' => $file->share_scope === 'specific_users'
                    ? $file->recipients
                        ->map(fn (SharedFileRecipient $recipient) => [
                            'id' => $recipient->user?->id,
                            'name' => $recipient->user?->name,
                            'email' => $recipient->user?->email,
                        ])
                        ->filter(fn (array $recipient) => filled($recipient['id']))
                        ->values()
                        ->all()
                    : [],
                'created_at' => $this->formatIsoTimestamp($file->created_at),
                'shared_at' => $this->formatIsoTimestamp($file->shared_at),
            ],
        ]);
    }

    public function updateLibraryItem(Request $request, string $id): JsonResponse
    {
        $facultyProfile = FacultyProfile::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $file = SharedFile::query()
            ->where('uploaded_by', $request->user()->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:500',
            'resource_type' => 'required|string|max:100',
            'abstract' => 'nullable|string',
            'keywords' => 'nullable|array',
            'keywords.*' => 'string|max:100',
            'college' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'category_id' => 'required|uuid|exists:categories,id',
            'category_ids' => 'nullable|array|min:1|max:5',
            'category_ids.*' => 'uuid|exists:categories,id|distinct',
            'school_year' => 'required|string|max:255',
            'authors' => 'nullable|array',
            'authors.*' => 'string|max:255',
            'share_scope' => 'required|in:all_colleges,all_departments,specific_college,specific_department,specific_users',
            'target_college' => 'nullable|string|max:255|required_if:share_scope,specific_college',
            'target_department' => 'nullable|string|max:255|required_if:share_scope,specific_department',
            'recipient_ids' => 'nullable|array|required_if:share_scope,specific_users|min:1',
            'recipient_ids.*' => 'uuid|exists:users,id',
            'is_draft' => 'nullable|boolean',
            'file' => 'nullable|file|max:51200',
            'file_name' => 'nullable|string|max:255',
        ]);

        $isDraft = (bool) ($validated['is_draft'] ?? false);
        $categoryIds = collect($validated['category_ids'] ?? [$validated['category_id']])
            ->filter()
            ->unique()
            ->values()
            ->all();
        $primaryCategoryId = $categoryIds[0] ?? $validated['category_id'];
        $shareScope = (string) $validated['share_scope'];
        $recipientIds = collect($validated['recipient_ids'] ?? [])
            ->filter()
            ->unique()
            ->values();
        $uploadedFile = $request->file('file');
        $fileUpload = $uploadedFile ? $this->uploadToSupabase($uploadedFile, 'shared-resources') : null;

        DB::transaction(function () use ($file, $validated, $isDraft, $shareScope, $recipientIds, $fileUpload, $facultyProfile) {
            $file->update([
                'category_id' => $primaryCategoryId,
                'category_ids' => $categoryIds,
                'title' => $validated['title'],
                'resource_type' => $validated['resource_type'],
                'abstract' => $validated['abstract'] ?? null,
                'keywords' => $validated['keywords'] ?? [],
                'authors' => $validated['authors'] ?? [],
                'program' => null,
                'department' => $validated['department'] ?? $facultyProfile->department,
                'college' => $validated['college'] ?? $facultyProfile->college,
                'school_year' => $validated['school_year'],
                'share_scope' => $shareScope,
                'target_college' => $validated['target_college'] ?? null,
                'target_department' => $validated['target_department'] ?? null,
                'file_url' => $fileUpload['url'] ?? $file->file_url,
                'file_name' => $fileUpload['name'] ?? ($validated['file_name'] ?? $file->file_name),
                'file_size' => $fileUpload['size'] ?? $file->file_size,
                'mime_type' => $fileUpload['mime_type'] ?? $file->mime_type,
                'is_draft' => DB::raw($isDraft ? 'true' : 'false'),
                'shared_at' => $isDraft ? null : ($file->shared_at ?? now()),
            ]);

            if ($shareScope === 'specific_users') {
                $file->recipients()->delete();
                $file->recipients()->createMany(
                    $recipientIds->map(fn (string $userId) => ['user_id' => $userId])->all()
                );
            } else {
                $file->recipients()->delete();
            }
        });

        $file->refresh();

        return response()->json([
            'data' => [
                'id' => $file->id,
                'title' => $file->title,
                'department' => $file->department,
                'college' => $file->college,
                'category_id' => $file->category_id,
                'share_scope' => $file->share_scope,
                'is_draft' => $file->is_draft,
                'created_at' => $this->formatIsoTimestamp($file->created_at),
            ],
        ]);
    }

    public function destroyLibraryItem(Request $request, string $id): JsonResponse
    {
        $file = SharedFile::query()
            ->where('uploaded_by', $request->user()->id)
            ->findOrFail($id);

        $file->delete();

        return response()->json([
            'message' => 'Shared file deleted successfully.',
        ]);
    }

    public function storeLibraryItem(Request $request): JsonResponse
    {
        $facultyProfile = FacultyProfile::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $validated = $request->validate([
            'title' => 'required|string|max:500',
            'resource_type' => 'required|string|max:100',
            'abstract' => 'nullable|string',
            'keywords' => 'nullable|array',
            'keywords.*' => 'string|max:100',
            'college' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'category_id' => 'required|uuid|exists:categories,id',
            'category_ids' => 'nullable|array|min:1|max:5',
            'category_ids.*' => 'uuid|exists:categories,id|distinct',
            'school_year' => 'required|string|max:255',
            'authors' => 'nullable|array',
            'authors.*' => 'string|max:255',
            'share_scope' => 'required|in:all_colleges,all_departments,specific_college,specific_department,specific_users',
            'target_college' => 'nullable|string|max:255|required_if:share_scope,specific_college',
            'target_department' => 'nullable|string|max:255|required_if:share_scope,specific_department',
            'recipient_ids' => 'nullable|array|required_if:share_scope,specific_users|min:1',
            'recipient_ids.*' => 'uuid|exists:users,id',
            'is_draft' => 'nullable|boolean',
            'file' => 'nullable|file|max:51200',
            'file_url' => 'nullable|url',
            'file_name' => 'nullable|string|max:255',
            'file_size' => 'nullable|integer',
        ]);

        $categoryIds = collect($validated['category_ids'] ?? [$validated['category_id']])
            ->filter()
            ->unique()
            ->values()
            ->all();
        $primaryCategoryId = $categoryIds[0] ?? $validated['category_id'];
        $category = Category::query()->findOrFail($primaryCategoryId);
        $isDraft = (bool) ($validated['is_draft'] ?? false);
        $shareScope = (string) $validated['share_scope'];
        $recipientIds = collect($validated['recipient_ids'] ?? [])
            ->filter()
            ->unique()
            ->values();
        $uploadedFile = $request->file('file');
        $fileUpload = $uploadedFile ? $this->uploadToSupabase($uploadedFile, 'shared-resources') : null;

        $sharedFile = DB::transaction(function () use (
            $request,
            $facultyProfile,
            $category,
            $validated,
            $isDraft,
            $shareScope,
            $recipientIds,
            $fileUpload
        ) {
            $file = SharedFile::create([
                'uploaded_by' => $request->user()->id,
                'category_id' => $category->id,
                'category_ids' => $categoryIds,
                'title' => $validated['title'],
                'resource_type' => $validated['resource_type'],
                'abstract' => $validated['abstract'] ?? null,
                'keywords' => $validated['keywords'] ?? [],
                'authors' => $validated['authors'] ?? [],
                'program' => null,
                'department' => $validated['department'] ?? $facultyProfile->department,
                'college' => $validated['college'] ?? $facultyProfile->college,
                'school_year' => $validated['school_year'],
                'share_scope' => $shareScope,
                'target_college' => $validated['target_college'] ?? null,
                'target_department' => $validated['target_department'] ?? null,
                'file_url' => $fileUpload['url'] ?? ($validated['file_url'] ?? null),
                'file_name' => $fileUpload['name'] ?? ($validated['file_name'] ?? null),
                'file_size' => $fileUpload['size'] ?? ($validated['file_size'] ?? null),
                'mime_type' => $fileUpload['mime_type'] ?? null,
                'is_draft' => DB::raw($isDraft ? 'true' : 'false'),
                'shared_at' => $isDraft ? null : now(),
            ]);

            if ($shareScope === 'specific_users') {
                $file->recipients()->createMany(
                    $recipientIds->map(fn (string $userId) => ['user_id' => $userId])->all()
                );
            }

            return $file->refresh()->load(['category:id,name,slug', 'recipients.user:id,name,email']);
        });

        $this->logger->log($request->user(), 'faculty.library_item_created', 'shared_file', $sharedFile->id, [
            'department' => $facultyProfile->department,
            'college' => $facultyProfile->college,
            'category' => $category->name,
            'scope' => $shareScope,
            'is_draft' => $isDraft,
        ]);

        if (!$isDraft) {
            $this->notifyRecipientsOfSharedFile(
                $request->user(),
                $facultyProfile,
                $sharedFile
            );
        }

        return response()->json([
            'data' => [
                'id' => $sharedFile->id,
                'title' => $sharedFile->title,
                'department' => $sharedFile->department,
                'college' => $sharedFile->college,
                'program' => $sharedFile->program,
                'category_id' => $sharedFile->category_id,
                'share_scope' => $sharedFile->share_scope,
                'is_draft' => $sharedFile->is_draft,
                'created_at' => $this->formatIsoTimestamp($sharedFile->created_at),
            ],
        ], 201);
    }

    public function searchableShareUsers(Request $request): JsonResponse
    {
        $facultyProfile = FacultyProfile::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $search = trim((string) $request->input('search', ''));
        $users = User::query()
            ->with(['faculty:user_id,department,college', 'student:user_id,department'])
            ->where('id', '!=', $request->user()->id)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('name', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->limit($search === '' ? 12 : 20)
            ->get();

        return response()->json([
            'data' => $users->map(function (User $user) use ($facultyProfile) {
                $department = $user->faculty?->department ?? $user->student?->department ?? $facultyProfile->department;
                $college = $user->faculty?->college ?? null;

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'department' => $department,
                    'college' => $college,
                ];
            })->values(),
        ]);
    }

    public function storeManagedThesis(Request $request): JsonResponse
    {
        $facultyProfile = FacultyProfile::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $categoryIds = $this->normalizeJsonArrayInput($request->input('category_ids'));

        $request->merge([
            'category_ids' => $categoryIds,
            'category_id' => $categoryIds[0] ?? $request->input('category_id'),
        ]);

        $validated = $request->validate([
            'title' => 'required|string|max:500',
            'abstract' => 'nullable|string',
            'department' => 'nullable|string|max:255',
            'program' => 'nullable|string|max:255',
            'category_id' => 'required|uuid|exists:categories,id',
            'category_ids' => 'required|array|min:1|max:5',
            'category_ids.*' => 'uuid|exists:categories,id|distinct',
            'school_year' => 'required|string|max:255',
            'authors' => 'nullable|string',
            'adviser_id' => 'nullable|uuid|exists:users,id',
            'submission_mode' => 'required|in:draft,submit',
            'confirm_original' => 'nullable|boolean',
            'allow_review' => 'nullable|boolean',
            'manuscript' => 'nullable|file|mimes:pdf|max:51200',
            'supplementary_files' => 'nullable|array',
            'supplementary_files.*' => 'file|max:51200',
        ]);

        $authors = collect(explode(',', (string) ($validated['authors'] ?? '')))
            ->map(fn (string $author) => trim($author))
            ->filter()
            ->values()
            ->all();
        $primaryCategoryId = $validated['category_ids'][0] ?? $validated['category_id'];

        $manuscript = $request->file('manuscript');
        $supplementaryFiles = collect($request->file('supplementary_files', []))
            ->filter();

        if ($validated['submission_mode'] === 'submit') {
            if (!$validated['confirm_original'] || !$validated['allow_review']) {
                return response()->json(['error' => 'Please confirm the submission statements before submitting.'], 422);
            }

            if (!$manuscript) {
                return response()->json(['error' => 'A manuscript PDF is required before submitting.'], 422);
            }
        }

        $manuscriptUpload = $manuscript ? $this->uploadToSupabase($manuscript, 'manuscripts') : null;
        $supplementaryUploads = $supplementaryFiles
            ->map(fn ($file) => $this->uploadToSupabase($file, 'supplementary'))
            ->values()
            ->all();

        $status = $validated['submission_mode'] === 'submit' ? 'approved' : 'draft';
        $timestamp = now();

        $thesis = Thesis::create([
            'title' => $validated['title'],
            'abstract' => $validated['abstract'] ?? null,
            'department' => $validated['department'] ?? $facultyProfile->department,
            'program' => $validated['program'] ?? null,
            'category_id' => $primaryCategoryId,
            'category_ids' => $validated['category_ids'],
            'school_year' => $validated['school_year'],
            'authors' => $authors,
            'file_url' => $manuscriptUpload['url'] ?? null,
            'file_name' => $manuscriptUpload['name'] ?? null,
            'file_size' => $manuscriptUpload['size'] ?? null,
            'supplementary_files' => $supplementaryUploads,
            'status' => $status,
            'submitted_by' => $request->user()->id,
            'approved_at' => $status === 'approved' ? $timestamp : null,
            'submitted_at' => $status === 'approved' ? $timestamp : null,
            'adviser_id' => $validated['adviser_id'] ?? null,
        ]);

        $this->logger->log($request->user(), 'faculty.thesis_created', 'thesis', $thesis->id, [
            'department' => $facultyProfile->department,
            'status' => $status,
        ]);

        return response()->json([
            'data' => [
                'id' => $thesis->id,
                'title' => $thesis->title,
                'status' => $thesis->status,
                'file_name' => $thesis->file_name,
                'supplementary_files' => $thesis->supplementary_files,
            ],
        ], 201);
    }

    public function archiveManagedThesis(Request $request, string $id): JsonResponse
    {
        $thesis = Thesis::query()
            ->where('id', $id)
            ->where('submitted_by', $request->user()->id)
            ->firstOrFail();

        if ($thesis->status !== 'approved') {
            return response()->json([
                'error' => 'Only approved theses can be archived.',
            ], 422);
        }

        if ($thesis->is_archived) {
            return response()->json([
                'data' => $thesis->fresh(),
                'message' => 'Thesis is already archived.',
            ]);
        }

        $thesis->update([
            'is_archived' => DB::raw('true'),
            'archived_at' => now(),
            'archived_by' => $request->user()->id,
            'archived_by_name' => $request->user()->name,
        ]);

        $this->logger->log($request->user(), 'thesis.archived', 'thesis', $thesis->id, [
            'title' => $thesis->title,
        ]);

        $this->notifications->notify(
            $request->user(),
            'thesis.archived',
            'Thesis archived successfully',
            $thesis->title,
            ['thesis_id' => $thesis->id],
        );

        return response()->json([
            'data' => $thesis->fresh(),
            'message' => 'Thesis archived successfully.',
        ]);
    }

    public function destroyManagedThesis(Request $request, string $id): JsonResponse
    {
        $thesis = Thesis::query()
            ->where('id', $id)
            ->where('submitted_by', $request->user()->id)
            ->firstOrFail();

        if (!$thesis->is_archived) {
            return response()->json([
                'error' => 'Only archived theses can be deleted from this page.',
            ], 422);
        }

        $title = $thesis->title;

        $this->logger->log($request->user(), 'thesis.deleted', 'thesis', $thesis->id, [
            'title' => $title,
            'source' => 'faculty.archive',
        ]);

        $thesis->delete();

        return response()->json([
            'message' => 'Archived thesis deleted successfully.',
        ]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        $assignedStudents = StudentProfile::where('adviser_id', $user->id)->count();
        $pendingReviews = Thesis::whereIn('status', ['pending', 'under_review'])
            ->where('adviser_id', $user->id)
            ->count();
        $approvedThesis = Thesis::where('status', 'approved')
            ->whereRaw('"is_archived" = true')
            ->where('adviser_id', $user->id)
            ->count();
        $rejectedThesis = Thesis::where('status', 'rejected')
            ->where('adviser_id', $user->id)
            ->count();
        $totalSubmissions = Thesis::where('adviser_id', $user->id)->count();

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

        $quote = $this->dailyQuoteService->getTodayQuote();

        return response()->json([
            'stats' => [
                'assigned_students' => $assignedStudents,
                'pending_reviews' => $pendingReviews,
                'approved_thesis' => $approvedThesis,
                'rejected_thesis' => $rejectedThesis,
                'total_submissions' => $totalSubmissions,
            ],
            'recent_theses' => $recentTheses,
            'top_searches' => $topSearches,
            'daily_quote' => $quote,
        ]);
    }

    public function advisees(Request $request): JsonResponse
    {
        $facultyProfile = FacultyProfile::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $students = StudentProfile::query()
            ->with('user:id,name,email,created_at')
            ->where('adviser_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        $studentUserIds = $students->pluck('user_id')->filter()->values();
        $thesisRows = $studentUserIds->isEmpty()
            ? collect()
            : Thesis::query()
                ->select([
                    'submitted_by',
                    'status',
                    'updated_at',
                    'created_at',
                    DB::raw('ROW_NUMBER() OVER (PARTITION BY submitted_by ORDER BY updated_at DESC, created_at DESC) as thesis_rank'),
                    DB::raw("COUNT(*) FILTER (WHERE status IN ('pending', 'under_review')) OVER (PARTITION BY submitted_by) as proposal_count"),
                    DB::raw("COUNT(*) FILTER (WHERE status = 'approved') OVER (PARTITION BY submitted_by) as approved_count"),
                    DB::raw("MAX(CASE WHEN status IN ('pending', 'under_review') THEN 1 ELSE 0 END) OVER (PARTITION BY submitted_by) as has_active"),
                    DB::raw("MAX(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) OVER (PARTITION BY submitted_by) as has_approved"),
                ])
                ->whereIn('submitted_by', $studentUserIds)
                ->orderBy('submitted_by')
                ->orderByDesc('updated_at')
                ->orderByDesc('created_at')
                ->get();

        $thesisSummaries = $thesisRows
            ->where('thesis_rank', 1)
            ->keyBy('submitted_by');

        $advisees = $students->map(function (StudentProfile $student) use ($thesisSummaries, $request, $facultyProfile) {
            $summary = $thesisSummaries->get($student->user_id);
            $proposalCount = (int) ($summary?->proposal_count ?? 0);
            $approvedCount = (int) ($summary?->approved_count ?? 0);
            $status = $this->presentAdviseeStatusFromSummary(
                (bool) ($summary?->has_active ?? false),
                (bool) ($summary?->has_approved ?? false),
            );

            return [
                'id' => $student->id,
                'student_id' => $student->student_id,
                'student_name' => $student->user?->name ?? 'Student',
                'first_name' => $student->user?->first_name,
                'last_name' => $student->user?->last_name,
                'email' => $student->user?->email,
                'program' => $student->program,
                'department' => $student->department ?: $facultyProfile->department,
                'year_level' => $student->year_level,
                'status' => $status['label'],
                'status_tone' => $status['tone'],
                'action' => $status['action'],
                'last_update' => $this->formatIsoTimestamp($summary?->updated_at ?? $student->updated_at ?? $student->created_at),
                'proposal_count' => $proposalCount,
                'approved_count' => $approvedCount,
                'needs_guidance' => $status['label'] === 'Needs Guidance',
                'is_recent' => optional($student->created_at)?->gte(now()->subDays(120)) ?? false,
                'adviser_name' => $request->user()->name,
            ];
        })->values();

        return response()->json([
            'data' => [
                'department' => $facultyProfile->department,
                'adviser_name' => $request->user()->name,
                'next_student_id' => $this->generateNextStudentId(),
                'summary' => [
                    'total_advisees' => $advisees->count(),
                    'active_proposals' => $advisees->sum('proposal_count'),
                    'for_defense' => $advisees->filter(fn (array $advisee) => $advisee['approved_count'] > 0)->count(),
                    'needs_guidance' => $advisees->filter(fn (array $advisee) => $advisee['needs_guidance'])->count(),
                    'new_this_term' => $advisees->filter(fn (array $advisee) => $advisee['is_recent'])->count(),
                ],
                'advisees' => $advisees,
            ],
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
            'submitter_name' => $thesis->submitter?->name,
            'year' => $thesis->approved_at?->format('Y') ?? ($thesis->created_at?->format('Y') ?? null),
            'college' => $this->resolveCollegeForDepartment($thesis->department, $thesis->college ?? null),
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

    private function formatFacultyProfile(FacultyProfile $profile, int $adviseeCount): array
    {
        $roleTitle = match ($profile->faculty_role) {
            'Dean' => 'Faculty - Dean',
            'Co-Adviser' => 'Faculty - Co-Adviser',
            default => 'Faculty - Thesis Adviser',
        };

        return [
            'id' => $profile->id,
            'faculty_id' => $profile->faculty_id,
            'full_name' => $profile->user?->name,
            'first_name' => $profile->user?->first_name,
            'last_name' => $profile->user?->last_name,
            'email' => $profile->user?->email,
            'department' => $profile->department,
            'college' => $profile->college,
            'faculty_role' => $profile->faculty_role,
            'role_title' => $roleTitle,
            'rank' => $profile->rank,
            'mobile' => null,
            'advisee_count' => $adviseeCount,
            'committee_role' => $profile->faculty_role === 'Dean' ? 'Academic Committee Lead' : 'Thesis Committee',
            'consultation_hours' => null,
            'specialization' => null,
            'status' => $profile->status,
            'editable_by' => 'VPAA',
            'updated_at' => optional($profile->updated_at)?->toISOString(),
        ];
    }

    private function presentAdviseeStatus($studentTheses): array
    {
        if ($studentTheses->isEmpty()) {
            return [
                'label' => 'Needs Guidance',
                'tone' => 'terracotta',
                'action' => 'Review',
            ];
        }

        if ($studentTheses->contains(fn (Thesis $thesis) => in_array($thesis->status, ['pending', 'under_review'], true))) {
            return [
                'label' => 'Active',
                'tone' => 'gold',
                'action' => 'Open',
            ];
        }

        if ($studentTheses->contains(fn (Thesis $thesis) => $thesis->status === 'approved')) {
            return [
                'label' => 'On Track',
                'tone' => 'sage',
                'action' => 'Checklist',
            ];
        }

        return [
            'label' => 'Needs Guidance',
            'tone' => 'terracotta',
            'action' => 'Review',
        ];
    }

    private function presentAdviseeStatusFromSummary(bool $hasActive, bool $hasApproved): array
    {
        if ($hasActive) {
            return [
                'label' => 'Active',
                'tone' => 'gold',
                'action' => 'Open',
            ];
        }

        if ($hasApproved) {
            return [
                'label' => 'On Track',
                'tone' => 'sage',
                'action' => 'Checklist',
            ];
        }

        return [
            'label' => 'Needs Guidance',
            'tone' => 'terracotta',
            'action' => 'Review',
        ];
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

    private function normalizeJsonArrayInput(mixed $value): array
    {
        if (is_array($value)) {
            return collect($value)
                ->map(fn ($item) => is_string($item) ? trim($item) : $item)
                ->filter()
                ->values()
                ->all();
        }

        if (!is_string($value) || trim($value) === '') {
            return [];
        }

        $decoded = json_decode($value, true);

        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return collect($decoded)
                ->map(fn ($item) => is_string($item) ? trim($item) : $item)
                ->filter()
                ->values()
                ->all();
        }

        return [];
    }

    private function presentFacultyActivityAction(string $action): array
    {
        return match ($action) {
            'thesis.approved' => ['Approved Thesis', 'sage', 'View'],
            'thesis.rejected' => ['Needs Revision', 'terracotta', 'Review'],
            'thesis.archived' => ['Archived Thesis', 'gold', 'View'],
            'faculty.created' => ['Account Created', 'sky', 'Open'],
            'faculty.updated' => ['Account Edited', 'sage', 'View'],
            default => ['Updated', 'maroon', 'View'],
        };
    }

    private function buildFacultyActivityRecordLabel(ActivityLog $log, ?Thesis $thesis): string
    {
        return match ($log->action) {
            'thesis.approved' => $thesis?->title ? "Approved thesis: {$thesis->title}" : 'Approved thesis',
            'thesis.rejected' => $thesis?->title ? "Needs revision: {$thesis->title}" : 'Thesis marked for revision',
            'thesis.archived' => $thesis?->title ? "Archived thesis: {$thesis->title}" : 'Archived thesis',
            'faculty.created' => $log->user?->name ? "Faculty account created by {$log->user->name}" : 'Faculty account created',
            'faculty.updated' => $log->user?->name ? "Faculty account updated by {$log->user->name}" : 'Faculty account updated',
            default => str($log->action)->replace('.', ' ')->replace('_', ' ')->title()->toString(),
        };
    }

    private function uploadToSupabase(\Illuminate\Http\UploadedFile $file, string $folder): array
    {
        $supabaseUrl = rtrim((string) config('services.supabase.url'), '/');
        $serviceKey = (string) config('services.supabase.service_key');
        $bucket = (string) config('services.supabase.bucket');

        if ($supabaseUrl === '' || $serviceKey === '' || $bucket === '') {
            throw new \RuntimeException('Supabase storage is not configured.');
        }

        $path = sprintf(
            'faculty-theses/%s/%s/%s-%s',
            $folder,
            now()->format('Y/m'),
            (string) Str::uuid(),
            preg_replace('/[^A-Za-z0-9.\-_]/', '-', $file->getClientOriginalName())
        );

        $response = Http::withHeaders([
            'apikey' => $serviceKey,
            'Authorization' => 'Bearer ' . $serviceKey,
            'x-upsert' => 'true',
            'Content-Type' => $file->getMimeType() ?: 'application/octet-stream',
        ])->withBody(file_get_contents($file->getRealPath()), $file->getMimeType() ?: 'application/octet-stream')
            ->post("{$supabaseUrl}/storage/v1/object/{$bucket}/{$path}");

        if ($response->failed()) {
            throw new \RuntimeException('Failed to upload file to storage.');
        }

        return [
            'name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'path' => $path,
            'url' => "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$path}",
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $query = FacultyProfile::with('user:id,first_name,last_name,name,email,created_at');

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->whereHas('user', fn($q) => $q->where('name', 'ilike', "%{$search}%")
                ->orWhere('email', 'ilike', "%{$search}%"));
        }

        if ($request->has('role') && $request->input('role')) {
            $query->where('faculty_role', $request->input('role'));
        }

        if ($request->has('department') && $request->input('department')) {
            $query->where('department', $request->input('department'));
        }

        if ($request->has('status') && $request->input('status')) {
            $query->where('status', $request->input('status'));
        }

        $faculty = $query->paginate(20);

        return response()->json($faculty);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'first_name'       => 'required|string|max:255',
            'last_name'        => 'required|string|max:255',
            'suffix'           => 'nullable|string|max:50',
            'email'            => 'required|email|unique:users',
            'temporary_password' => 'required|string|min:8',
            'faculty_id'       => 'nullable|string|unique:faculty_profiles',
            'department'       => 'required|string',
            'college'          => 'nullable|string|max:255',
            'rank'             => 'nullable|string',
            'faculty_role'     => 'required|string',
            'assigned_chair_id' => 'nullable|uuid|exists:users,id',
        ]);

        $normalizedCollege = $this->resolveCollegeForDepartment(
            (string) $request->department,
            $request->input('college')
        );

        $facultyId = $request->filled('faculty_id')
            ? (string) $request->faculty_id
            : $this->generateNextFacultyId((string) $request->faculty_role);

        $facultyProfile = DB::transaction(function () use ($request, $facultyId, $normalizedCollege) {
            $user = User::create([
                'first_name' => $request->first_name,
                'last_name'  => $request->last_name,
                'suffix'    => $request->input('suffix'),
                'name'      => trim(implode(' ', array_filter([$request->first_name, $request->last_name, $request->input('suffix')]))),
                'email'     => $request->email,
                'password'  => Hash::make($request->temporary_password),
                'role'      => 'faculty',
                'is_active' => DB::raw('true'),
            ]);

            return FacultyProfile::create([
                'user_id'           => $user->id,
                'faculty_id'        => $facultyId,
                'department'        => $request->department,
                'college'           => $normalizedCollege,
                'rank'              => $request->rank,
                'faculty_role'      => $request->faculty_role,
                'assigned_chair_id' => $request->assigned_chair_id,
                'created_by'        => $request->user()->id,
            ]);
        });

        $this->logger->log($request->user(), 'faculty.created', 'user', $facultyProfile->user_id);

        User::query()
            ->where('role', 'vpaa')
            ->get()
            ->each(function (User $vpaaUser) use ($facultyProfile) {
                $this->notifications->notify(
                    $vpaaUser,
                    'faculty.created',
                    'Faculty account created successfully',
                    $facultyProfile->user?->name,
                    ['faculty_user_id' => $facultyProfile->user_id],
                );
            });

        return response()->json(['data' => $facultyProfile->load('user:id,first_name,last_name,name,email,created_at')], 201);
    }

    private function generateNextFacultyId(string $facultyRole): string
    {
        $prefix = 'TUPM-00-';

        $latestMatch = FacultyProfile::query()
            ->pluck('faculty_id')
            ->filter(fn (string $facultyId) => str_starts_with($facultyId, $prefix))
            ->map(function (string $facultyId) {
                if (!preg_match('/(\d+)$/', $facultyId, $matches)) {
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
        $faculty = FacultyProfile::with('user:id,first_name,last_name,name,email,created_at')->findOrFail($id);

        return response()->json(['data' => $faculty]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $faculty = FacultyProfile::with('user')->findOrFail($id);
        $user = $faculty->user;
        $previousRole = $faculty->faculty_role;

        $request->validate([
            'first_name'        => 'required|string|max:255',
            'last_name'         => 'required|string|max:255',
            'suffix'            => 'nullable|string|max:50',
            'email'             => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'temporary_password' => 'nullable|string|min:8',
            'faculty_id'        => ['required', 'string', Rule::unique('faculty_profiles', 'faculty_id')->ignore($faculty->id)],
            'department'        => 'required|string',
            'college'           => 'nullable|string|max:255',
            'rank'             => 'nullable|string',
            'faculty_role'     => 'required|string',
            'assigned_chair_id' => 'nullable|uuid|exists:users,id',
        ]);

        $normalizedCollege = $this->resolveCollegeForDepartment(
            (string) $request->department,
            $request->input('college')
        );

        DB::transaction(function () use ($request, $faculty, $user, $normalizedCollege) {
            $userData = [
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'suffix' => $request->input('suffix'),
                'email' => $request->email,
            ];

            if ($request->filled('temporary_password')) {
                $userData['password'] = Hash::make($request->temporary_password);
            }

            $user->update($userData);

            $faculty->update([
                'faculty_id' => $request->faculty_id,
                'department' => $request->department,
                'college' => $normalizedCollege,
                'rank' => $request->rank,
                'faculty_role' => $request->faculty_role,
                'assigned_chair_id' => $request->assigned_chair_id,
            ]);
        });

        $this->logger->log($request->user(), 'faculty.updated', 'faculty', $faculty->id);

        User::query()
            ->where('role', 'vpaa')
            ->get()
            ->each(function (User $vpaaUser) use ($faculty) {
                $this->notifications->notify(
                    $vpaaUser,
                    'faculty.updated',
                    'Faculty account edited successfully',
                    $faculty->user?->name,
                    [
                        'faculty_profile_id' => $faculty->id,
                        'faculty_user_id' => $faculty->user_id,
                    ],
                );
            });

        if ($previousRole !== $faculty->faculty_role) {
            $this->logger->log($request->user(), 'faculty.role_changed', 'faculty', $faculty->id, [
                'from' => $previousRole,
                'to' => $faculty->faculty_role,
            ]);

            User::query()
                ->where('role', 'vpaa')
                ->get()
                ->each(function (User $vpaaUser) use ($faculty, $previousRole) {
                    $this->notifications->notify(
                        $vpaaUser,
                        'faculty.role_changed',
                        'Faculty role updated',
                        sprintf(
                            '%s: %s to %s',
                            $faculty->user?->name ?? 'Faculty member',
                            $previousRole ?: 'Unassigned',
                            $faculty->faculty_role ?: 'Unassigned'
                        ),
                        [
                            'faculty_profile_id' => $faculty->id,
                            'faculty_user_id' => $faculty->user_id,
                            'from' => $previousRole,
                            'to' => $faculty->faculty_role,
                        ],
                    );
                });
        }

        return response()->json(['data' => $faculty->fresh()->load('user:id,first_name,last_name,name,email,created_at')]);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $request->validate(['status' => 'required|in:active,on_leave,inactive']);

        $faculty = FacultyProfile::findOrFail($id);
        $faculty->update(['status' => $request->status]);

        $this->logger->log($request->user(), 'faculty.status_changed', 'faculty', $faculty->id, ['status' => $request->status]);

        return response()->json(['data' => $faculty]);
    }

    public function destroy(string $id): JsonResponse
    {
        $faculty = FacultyProfile::findOrFail($id);
        $user = $faculty->user;
        $user->delete();

        return response()->json(['message' => 'Faculty deleted']);
    }

    public function export(Request $request): JsonResponse
    {
        $faculty = FacultyProfile::with('user:id,name,email')->get();

        $csv = "Faculty ID,Name,Email,Department,Role,Status\n";
        foreach ($faculty as $f) {
            $csv .= "{$f->faculty_id},{$f->user->name},{$f->user->email},{$f->department},{$f->faculty_role},{$f->status}\n";
        }

        return response()->json(['csv' => $csv]);
    }

    private function notifyRecipientsOfSharedFile(User $actor, FacultyProfile $facultyProfile, SharedFile $file): void
    {
        $recipients = match ($file->share_scope) {
            'all_colleges' => User::query()
                ->where('id', '!=', $actor->id)
                ->get(),
            'all_departments' => User::query()
                ->where('id', '!=', $actor->id)
                ->where(function ($query) {
                    $query->whereHas('faculty')
                        ->orWhereHas('student');
                })
                ->get(),
            'specific_college' => User::query()
                ->where('id', '!=', $actor->id)
                ->whereHas('faculty', fn ($query) => $query->where('college', $file->target_college))
                ->get(),
            'specific_department' => User::query()
                ->where('id', '!=', $actor->id)
                ->where(function ($query) use ($file) {
                    $query->whereHas('faculty', fn ($facultyQuery) => $facultyQuery->where('department', $file->target_department))
                        ->orWhereHas('student', fn ($studentQuery) => $studentQuery->where('department', $file->target_department));
                })
                ->get(),
            'specific_users' => User::query()
                ->whereIn('id', $file->recipients->pluck('user_id')->filter()->values())
                ->where('id', '!=', $actor->id)
                ->get(),
            default => collect(),
        };

        $scopeLabel = $this->presentShareScopeLabel($file);

        $recipients->each(function (User $recipient) use ($actor, $file, $scopeLabel, $facultyProfile) {
            $this->notifications->notify(
                $recipient,
                'department.file_shared',
                'New file shared with you',
                $file->title,
                [
                    'shared_file_id' => $file->id,
                    'scope' => $file->share_scope,
                    'scope_label' => $scopeLabel,
                    'department' => $facultyProfile->department,
                    'college' => $facultyProfile->college,
                    'shared_by' => $actor->id,
                ],
            );
        });
    }

    private function presentShareScopeLabel(SharedFile $file): string
    {
        return match ($file->share_scope) {
            'all_colleges' => 'All Colleges',
            'all_departments' => 'All Departments',
            'specific_college' => $file->target_college ? 'College: ' . $file->target_college : 'Specific College',
            'specific_department' => $file->target_department ? 'Department: ' . $file->target_department : 'Specific Department',
            'specific_users' => 'Specific Users',
            default => 'Shared File',
        };
    }

    private function resolveCollegeForDepartment(string $department, ?string $college): ?string
    {
        $normalizedDepartment = trim($department);
        $normalizedCollege = $college !== null ? trim($college) : null;
        $departmentCollegeMap = config('academic.department_college_map', []);

        if (isset($departmentCollegeMap[$normalizedDepartment])) {
            return $departmentCollegeMap[$normalizedDepartment];
        }

        return $normalizedCollege !== '' ? $normalizedCollege : null;
    }

    private function resolveSharedFileCategorySummaries(SharedFile $file): array
    {
        $categoryIds = collect($file->category_ids ?? [])
            ->filter(fn ($id) => is_string($id) && trim($id) !== '')
            ->values();

        if ($categoryIds->isEmpty() && $file->category_id) {
            $categoryIds = collect([$file->category_id]);
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

    private function visibleSharedFilesForFaculty(User $user, FacultyProfile $facultyProfile)
    {
        return SharedFile::query()
            ->where(function ($query) use ($user, $facultyProfile) {
                $query->where('uploaded_by', $user->id)
                    ->orWhere(function ($sharedQuery) use ($user, $facultyProfile) {
                        $sharedQuery->whereRaw('"is_draft" = false')
                            ->where(function ($scopeQuery) use ($user, $facultyProfile) {
                                $scopeQuery
                                    ->where('share_scope', 'all_colleges')
                                    ->orWhere('share_scope', 'all_departments')
                                    ->orWhere(function ($collegeQuery) use ($facultyProfile) {
                                        $collegeQuery
                                            ->where('share_scope', 'specific_college')
                                            ->where('target_college', $facultyProfile->college);
                                    })
                                    ->orWhere(function ($departmentQuery) use ($facultyProfile) {
                                        $departmentQuery
                                            ->where('share_scope', 'specific_department')
                                            ->where('target_department', $facultyProfile->department);
                                    })
                                    ->orWhere(function ($recipientQuery) use ($user) {
                                        $recipientQuery
                                            ->where('share_scope', 'specific_users')
                                            ->whereHas('recipients', fn ($recipientBuilder) => $recipientBuilder->where('user_id', $user->id));
                                    });
                            });
                    });
            });
    }
}
