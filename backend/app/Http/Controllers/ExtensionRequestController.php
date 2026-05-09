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
            'reason' => 'required|string|max:5000',
        ]);

        $user = $request->user();
        $thesis = Thesis::with('adviser:id,name')->findOrFail($validated['thesis_id']);

        if ($user->role !== 'student' || $thesis->submitted_by !== $user->id) {
            return response()->json(['error' => 'You are not allowed to request an extension for this thesis.'], 403);
        }

        if (!$thesis->adviser_id) {
            return response()->json(['error' => 'This thesis has no assigned faculty adviser yet.'], 422);
        }

        $existingPendingRequest = ExtensionRequest::query()
            ->where('thesis_id', $thesis->id)
            ->where('student_id', $user->id)
            ->where('status', 'pending')
            ->latest('created_at')
            ->first();

        if ($existingPendingRequest) {
            return response()->json(['error' => 'You already have a pending extension request for this thesis.'], 422);
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

    public function showForStudentByThesis(Request $request, string $thesisId): JsonResponse
    {
        $thesis = Thesis::query()
            ->where('id', $thesisId)
            ->where('submitted_by', $request->user()->id)
            ->firstOrFail();

        $extensionRequest = ExtensionRequest::query()
            ->where('student_id', $request->user()->id)
            ->where('thesis_id', $thesis->id)
            ->with([
                'thesis:id,title,status,submitted_by,adviser_id,abstract,authors,revision_due_at',
                'student:id,name,email',
                'faculty:id,name,email',
            ])
            ->latest('created_at')
            ->first();

        return response()->json([
            'data' => $extensionRequest,
        ]);
    }

    public function indexForFaculty(Request $request): JsonResponse
    {
        $requests = ExtensionRequest::query()
            ->where('faculty_id', $request->user()->id)
            ->with([
                'thesis:id,title,status,submitted_by,adviser_id,abstract,authors,revision_due_at',
                'student:id,name,email',
                'faculty:id,name,email',
            ])
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($requests);
    }

    public function showForFaculty(Request $request, string $id): JsonResponse
    {
        $extensionRequest = ExtensionRequest::query()
            ->where('faculty_id', $request->user()->id)
            ->with([
                'thesis:id,title,status,submitted_by,adviser_id,abstract,authors,revision_due_at',
                'student:id,name,email',
                'faculty:id,name,email',
            ])
            ->findOrFail($id);

        return response()->json([
            'data' => $extensionRequest,
        ]);
    }

    public function decide(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $extensionRequest = ExtensionRequest::query()
            ->where('faculty_id', $request->user()->id)
            ->with([
                'thesis:id,title,status,submitted_by,adviser_id,abstract,authors,revision_due_at',
                'student:id,name,email',
                'faculty:id,name,email',
            ])
            ->findOrFail($id);

        if ($extensionRequest->status !== 'pending') {
            return response()->json(['error' => 'This extension request has already been resolved.'], 422);
        }

        $extensionRequest->update([
            'status' => $validated['status'],
        ]);

        if ($validated['status'] === 'approved' && $extensionRequest->thesis) {
            $extensionRequest->thesis->update([
                'revision_due_at' => $extensionRequest->requested_deadline,
            ]);
        }

        $eventName = $validated['status'] === 'approved' ? 'extension.approved' : 'extension.rejected';
        $notificationTitle = $validated['status'] === 'approved'
            ? 'Extension request approved'
            : 'Extension request rejected';

        $this->logger->log($request->user(), $eventName, 'extension_request', $extensionRequest->id, [
            'thesis_id' => $extensionRequest->thesis_id,
            'student_id' => $extensionRequest->student_id,
        ]);

        if ($extensionRequest->student) {
            $this->notifications->notify(
                $extensionRequest->student,
                $eventName,
                $notificationTitle,
                $extensionRequest->thesis?->title ?? 'Thesis extension request',
                [
                    'extension_request_id' => $extensionRequest->id,
                    'thesis_id' => $extensionRequest->thesis_id,
                    'status' => $validated['status'],
                ],
            );
        }

        $extensionRequest->refresh()->load([
            'thesis:id,title,status,submitted_by,adviser_id,abstract,authors,revision_due_at',
            'student:id,name,email',
            'faculty:id,name,email',
        ]);

        return response()->json([
            'message' => $validated['status'] === 'approved'
                ? 'Extension request approved successfully.'
                : 'Extension request rejected successfully.',
            'data' => $extensionRequest,
        ]);
    }
}
