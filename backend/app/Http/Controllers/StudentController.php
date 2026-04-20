<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\DailyQuote;
use App\Models\FacultyProfile;
use App\Models\StudentProfile;
use App\Models\Thesis;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StudentController extends Controller
{
    public function __construct(private ActivityLogService $logger) {}

    public function advisers(Request $request): JsonResponse
    {
        $studentProfile = StudentProfile::query()
            ->where('user_id', $request->user()->id)
            ->first();

        $faculty = FacultyProfile::query()
            ->with('user:id,name,email')
            ->where('status', 'active')
            ->when($studentProfile?->department, fn ($query, $department) => $query->where('department', $department))
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
            ->with('faculty:id,name,email')
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
                'program' => $profile->program,
                'department' => $profile->department,
                'year_level' => $profile->year_level,
                'thesis_title' => $latestSubmission?->title,
                'adviser_name' => $latestSubmission?->faculty?->name ?? $profile->adviser?->name,
                'adviser_email' => $latestSubmission?->faculty?->email ?? $profile->adviser?->email,
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

        $mySubmissions = Thesis::where('submitted_by', $user->id)->count();
        $totalViews = Thesis::where('submitted_by', $user->id)->sum('view_count');
        $pendingReview = Thesis::where('submitted_by', $user->id)
            ->whereIn('status', ['pending', 'under_review'])
            ->count();
        $approved = Thesis::where('submitted_by', $user->id)
            ->where('status', 'approved')
            ->count();

        $recentTheses = Thesis::query()
            ->where('status', 'approved')
            ->with(['submitter:id,name', 'category:id,name'])
            ->orderByDesc('approved_at')
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(fn (Thesis $thesis) => $this->formatDashboardThesis($thesis));

        $topSearches = Thesis::query()
            ->where('status', 'approved')
            ->with(['submitter:id,name', 'category:id,name'])
            ->orderByDesc('view_count')
            ->orderByDesc('approved_at')
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(fn (Thesis $thesis) => $this->formatDashboardThesis($thesis));

        $quote = DailyQuote::query()
            ->where('is_active', true)
            ->whereDate('quote_date', now()->toDateString())
            ->orderByDesc('created_at')
            ->first();

        return response()->json([
            'stats' => [
                'my_submissions' => $mySubmissions,
                'total_views' => $totalViews,
                'pending_review' => $pendingReview,
                'approved' => $approved,
            ],
            'recent_theses' => $recentTheses,
            'top_searches' => $topSearches,
            'daily_quote' => $quote,
        ]);
    }

    private function formatDashboardThesis(Thesis $thesis): array
    {
        return [
            'id' => $thesis->id,
            'title' => $thesis->title,
            'author' => collect($thesis->authors ?? [])->filter()->implode(', ') ?: ($thesis->submitter?->name ?? 'Unknown author'),
            'submitter_name' => $thesis->submitter?->name,
            'year' => $thesis->approved_at?->format('Y') ?? ($thesis->created_at?->format('Y') ?? null),
            'department' => $thesis->department,
            'program' => $thesis->program,
            'category' => $thesis->category?->name,
            'view_count' => (int) $thesis->view_count,
            'approved_at' => $this->formatIsoTimestamp($thesis->approved_at),
            'created_at' => $this->formatIsoTimestamp($thesis->created_at),
        ];
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
            $user = User::create([
                'first_name' => $request->first_name,
                'last_name'  => $request->last_name,
                'name'      => trim($request->first_name . ' ' . $request->last_name),
                'email'     => $request->email,
                'password'  => Hash::make($request->temporary_password),
                'role'      => 'student',
                'is_active' => true,
            ]);

            $profile = StudentProfile::create([
                'user_id'    => $user->id,
                'student_id' => $studentId,
                'department' => $request->department,
                'program'    => $request->program,
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

        $this->logger->log($request->user(), 'student.created', 'user', $studentProfile->user_id);

        return response()->json(['data' => $studentProfile->load('user:id,name,email')], 201);
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
            'email'              => 'required|email|unique:users,email,' . $user->id,
            'temporary_password' => 'nullable|string|min:8',
            'student_id'         => 'required|string|unique:student_profiles,student_id,' . $student->id,
            'department'         => 'required|string',
            'program'            => 'required|string',
            'year_level'         => 'nullable|integer',
        ]);

        DB::transaction(function () use ($request, $student, $user) {
            $userPayload = [
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'name' => trim($request->first_name . ' ' . $request->last_name),
                'email' => $request->email,
            ];

            if ($request->filled('temporary_password')) {
                $userPayload['password'] = Hash::make($request->temporary_password);
            }

            $user->update($userPayload);

            $student->update([
                'student_id' => $request->student_id,
                'department' => $request->department,
                'program' => $request->program,
                'year_level' => $request->year_level,
            ]);
        });

        $this->logger->log($request->user(), 'student.updated', 'user', $student->user_id);

        return response()->json(['data' => $student->fresh()->load('user')]);
    }

    public function destroy(string $id): JsonResponse
    {
        $student = StudentProfile::findOrFail($id);
        $user = $student->user;
        $user->delete();

        return response()->json(['message' => 'Student deleted']);
    }

    private function sortedParticipantAttributes(string $firstUserId, string $secondUserId): array
    {
        $participants = collect([$firstUserId, $secondUserId])->sort()->values();

        return [
            'participant_one_id' => $participants->get(0),
            'participant_two_id' => $participants->get(1),
        ];
    }
}
