<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\FacultyProfile;
use App\Models\SearchLog;
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
            ])
            ->where(function ($query) use ($request, $facultyProfile) {
                $query->where('user_id', $request->user()->id)
                    ->orWhere(function ($nested) use ($facultyProfile) {
                        $nested->where('subject_type', 'thesis')
                            ->whereIn('subject_id', Thesis::query()
                                ->where('department', $facultyProfile->department)
                                ->pluck('id'));
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

        $formattedLogs = $logs->map(function (ActivityLog $log) use ($theses) {
            $subjectThesis = $log->subject_type === 'thesis' ? $theses->get($log->subject_id) : null;
            [$badge, $tone, $cta] = $this->presentFacultyActivityAction($log->action);

            return [
                'id' => $log->id,
                'badge' => $badge,
                'tone' => $tone,
                'request_record' => $subjectThesis?->title ?? str($log->action)->replace('.', ' ')->replace('_', ' ')->title()->toString(),
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
            'files_shared' => $logs->whereIn('action', ['thesis.submitted', 'faculty.library_item_created', 'faculty.thesis_created'])->count(),
            'notes_added' => $logs->whereIn('action', ['thesis.rejected', 'faculty.status_changed', 'faculty.role_changed'])->count(),
            'last_activity' => optional($logs->first()?->created_at)?->diffForHumans() ?? 'No recent activity',
        ];

        return response()->json([
            'data' => [
                'summary' => $summary,
                'logs' => $formattedLogs,
            ],
        ]);
    }

    public function libraryIndex(Request $request): JsonResponse
    {
        $facultyProfile = FacultyProfile::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $items = Thesis::query()
            ->where('status', 'draft')
            ->where('department', $facultyProfile->department)
            ->with(['submitter:id,name', 'category:id,name,slug'])
            ->orderByDesc('created_at')
            ->limit(12)
            ->get();

        $latestTimestamp = $items
            ->pluck('created_at')
            ->filter()
            ->max();

        return response()->json([
            'data' => [
                'department' => $facultyProfile->department,
                'stats' => [
                    'total_files' => $items->count(),
                    'shared_libraries' => $items->pluck('category_id')->filter()->unique()->count(),
                    'files_needing_review' => 0,
                    'storage_used' => $items->isEmpty()
                        ? 0
                        : (int) round(($items->filter(fn (Thesis $thesis) => filled($thesis->file_url))->count() / $items->count()) * 100),
                    'last_sync' => $this->formatIsoTimestamp($latestTimestamp),
                ],
                'items' => $items->map(function (Thesis $thesis) {
                    return [
                        'id' => $thesis->id,
                        'title' => $thesis->title,
                        'author' => collect($thesis->authors ?? [])->filter()->implode(', ') ?: ($thesis->submitter?->name ?? 'Unknown author'),
                        'department' => $thesis->department,
                        'program' => $thesis->program,
                        'category' => $thesis->category?->name,
                        'year' => $thesis->created_at?->format('Y'),
                        'file_url' => $thesis->file_url,
                        'file_name' => $thesis->file_name,
                        'created_at' => $this->formatIsoTimestamp($thesis->created_at),
                    ];
                })->values(),
            ],
        ]);
    }

    public function storeLibraryItem(Request $request): JsonResponse
    {
        $facultyProfile = FacultyProfile::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $validated = $request->validate([
            'title' => 'required|string|max:500',
            'abstract' => 'nullable|string',
            'keywords' => 'nullable|array',
            'keywords.*' => 'string|max:100',
            'program' => 'nullable|string|max:255',
            'category_id' => 'required|uuid|exists:categories,id',
            'school_year' => 'required|string|max:255',
            'authors' => 'nullable|array',
            'authors.*' => 'string|max:255',
            'file_url' => 'nullable|url',
            'file_name' => 'nullable|string|max:255',
            'file_size' => 'nullable|integer',
        ]);

        $category = Category::query()->findOrFail($validated['category_id']);

        $thesis = Thesis::create([
            'title' => $validated['title'],
            'abstract' => $validated['abstract'] ?? null,
            'keywords' => $validated['keywords'] ?? [],
            'department' => $facultyProfile->department,
            'program' => $validated['program'] ?? null,
            'category_id' => $category->id,
            'school_year' => $validated['school_year'],
            'authors' => $validated['authors'] ?? [],
            'file_url' => $validated['file_url'] ?? null,
            'file_name' => $validated['file_name'] ?? null,
            'file_size' => $validated['file_size'] ?? null,
            'status' => 'draft',
            'submitted_by' => $request->user()->id,
        ]);

        $this->logger->log($request->user(), 'faculty.library_item_created', 'thesis', $thesis->id, [
            'department' => $facultyProfile->department,
            'category' => $category->name,
        ]);

        $this->notifyDepartmentFacultyOfSharedFile(
            $request->user(),
            $facultyProfile->department,
            $thesis
        );

        return response()->json([
            'data' => [
                'id' => $thesis->id,
                'title' => $thesis->title,
                'department' => $thesis->department,
                'program' => $thesis->program,
                'category_id' => $thesis->category_id,
                'status' => $thesis->status,
                'created_at' => $this->formatIsoTimestamp($thesis->created_at),
            ],
        ], 201);
    }

    public function storeManagedThesis(Request $request): JsonResponse
    {
        $facultyProfile = FacultyProfile::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $validated = $request->validate([
            'title' => 'required|string|max:500',
            'abstract' => 'nullable|string',
            'keywords' => 'nullable|string',
            'program' => 'nullable|string|max:255',
            'category_id' => 'required|uuid|exists:categories,id',
            'school_year' => 'required|string|max:255',
            'authors' => 'nullable|string',
            'adviser' => 'nullable|string|max:255',
            'submission_mode' => 'required|in:draft,submit',
            'confirm_original' => 'nullable|boolean',
            'allow_review' => 'nullable|boolean',
            'manuscript' => 'nullable|file|mimes:pdf|max:51200',
            'cover' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'supplementary_files' => 'nullable|array',
            'supplementary_files.*' => 'file|max:51200',
        ]);

        $authors = collect(explode(',', (string) ($validated['authors'] ?? '')))
            ->map(fn (string $author) => trim($author))
            ->filter()
            ->values()
            ->all();

        $keywords = collect(explode(',', (string) ($validated['keywords'] ?? '')))
            ->map(fn (string $keyword) => trim($keyword))
            ->filter()
            ->values()
            ->all();

        $manuscript = $request->file('manuscript');
        $cover = $request->file('cover');
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
        $coverUpload = $cover ? $this->uploadToSupabase($cover, 'covers') : null;
        $supplementaryUploads = $supplementaryFiles
            ->map(fn ($file) => $this->uploadToSupabase($file, 'supplementary'))
            ->values()
            ->all();

        $status = $validated['submission_mode'] === 'submit' ? 'approved' : 'draft';
        $timestamp = now();

        $thesis = Thesis::create([
            'title' => $validated['title'],
            'abstract' => $validated['abstract'] ?? null,
            'keywords' => $keywords,
            'department' => $facultyProfile->department,
            'program' => $validated['program'] ?? null,
            'category_id' => $validated['category_id'],
            'school_year' => $validated['school_year'],
            'authors' => $authors,
            'file_url' => $manuscriptUpload['url'] ?? null,
            'file_name' => $manuscriptUpload['name'] ?? null,
            'file_size' => $manuscriptUpload['size'] ?? null,
            'cover_file_url' => $coverUpload['url'] ?? null,
            'cover_file_name' => $coverUpload['name'] ?? null,
            'supplementary_files' => $supplementaryUploads,
            'status' => $status,
            'submitted_by' => $request->user()->id,
            'approved_at' => $status === 'approved' ? $timestamp : null,
            'submitted_at' => $status === 'approved' ? $timestamp : null,
            'adviser_remarks' => $validated['adviser'] ?? null,
        ]);

        $this->logger->log($request->user(), 'faculty.thesis_created', 'thesis', $thesis->id, [
            'department' => $facultyProfile->department,
            'status' => $status,
        ]);

        $this->notifyDepartmentFacultyOfSharedFile(
            $request->user(),
            $facultyProfile->department,
            $thesis
        );

        return response()->json([
            'data' => [
                'id' => $thesis->id,
                'title' => $thesis->title,
                'status' => $thesis->status,
                'file_name' => $thesis->file_name,
                'cover_file_name' => $thesis->cover_file_name,
                'supplementary_files' => $thesis->supplementary_files,
            ],
        ], 201);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        $assignedStudents = StudentProfile::where('adviser_id', $user->id)->count();
        $pendingReviews = Thesis::whereIn('status', ['pending', 'under_review'])
            ->where('adviser_id', $user->id)
            ->count();
        $approvedThesis = Thesis::where('status', 'approved')
            ->where('adviser_id', $user->id)
            ->count();
        $rejectedThesis = Thesis::where('status', 'rejected')
            ->where('adviser_id', $user->id)
            ->count();
        $totalSubmissions = Thesis::where('adviser_id', $user->id)->count();

        $recentTheses = Thesis::query()
            ->where('status', 'approved')
            ->where('adviser_id', $user->id)
            ->with(['submitter:id,name', 'category:id,name'])
            ->orderByDesc('approved_at')
            ->orderByDesc('created_at')
            ->limit(4)
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
        $theses = Thesis::query()
            ->whereIn('submitted_by', $studentUserIds)
            ->orderByDesc('updated_at')
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('submitted_by');

        $advisees = $students->map(function (StudentProfile $student) use ($theses, $request, $facultyProfile) {
            $studentTheses = $theses->get($student->user_id, collect());
            $latestThesis = $studentTheses->first();
            $status = $this->presentAdviseeStatus($studentTheses);

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
                'last_update' => $this->formatIsoTimestamp($latestThesis?->updated_at ?? $student->updated_at ?? $student->created_at),
                'proposal_count' => $studentTheses->whereIn('status', ['pending', 'under_review'])->count(),
                'approved_count' => $studentTheses->where('status', 'approved')->count(),
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
        return [
            'id' => $thesis->id,
            'title' => $thesis->title,
            'author' => collect($thesis->authors ?? [])->filter()->implode(', ') ?: ($thesis->submitter?->name ?? 'Unknown author'),
            'authors' => collect($thesis->authors ?? [])->filter()->values()->all(),
            'abstract' => $thesis->abstract,
            'submitter_name' => $thesis->submitter?->name,
            'year' => $thesis->approved_at?->format('Y') ?? ($thesis->created_at?->format('Y') ?? null),
            'department' => $thesis->department,
            'program' => $thesis->program,
            'category' => $thesis->category?->name,
            'keywords' => collect($thesis->keywords ?? [])->filter()->values()->all(),
            'view_count' => (int) $thesis->view_count,
            'approved_at' => $this->formatIsoTimestamp($thesis->approved_at),
            'created_at' => $this->formatIsoTimestamp($thesis->created_at),
        ];
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

    private function presentFacultyActivityAction(string $action): array
    {
        return match ($action) {
            'thesis.approved' => ['Approved', 'sage', 'View'],
            'thesis.submitted' => ['Shared', 'gold', 'Open'],
            'thesis.rejected' => ['Commented', 'terracotta', 'Review'],
            'faculty.library_item_created', 'faculty.thesis_created' => ['Uploaded', 'gold', 'Open'],
            default => ['Updated', 'maroon', 'View'],
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
                'name'      => trim($request->first_name . ' ' . $request->last_name),
                'email'     => $request->email,
                'password'  => Hash::make($request->temporary_password),
                'role'      => 'faculty',
                'is_active' => true,
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
        $yearCode = now()->format('y');
        $prefix = $facultyRole === 'Dean'
            ? "DEAN-{$yearCode}-"
            : "FAC-{$yearCode}-";

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

    private function notifyDepartmentFacultyOfSharedFile(User $actor, string $department, Thesis $thesis): void
    {
        User::query()
            ->where('role', 'faculty')
            ->where('id', '!=', $actor->id)
            ->whereHas('faculty', fn ($query) => $query->where('department', $department))
            ->get()
            ->each(function (User $facultyUser) use ($actor, $department, $thesis) {
                $this->notifications->notify(
                    $facultyUser,
                    'department.file_shared',
                    'New file shared in your department',
                    $thesis->title,
                    [
                        'thesis_id' => $thesis->id,
                        'department' => $department,
                        'shared_by' => $actor->id,
                    ],
                );
            });
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
}
