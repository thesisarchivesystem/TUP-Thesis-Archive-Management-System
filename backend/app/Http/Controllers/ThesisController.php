<?php

namespace App\Http\Controllers;

use App\Models\Thesis;
use App\Models\Notification;
use App\Models\RecentlyViewed;
use App\Services\AblyService;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ThesisController extends Controller
{
    public function __construct(
        private AblyService $ably,
        private ActivityLogService $logger,
    ) {}

    public function index(): JsonResponse
    {
        $theses = Thesis::where('status', 'approved')
            ->with('submitter:id,name')
            ->orderByDesc('approved_at')
            ->paginate(20);

        return response()->json($theses);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title'       => 'required|string|max:500',
            'abstract'    => 'nullable|string',
            'keywords'    => 'nullable|array',
            'keywords.*'  => 'string|max:100',
            'department'  => 'required|string',
            'program'     => 'nullable|string',
            'school_year' => 'required|string',
            'authors'     => 'nullable|array',
            'authors.*'   => 'string|max:255',
            'file_url'    => 'nullable|url',
            'file_name'   => 'nullable|string',
            'file_size'   => 'nullable|integer',
        ]);

        $thesis = Thesis::create([
            'title'        => $request->title,
            'abstract'     => $request->abstract,
            'keywords'     => $request->keywords ?? [],
            'department'   => $request->department,
            'program'      => $request->program,
            'school_year'  => $request->school_year,
            'authors'      => $request->authors ?? [],
            'file_url'     => $request->file_url,
            'file_name'    => $request->file_name,
            'file_size'    => $request->file_size,
            'status'       => 'draft',
            'submitted_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $thesis], 201);
    }

    public function show(string $id): JsonResponse
    {
        $thesis = Thesis::with('submitter:id,name', 'adviser:id,name')->findOrFail($id);

        // Track view if authenticated as student
        if (auth()->check() && auth()->user()->role === 'student') {
            RecentlyViewed::updateOrCreate(
                ['user_id' => auth()->id(), 'thesis_id' => $thesis->id],
                ['viewed_at' => now()]
            );
        }

        // Increment view count
        $thesis->increment('view_count');

        return response()->json(['data' => $thesis]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $thesis = Thesis::findOrFail($id);

        // Only allow updating if status is draft
        if ($thesis->status !== 'draft') {
            return response()->json(['error' => 'Cannot update submitted theses'], 403);
        }

        $thesis->update($request->only([
            'title', 'abstract', 'keywords', 'department', 'program', 'school_year', 'authors',
        ]));

        return response()->json(['data' => $thesis]);
    }

    public function submit(Request $request, string $id): JsonResponse
    {
        $thesis = Thesis::findOrFail($id);

        if ($thesis->status !== 'draft') {
            return response()->json(['error' => 'Thesis already submitted'], 403);
        }

        if (!$thesis->file_url) {
            return response()->json(['error' => 'File is required to submit'], 422);
        }

        $thesis->update([
            'status'       => 'pending',
            'submitted_at' => now(),
        ]);

        $this->logger->log($request->user(), 'thesis.submitted', 'thesis', $thesis->id);

        return response()->json(['data' => $thesis]);
    }

    public function review(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'status'           => 'required|in:approved,rejected',
            'adviser_remarks'  => 'nullable|string|max:2000',
            'rejection_reason' => 'required_if:status,rejected|nullable|string|max:2000',
        ]);

        $thesis = Thesis::findOrFail($id);

        $thesis->update([
            'status'           => $request->status,
            'adviser_remarks'  => $request->adviser_remarks,
            'rejection_reason' => $request->rejection_reason,
            'reviewed_at'      => now(),
            'approved_at'      => $request->status === 'approved' ? now() : null,
        ]);

        // ── Notify student via Ably ──────────────────────────────
        $eventName = $request->status === 'approved' ? 'thesis.approved' : 'thesis.rejected';
        $this->ably->publishNotification($thesis->submitted_by, $eventName, [
            'thesis_id'    => $thesis->id,
            'thesis_title' => $thesis->title,
            'status'       => $request->status,
            'remarks'      => $request->adviser_remarks,
            'reason'       => $request->rejection_reason,
        ]);

        // ── Save DB notification ─────────────────────────────────
        Notification::create([
            'user_id' => $thesis->submitted_by,
            'type'    => $eventName,
            'title'   => $request->status === 'approved'
                         ? 'Thesis Approved 🎉'
                         : 'Thesis Needs Revision',
            'body'    => $request->adviser_remarks ?? $request->rejection_reason,
            'data'    => ['thesis_id' => $thesis->id],
        ]);

        // ── Log activity ─────────────────────────────────────────
        $this->logger->log($request->user(), $eventName, 'thesis', $thesis->id);

        return response()->json(['data' => $thesis]);
    }

    public function pendingReview(Request $request): JsonResponse
    {
        $theses = Thesis::whereIn('status', ['pending', 'under_review'])
            ->where('adviser_id', $request->user()->id)
            ->with('submitter:id,name')
            ->orderByDesc('submitted_at')
            ->paginate(20);

        return response()->json($theses);
    }

    public function approved(Request $request): JsonResponse
    {
        $theses = Thesis::where('status', 'approved')
            ->with('submitter:id,name')
            ->orderByDesc('approved_at')
            ->paginate(20);

        return response()->json($theses);
    }

    public function mySubmissions(Request $request): JsonResponse
    {
        $theses = Thesis::where('submitted_by', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($theses);
    }

    public function recentlyViewed(Request $request): JsonResponse
    {
        $theses = RecentlyViewed::where('user_id', $request->user()->id)
            ->orderByDesc('viewed_at')
            ->with('thesis')
            ->paginate(20);

        return response()->json($theses);
    }
}
