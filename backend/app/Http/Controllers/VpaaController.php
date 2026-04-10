<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VpaaController extends Controller
{
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

        return response()->json([
            'stats' => [
                'total_faculty' => $totalFaculty,
                'department_chairs' => $departmentChairs,
                'role_changes_this_month' => $roleChangesThisMonth,
                'new_accounts_this_month' => $newAccountsThisMonth,
                'on_leave' => $onLeave,
            ],
            'recent_activity' => $recentActivity,
        ]);
    }

    public function activityLog(Request $request): JsonResponse
    {
        $logs = ActivityLog::with('user:id,name,avatar_url')
            ->orderByDesc('created_at')
            ->paginate(50);

        return response()->json($logs);
    }
}
