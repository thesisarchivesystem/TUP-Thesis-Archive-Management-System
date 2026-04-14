<?php

namespace App\Http\Controllers;

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

class FacultyController extends Controller
{
    public function __construct(private ActivityLogService $logger) {}

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

        $topSearches = Thesis::query()
            ->where('status', 'approved')
            ->where('adviser_id', $user->id)
            ->with(['submitter:id,name', 'category:id,name'])
            ->orderByDesc('view_count')
            ->orderByDesc('approved_at')
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(fn (Thesis $thesis) => $this->formatDashboardThesis($thesis));

        $quotes = DailyQuote::query()
            ->where('is_active', true)
            ->orderBy('quote_date')
            ->orderBy('created_at')
            ->get();

        $quote = null;
        if ($quotes->isNotEmpty()) {
            $dayIndex = now()->startOfDay()->diffInDays(now()->startOfDay()->copy()->startOfYear());
            $quote = $quotes[$dayIndex % $quotes->count()];
        }

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

    public function index(Request $request): JsonResponse
    {
        $query = FacultyProfile::with('user:id,name,email');

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
            'name'             => 'required|string|max:255',
            'email'            => 'required|email|unique:users',
            'temporary_password' => 'required|string|min:8',
            'faculty_id'       => 'required|string|unique:faculty_profiles',
            'department'       => 'required|string',
            'rank'             => 'nullable|string',
            'faculty_role'     => 'required|string',
            'assigned_chair_id' => 'nullable|uuid|exists:users,id',
            'notes'            => 'nullable|string',
        ]);

        $facultyProfile = DB::transaction(function () use ($request) {
            $user = User::create([
                'name'      => $request->name,
                'email'     => $request->email,
                'password'  => Hash::make($request->temporary_password),
                'role'      => 'faculty',
                'is_active' => true,
            ]);

            return FacultyProfile::create([
                'user_id'           => $user->id,
                'faculty_id'        => $request->faculty_id,
                'department'        => $request->department,
                'rank'              => $request->rank,
                'faculty_role'      => $request->faculty_role,
                'assigned_chair_id' => $request->assigned_chair_id,
                'notes'             => $request->notes,
                'created_by'        => $request->user()->id,
            ]);
        });

        $this->logger->log($request->user(), 'faculty.created', 'user', $facultyProfile->user_id);

        return response()->json(['data' => $facultyProfile->load('user')], 201);
    }

    public function show(string $id): JsonResponse
    {
        $faculty = FacultyProfile::with('user:id,name,email')->findOrFail($id);

        return response()->json(['data' => $faculty]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $faculty = FacultyProfile::findOrFail($id);

        $request->validate([
            'rank'             => 'nullable|string',
            'faculty_role'     => 'nullable|string',
            'assigned_chair_id' => 'nullable|uuid|exists:users,id',
            'notes'            => 'nullable|string',
        ]);

        $faculty->update($request->only(['rank', 'faculty_role', 'assigned_chair_id', 'notes']));

        return response()->json(['data' => $faculty->load('user')]);
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
}
