<?php

namespace App\Http\Controllers;

use App\Models\StudentProfile;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StudentController extends Controller
{
    public function __construct(private ActivityLogService $logger) {}

    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        $mySubmissions = \App\Models\Thesis::where('submitted_by', $user->id)->count();
        $totalViews = \App\Models\Thesis::where('submitted_by', $user->id)->sum('view_count');
        $pendingReview = \App\Models\Thesis::where('submitted_by', $user->id)
            ->whereIn('status', ['pending', 'under_review'])
            ->count();
        $approved = \App\Models\Thesis::where('submitted_by', $user->id)
            ->where('status', 'approved')
            ->count();

        return response()->json([
            'stats' => [
                'my_submissions' => $mySubmissions,
                'total_views' => $totalViews,
                'pending_review' => $pendingReview,
                'approved' => $approved,
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = StudentProfile::with('user:id,name,email');

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
            'name'               => 'required|string|max:255',
            'email'              => 'required|email|unique:users',
            'temporary_password' => 'required|string|min:8',
            'student_id'         => 'required|string|unique:student_profiles',
            'department'         => 'required|string',
            'program'            => 'required|string',
            'year_level'         => 'nullable|integer',
        ]);

        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name'      => $request->name,
                'email'     => $request->email,
                'password'  => Hash::make($request->temporary_password),
                'role'      => 'student',
                'is_active' => true,
            ]);

            StudentProfile::create([
                'user_id'    => $user->id,
                'student_id' => $request->student_id,
                'department' => $request->department,
                'program'    => $request->program,
                'year_level' => $request->year_level,
                'adviser_id' => $request->user()->id,
                'created_by' => $request->user()->id,
            ]);

            return $user;
        });

        $this->logger->log($request->user(), 'student.created', 'user', $user->id);

        return response()->json(['data' => $user->load('student')], 201);
    }

    public function show(string $id): JsonResponse
    {
        $student = StudentProfile::with('user:id,name,email')->findOrFail($id);

        return response()->json(['data' => $student]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $student = StudentProfile::findOrFail($id);

        $student->update($request->only(['department', 'program', 'year_level']));

        return response()->json(['data' => $student->load('user')]);
    }

    public function destroy(string $id): JsonResponse
    {
        $student = StudentProfile::findOrFail($id);
        $user = $student->user;
        $user->delete();

        return response()->json(['message' => 'Student deleted']);
    }
}
