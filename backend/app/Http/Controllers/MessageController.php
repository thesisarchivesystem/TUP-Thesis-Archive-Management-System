<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Notification;
use App\Services\AblyService;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function __construct(
        private AblyService $ably,
        private ActivityLogService $logger,
    ) {}

    public function conversations(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = Conversation::query()
            ->with([
                'student:id,name,email,avatar_url',
                'faculty:id,name,email,avatar_url',
                'latestMessage.sender:id,name,avatar_url',
            ])
            ->orderByDesc('last_message_at');

        if ($user->role === 'student') {
            $query->where('student_id', $user->id)
                ->withCount(['messages as unread_count' => fn($q) =>
                    $q->where('receiver_id', $user->id)->where('is_read', false)
                ]);
        } elseif ($user->role === 'faculty') {
            $query->where('faculty_id', $user->id)
                ->withCount(['messages as unread_count' => fn($q) =>
                    $q->where('receiver_id', $user->id)->where('is_read', false)
                ]);
        } else {
            $query->withCount(['messages as unread_count' => fn($q) =>
                $q->where('receiver_id', $user->id)->where('is_read', false)
            ]);
        }

        $conversations = $query->get()->map(function (Conversation $conversation) {
            $payload = $conversation->toArray();
            $payload['last_message'] = $conversation->latestMessage?->toArray();
            unset($payload['latest_message']);

            return $payload;
        });

        return response()->json(['data' => $conversations]);
    }

    public function show(string $conversationId): JsonResponse
    {
        $messages = Message::where('conversation_id', $conversationId)
            ->with('sender:id,name,avatar_url')
            ->orderBy('created_at')
            ->get();

        // Mark received messages as read
        Message::where('conversation_id', $conversationId)
            ->where('receiver_id', request()->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['data' => $messages]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'conversation_id' => 'required|uuid|exists:conversations,id',
            'receiver_id'     => 'required|uuid|exists:users,id',
            'body'            => 'required_without:attachment_url|nullable|string|max:5000',
            'attachment_url'  => 'nullable|url',
        ]);

        $message = Message::create([
            'conversation_id' => $request->conversation_id,
            'sender_id'       => $request->user()->id,
            'receiver_id'     => $request->receiver_id,
            'body'            => $request->body,
            'attachment_url'  => $request->attachment_url,
        ]);

        // Update conversation timestamp
        Conversation::where('id', $request->conversation_id)
            ->update(['last_message_at' => now()]);

        $message->load('sender:id,name,avatar_url');

        // ── Publish to Ably ─────────────────────────────────────
        $this->ably->publishMessage($request->conversation_id, $message->toArray());

        // Also push a notification event to the receiver's channel
        $this->ably->publishNotification($request->receiver_id, 'notification.new', [
            'type'  => 'new_message',
            'title' => 'New message from ' . $request->user()->name,
            'body'  => substr($request->body ?? 'Sent an attachment', 0, 80),
        ]);

        return response()->json(['data' => $message], 201);
    }
}
