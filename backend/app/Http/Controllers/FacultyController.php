<?php

namespace App\Http\Controllers;

use App\Models\FacultyProfile;
use App\Models\StudentProfile;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class FacultyController extends Controller
{
    public function __construct(private ActivityLogService $logger) {}

    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        $assignedStudents = StudentProfile::where('adviser_id', $user->id)->count();
        $pendingReviews = \App\Models\Thesis::whereIn('status', ['pending', 'under_review'])
            ->where('adviser_id', $user->id)
            ->count();
        $approvedThesis = \App\Models\Thesis::where('status', 'approved')
            ->where('adviser_id', $user->id)
            ->count();
        $totalSubmissions = \App\Models\Thesis::where('adviser_id', $user->id)->count();

        return response()->json([
            'stats' => [
                'assigned_students' => $assignedStudents,
                'pending_reviews' => $pendingReviews,
                'approved_thesis' => $approvedThesis,
                'total_submissions' => $totalSubmissions,
            ],
        ]);
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

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->temporary_password),
            'role'     => 'faculty',
            'is_active' => true,
        ]);

        FacultyProfile::create([
            'user_id'          => $user->id,
            'faculty_id'       => $request->faculty_id,
            'department'       => $request->department,
            'rank'             => $request->rank,
            'faculty_role'     => $request->faculty_role,
            'assigned_chair_id' => $request->assigned_chair_id,
            'notes'            => $request->notes,
            'created_by'       => $request->user()->id,
        ]);

        $this->logger->log($request->user(), 'faculty.created', 'user', $user->id);

        return response()->json(['data' => $user->load('faculty')], 201);
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
