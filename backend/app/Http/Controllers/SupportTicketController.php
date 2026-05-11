<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SupportTicketController extends Controller
{
    public function __construct(
        private ActivityLogService $logger,
        private NotificationService $notifications,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'nullable|string|max:255',
            'category' => 'required|string|max:255',
            'message' => 'required|string|min:10|max:5000',
            'attachment' => 'nullable|image|max:5120',
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high'])],
        ]);

        $user = $request->user();
        $uploadedAttachment = $request->hasFile('attachment')
            ? $this->uploadToSupabase($request->file('attachment'), 'support-tickets')
            : null;

        $ticket = SupportTicket::create([
            'user_id' => $user->id,
            'requester_role' => $user->role,
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'subject' => trim((string) ($validated['subject'] ?? '')) ?: $validated['category'],
            'category' => $validated['category'],
            'message' => $validated['message'],
            'attachment_url' => $uploadedAttachment['url'] ?? null,
            'priority' => $validated['priority'] ?? $this->inferPriority($validated['category']),
            'status' => 'open',
        ]);

        $this->logger->log($user, 'support.ticket_created', 'support_ticket', $ticket->id, [
            'category' => $ticket->category,
            'requester_role' => $ticket->requester_role,
            'priority' => $ticket->priority,
        ]);

        $this->notifyAdminsOfTicketActivity(
            $ticket->fresh(['user:id,name,email,role']),
            'support.ticket_created',
            'New support ticket',
            "{$ticket->full_name} submitted {$this->ticketReference($ticket)}: {$ticket->subject}.",
        );

        return response()->json([
            'message' => 'Support ticket submitted successfully.',
            'data' => $this->transformTicket($ticket->fresh(['user:id,name,email', 'assignee:id,name,email'])),
        ], 201);
    }

    public function indexForAdmin(Request $request): JsonResponse
    {
        $status = trim((string) $request->input('status', ''));
        $priority = trim((string) $request->input('priority', ''));
        $search = trim((string) $request->input('search', ''));

        $query = SupportTicket::query()
            ->with(['user:id,name,email', 'assignee:id,name,email'])
            ->withCount('replies')
            ->orderByRaw("
                CASE
                    WHEN status = 'open' THEN 1
                    WHEN status = 'in_progress' THEN 2
                    WHEN status = 'resolved' THEN 3
                    WHEN status = 'closed' THEN 4
                    ELSE 5
                END
            ")
            ->orderByDesc('updated_at');

        if ($status !== '') {
            $query->where('status', $status);
        }

        if ($priority !== '') {
            $query->where('priority', $priority);
        }

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('full_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");
            });
        }

        $tickets = $query->get();

        $stats = [
            'total' => SupportTicket::query()->count(),
            'open' => SupportTicket::query()->where('status', 'open')->count(),
            'in_progress' => SupportTicket::query()->where('status', 'in_progress')->count(),
            'resolved' => SupportTicket::query()->where('status', 'resolved')->count(),
        ];

        $agents = User::query()
            ->where('role', 'admin')
            ->whereRaw('"is_active" IS TRUE')
            ->orderByRaw('LOWER(name) asc')
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])
            ->values()
            ->all();

        return response()->json([
            'data' => [
                'stats' => $stats,
                'agents' => $agents,
                'tickets' => $tickets->map(fn (SupportTicket $ticket) => $this->transformTicket($ticket, false))->values(),
            ],
        ]);
    }

    public function showForAdmin(string $id): JsonResponse
    {
        $ticket = SupportTicket::query()
            ->with([
                'user:id,name,email',
                'assignee:id,name,email',
                'replies' => fn ($query) => $query->with('user:id,name,email')->orderBy('created_at'),
            ])
            ->findOrFail($id);

        return response()->json([
            'data' => $this->transformTicket($ticket, true),
        ]);
    }

    public function updateForAdmin(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::in(['open', 'in_progress', 'resolved', 'closed'])],
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high'])],
            'assigned_to' => [
                'nullable',
                'uuid',
                Rule::exists('users', 'id')->where(fn ($query) => $query->where('role', 'admin')),
            ],
        ]);

        $ticket = SupportTicket::query()
            ->with(['user:id,name,email', 'assignee:id,name,email', 'replies' => fn ($query) => $query->orderBy('created_at')])
            ->findOrFail($id);
        $admin = $request->user();
        $changes = [];
        $statusChangedTo = null;

        if (array_key_exists('status', $validated) && $validated['status'] !== $ticket->status) {
            $previousStatus = $this->statusLabel($ticket->status);
            $ticket->status = $validated['status'];
            $ticket->resolved_at = in_array($validated['status'], ['resolved', 'closed'], true) ? now() : null;
            $statusChangedTo = $validated['status'];
            $changes[] = "Status updated from {$previousStatus} to ".$this->statusLabel($validated['status']).'.';
        }

        if (array_key_exists('priority', $validated) && $validated['priority'] !== $ticket->priority) {
            $previousPriority = $this->priorityLabel($ticket->priority);
            $ticket->priority = $validated['priority'];
            $changes[] = "Priority updated from {$previousPriority} to ".$this->priorityLabel($validated['priority']).'.';
        }

        if (array_key_exists('assigned_to', $validated) && $validated['assigned_to'] !== $ticket->assigned_to) {
            $newAssignee = null;
            if (!empty($validated['assigned_to'])) {
                $newAssignee = User::query()->find($validated['assigned_to']);
            }

            $ticket->assigned_to = $validated['assigned_to'] ?? null;
            $changes[] = $newAssignee
                ? 'Assigned to '.$newAssignee->name.'.'
                : 'Ticket assignment cleared.';
        }

        if ($changes === []) {
            return response()->json([
                'data' => $this->transformTicket($ticket->fresh(['user:id,name,email', 'assignee:id,name,email', 'replies' => fn ($query) => $query->with('user:id,name,email')->orderBy('created_at')]), true),
            ]);
        }

        $ticket->save();

        foreach ($changes as $message) {
            $this->createSystemReply($ticket, $admin, $message);
        }

        $this->logger->log($admin, 'support.ticket_updated', 'support_ticket', $ticket->id, [
            'changes' => $changes,
        ]);

        if ($statusChangedTo !== null) {
            $freshTicket = $ticket->fresh(['user:id,name,email,role']);
            $this->notifyRequesterOfStatusChange($freshTicket, $statusChangedTo);
            $this->notifyAdminsOfStatusChange($freshTicket, $statusChangedTo);
        } else {
            $this->notifyAdminsOfTicketActivity(
                $ticket->fresh(['user:id,name,email,role']),
                'support.ticket_updated',
                'Support ticket updated',
                "{$this->ticketReference($ticket)} was updated: ".implode(' ', $changes),
                $admin->id,
            );
        }

        return response()->json([
            'data' => $this->transformTicket($ticket->fresh(['user:id,name,email', 'assignee:id,name,email', 'replies' => fn ($query) => $query->with('user:id,name,email')->orderBy('created_at')]), true),
        ]);
    }

    public function replyForAdmin(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|min:2|max:5000',
        ]);

        $ticket = SupportTicket::query()->findOrFail($id);
        $admin = $request->user();

        SupportTicketReply::create([
            'support_ticket_id' => $ticket->id,
            'user_id' => $admin->id,
            'author_role' => $admin->role,
            'author_name' => $admin->name,
            'message' => $validated['message'],
            'is_system' => false,
        ]);

        $ticket->touch();

        $this->logger->log($admin, 'support.ticket_replied', 'support_ticket', $ticket->id);

        $this->notifyAdminsOfTicketActivity(
            $ticket->fresh(['user:id,name,email,role']),
            'support.ticket_replied',
            'Support ticket reply added',
            "{$admin->name} replied to {$this->ticketReference($ticket)}.",
            $admin->id,
        );

        return response()->json([
            'data' => $this->transformTicket($ticket->fresh(['user:id,name,email', 'assignee:id,name,email', 'replies' => fn ($query) => $query->with('user:id,name,email')->orderBy('created_at')]), true),
        ]);
    }

    private function createSystemReply(SupportTicket $ticket, User $admin, string $message): void
    {
        SupportTicketReply::create([
            'support_ticket_id' => $ticket->id,
            'user_id' => $admin->id,
            'author_role' => $admin->role,
            'author_name' => $admin->name,
            'message' => $message,
            'is_system' => true,
        ]);
    }

    private function notifyRequesterOfStatusChange(SupportTicket $ticket, string $status): void
    {
        $requester = $ticket->user;

        if (!$requester || !in_array($requester->role, ['student', 'faculty'], true)) {
            return;
        }

        $reference = $this->ticketReference($ticket);

        if ($status === 'in_progress') {
            $this->notifications->notify(
                $requester,
                'support.ticket_in_progress',
                'Support ticket in progress',
                "Your ticket {$reference} is now being reviewed by the archive support team.",
                [
                    'support_ticket_id' => $ticket->id,
                    'reference' => $reference,
                    'status' => $status,
                ],
            );
            return;
        }

        if (in_array($status, ['resolved', 'closed'], true)) {
            $this->notifications->notify(
                $requester,
                'support.ticket_resolved',
                'Support ticket resolved',
                "Your ticket {$reference} has been marked as resolved.",
                [
                    'support_ticket_id' => $ticket->id,
                    'reference' => $reference,
                    'status' => $status,
                ],
            );
        }
    }

    private function notifyAdminsOfStatusChange(SupportTicket $ticket, string $status): void
    {
        $reference = $this->ticketReference($ticket);
        $isResolved = in_array($status, ['resolved', 'closed'], true);

        $this->notifyAdminsOfTicketActivity(
            $ticket,
            $isResolved ? 'support.ticket_resolved' : 'support.ticket_in_progress',
            $isResolved ? 'Support ticket resolved' : 'Support ticket in progress',
            $isResolved
                ? "{$reference} has been marked as resolved."
                : "{$reference} is now marked in progress.",
        );
    }

    private function notifyAdminsOfTicketActivity(
        SupportTicket $ticket,
        string $type,
        string $title,
        string $body,
        ?string $exceptUserId = null,
    ): void {
        $reference = $this->ticketReference($ticket);

        User::query()
            ->where('role', 'admin')
            ->whereRaw('"is_active" IS TRUE')
            ->when($exceptUserId, fn ($query) => $query->where('id', '!=', $exceptUserId))
            ->get(['id', 'name', 'email', 'role'])
            ->each(function (User $admin) use ($ticket, $type, $title, $body, $reference) {
                $this->notifications->notify(
                    $admin,
                    $type,
                    $title,
                    $body,
                    [
                        'support_ticket_id' => $ticket->id,
                        'reference' => $reference,
                        'status' => $ticket->status,
                        'priority' => $ticket->priority,
                        'requester_name' => $ticket->full_name,
                    ],
                );
            });
    }

    private function transformTicket(SupportTicket $ticket, bool $includeReplies = true): array
    {
        $submittedAt = $ticket->created_at instanceof Carbon ? $ticket->created_at : optional($ticket->created_at);
        $updatedAt = $ticket->updated_at instanceof Carbon ? $ticket->updated_at : optional($ticket->updated_at);

        $data = [
            'id' => $ticket->id,
            'reference' => $this->ticketReference($ticket),
            'requester_role' => $ticket->requester_role,
            'full_name' => $ticket->full_name,
            'email' => $ticket->email,
            'subject' => $ticket->subject ?: $ticket->category,
            'category' => $ticket->category,
            'message' => $ticket->message,
            'attachment_url' => $ticket->attachment_url,
            'attachment_access_url' => $ticket->attachment_url ? $this->createSignedSupabaseUrl($ticket->attachment_url) : null,
            'status' => $ticket->status,
            'priority' => $ticket->priority ?: 'medium',
            'submitted_at' => $submittedAt?->toISOString(),
            'updated_at' => $updatedAt?->toISOString(),
            'resolved_at' => $ticket->resolved_at?->toISOString(),
            'requester' => [
                'id' => $ticket->user?->id,
                'name' => $ticket->user?->name ?? $ticket->full_name,
                'email' => $ticket->user?->email ?? $ticket->email,
            ],
            'assignee' => $ticket->assignee ? [
                'id' => $ticket->assignee->id,
                'name' => $ticket->assignee->name,
                'email' => $ticket->assignee->email,
            ] : null,
            'replies_count' => $ticket->replies_count ?? ($ticket->relationLoaded('replies') ? $ticket->replies->count() : 0),
        ];

        if ($includeReplies) {
            $data['replies'] = $ticket->relationLoaded('replies')
                ? $ticket->replies->map(fn (SupportTicketReply $reply) => [
                    'id' => $reply->id,
                    'author_name' => $reply->author_name,
                    'author_role' => $reply->author_role,
                    'message' => $reply->message,
                    'is_system' => $reply->is_system,
                    'created_at' => $reply->created_at?->toISOString(),
                ])->values()->all()
                : [];
        }

        return $data;
    }

    private function inferPriority(string $category): string
    {
        $normalized = strtolower(trim($category));

        if (str_contains($normalized, 'upload') || str_contains($normalized, 'access')) {
            return 'high';
        }

        if (str_contains($normalized, 'approval') || str_contains($normalized, 'review')) {
            return 'medium';
        }

        return 'low';
    }

    private function ticketReference(SupportTicket $ticket): string
    {
        $submittedAt = $ticket->created_at instanceof Carbon ? $ticket->created_at : optional($ticket->created_at);

        return sprintf(
            'TKT-%s-%s',
            $submittedAt?->format('Y') ?? now()->format('Y'),
            strtoupper(substr(str_replace('-', '', $ticket->id), 0, 6))
        );
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
            '%s/%s/%s-%s',
            $folder,
            now()->format('Y/m'),
            (string) Str::uuid(),
            preg_replace('/[^A-Za-z0-9.\-_]/', '-', $file->getClientOriginalName())
        );

        $contentType = $file->getMimeType() ?: 'application/octet-stream';

        $response = Http::withHeaders([
            'apikey' => $serviceKey,
            'Authorization' => 'Bearer ' . $serviceKey,
            'x-upsert' => 'true',
            'Content-Type' => $contentType,
        ])->withBody(file_get_contents($file->getRealPath()), $contentType)
            ->post("{$supabaseUrl}/storage/v1/object/{$bucket}/{$path}");

        if ($response->failed()) {
            throw new \RuntimeException('Failed to upload support ticket attachment.');
        }

        return [
            'name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'path' => $path,
            'url' => "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$path}",
        ];
    }

    private function createSignedSupabaseUrl(string $url, int $expiresIn = 3600): ?string
    {
        $supabaseUrl = rtrim((string) config('services.supabase.url'), '/');
        $serviceKey = (string) config('services.supabase.service_key');
        $bucket = (string) config('services.supabase.bucket');

        if ($supabaseUrl === '' || $serviceKey === '' || $bucket === '') {
            throw new \RuntimeException('Supabase storage is not configured.');
        }

        $publicPrefix = "{$supabaseUrl}/storage/v1/object/public/{$bucket}/";
        $privatePrefix = "{$supabaseUrl}/storage/v1/object/{$bucket}/";

        if (str_starts_with($url, $publicPrefix)) {
            $path = substr($url, strlen($publicPrefix));
        } elseif (str_starts_with($url, $privatePrefix)) {
            $path = substr($url, strlen($privatePrefix));
        } else {
            return null;
        }

        $response = Http::withHeaders([
            'apikey' => $serviceKey,
            'Authorization' => 'Bearer ' . $serviceKey,
        ])->post("{$supabaseUrl}/storage/v1/object/sign/{$bucket}/{$path}", [
            'expiresIn' => $expiresIn,
        ]);

        if ($response->failed()) {
            return null;
        }

        $signedPath = $response->json('signedURL');
        if (!is_string($signedPath) || trim($signedPath) === '') {
            return null;
        }

        return str_starts_with($signedPath, 'http')
            ? $signedPath
            : "{$supabaseUrl}/storage/v1{$signedPath}";
    }

    private function statusLabel(?string $status): string
    {
        return str($status ?? 'open')->replace('_', ' ')->title()->toString();
    }

    private function priorityLabel(?string $priority): string
    {
        return str($priority ?? 'medium')->title()->toString();
    }
}
