<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $allowedTypes = $this->allowedTypesForRole((string) $request->user()->role);

        $notifications = Notification::where('user_id', $request->user()->id)
            ->whereIn('type', $allowedTypes)
            ->whereNull('read_at')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($notifications);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        $notification = Notification::findOrFail($id);

        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $notification->update(['read_at' => now()]);

        return response()->json(['data' => $notification]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $allowedTypes = $this->allowedTypesForRole((string) $request->user()->role);

        Notification::where('user_id', $request->user()->id)
            ->whereIn('type', $allowedTypes)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    private function allowedTypesForRole(string $role): array
    {
        return match ($role) {
            'student' => [
                'new_message',
                'thesis.uploaded',
                'thesis.approved',
                'thesis.rejected',
                'thesis.archived',
            ],
            'faculty' => [
                'new_message',
                'thesis.submitted',
                'extension.requested',
                'department.file_shared',
                'student.created',
            ],
            'vpaa' => [
                'new_message',
                'faculty.created',
                'faculty.role_changed',
            ],
            default => ['new_message'],
        };
    }
}
