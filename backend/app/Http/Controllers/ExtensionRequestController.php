<?php

namespace App\Http\Controllers;

use App\Models\ExtensionRequest;
use App\Models\Thesis;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExtensionRequestController extends Controller
{
    public function __construct(
        private ActivityLogService $logger,
        private NotificationService $notifications,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'thesis_id' => 'required|uuid|exists:theses,id',
            'requested_deadline' => 'required|date|after:today',
            'reason' => 'required|string|min:10|max:5000',
        ]);

        $user = $request->user();
        $thesis = Thesis::with('adviser:id,name')->findOrFail($validated['thesis_id']);

        if ($user->role !== 'student' || $thesis->submitted_by !== $user->id) {
            return response()->json(['error' => 'You are not allowed to request an extension for this thesis.'], 403);
        }

        if (!$thesis->adviser_id) {
            return response()->json(['error' => 'This thesis has no assigned faculty adviser yet.'], 422);
        }

        $extensionRequest = ExtensionRequest::create([
            'thesis_id' => $thesis->id,
            'student_id' => $user->id,
            'faculty_id' => $thesis->adviser_id,
            'requested_deadline' => $validated['requested_deadline'],
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

        $this->logger->log($user, 'extension.requested', 'extension_request', $extensionRequest->id, [
            'thesis_id' => $thesis->id,
            'faculty_id' => $thesis->adviser_id,
        ]);

        if ($thesis->adviser) {
            $this->notifications->notify(
                $thesis->adviser,
                'extension.requested',
                'New extension request submitted',
                $thesis->title,
                [
                    'extension_request_id' => $extensionRequest->id,
                    'thesis_id' => $thesis->id,
                    'student_id' => $user->id,
                ],
            );
        }

        return response()->json([
            'message' => 'Extension request submitted successfully.',
            'data' => $extensionRequest->load('thesis:id,title', 'student:id,name,email', 'faculty:id,name,email'),
        ], 201);
    }

    public function indexForFaculty(Request $request): JsonResponse
    {
        $requests = ExtensionRequest::query()
            ->where('faculty_id', $request->user()->id)
            ->with([
                'thesis:id,title,status,submitted_by,adviser_id',
                'student:id,name,email',
                'faculty:id,name,email',
            ])
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($requests);
    }
}
