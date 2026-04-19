<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\StudentProfile;
use App\Models\User;
use App\Services\AblyService;
use App\Services\ActivityLogService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class MessageController extends Controller
{
    public function __construct(
        private AblyService $ably,
        private ActivityLogService $logger,
    ) {}

    public function contacts(Request $request): JsonResponse
    {
        $user = $request->user();

        $contacts = $this->allowedContactsQuery($user)
            ->get()
            ->map(function (User $contact) use ($user) {
                $conversation = $this->findConversationBetween($user->id, $contact->id);

                return [
                    'id' => $contact->id,
                    'name' => $contact->name,
                    'email' => $contact->email,
                    'role' => $contact->role,
                    'avatar_url' => $contact->avatar_url,
                    'conversation_id' => $conversation?->id,
                ];
            })
            ->values();

        return response()->json(['data' => $contacts]);
    }

    public function conversations(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Conversation::query()
            ->with([
                'student:id,name,email,avatar_url,role',
                'faculty:id,name,email,avatar_url,role',
                'participantOne:id,name,email,avatar_url,role',
                'participantTwo:id,name,email,avatar_url,role',
                'latestMessage.sender:id,name,email,avatar_url,role',
            ])
            ->where(function (Builder $conversationQuery) use ($user) {
                $conversationQuery
                    ->where('participant_one_id', $user->id)
                    ->orWhere('participant_two_id', $user->id);
            })
            ->withCount(['messages as unread_count' => fn($q) =>
                $q->where('receiver_id', $user->id)->where('is_read', false)
            ])
            ->orderByDesc('last_message_at');

        $conversations = $query->get()->map(function (Conversation $conversation) {
            $payload = $conversation->toArray();
            $payload['last_message'] = $conversation->latestMessage?->toArray();
            unset($payload['latest_message']);

            return $payload;
        });

        return response()->json(['data' => $conversations]);
    }

    public function startConversation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'contact_id' => 'required|uuid|exists:users,id',
        ]);

        $user = $request->user();
        $contact = User::query()->findOrFail($validated['contact_id']);

        abort_unless($this->canChatWith($user, $contact), 403, 'You cannot start a conversation with this user.');

        $conversation = $this->findConversationBetween($user->id, $contact->id)
            ?? Conversation::create($this->conversationPayloadForParticipants($user, $contact));

        $conversation->load([
            'student:id,name,email,avatar_url,role',
            'faculty:id,name,email,avatar_url,role',
            'participantOne:id,name,email,avatar_url,role',
            'participantTwo:id,name,email,avatar_url,role',
            'latestMessage.sender:id,name,email,avatar_url,role',
        ]);

        $data = $conversation->toArray();
        $data['last_message'] = $conversation->latestMessage?->toArray();
        unset($data['latest_message']);

        return response()->json(['data' => $data], 201);
    }

    public function show(string $conversationId): JsonResponse
    {
        $user = request()->user();
        abort_unless($this->userCanAccessConversation($user, $conversationId), 403, 'You do not have access to this conversation.');

        $messages = Message::where('conversation_id', $conversationId)
            ->with('sender:id,name,email,avatar_url,role')
            ->orderBy('created_at')
            ->get();

        Message::where('conversation_id', $conversationId)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['data' => $messages]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'conversation_id' => 'required|uuid|exists:conversations,id',
            'receiver_id' => 'required|uuid|exists:users,id',
            'body' => 'required_without_all:attachment_url,attachment|nullable|string|max:5000',
            'attachment_url' => 'nullable|url',
            'attachment' => 'nullable|file|max:20480',
        ]);

        $sender = $request->user();
        $receiver = User::query()->findOrFail($request->receiver_id);
        $conversation = Conversation::query()->findOrFail($request->conversation_id);

        abort_unless($this->userCanAccessConversation($sender, $conversation->id), 403, 'You do not have access to this conversation.');
        abort_unless($this->conversationHasParticipant($conversation, $receiver->id), 422, 'Receiver must belong to the selected conversation.');
        abort_unless($this->canChatWith($sender, $receiver), 403, 'You cannot send messages to this user.');

        $uploadedAttachment = $request->hasFile('attachment')
            ? $this->uploadToSupabase($request->file('attachment'), 'messages')
            : null;

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'body' => $request->body,
            'attachment_url' => $uploadedAttachment['url'] ?? $request->attachment_url,
        ]);

        $conversation->update(['last_message_at' => now()]);

        $message->load('sender:id,name,email,avatar_url,role');

        $this->ably->publishMessage($conversation->id, $message->toArray());
        $this->ably->publishNotification($receiver->id, 'notification.new', [
            'type' => 'new_message',
            'title' => 'New message from ' . $sender->name,
            'body' => substr($request->body ?? 'Sent an attachment', 0, 80),
        ]);

        return response()->json(['data' => $message], 201);
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
            'messages/%s/%s/%s-%s',
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
            throw new \RuntimeException('Failed to upload message attachment.');
        }

        return [
            'name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'path' => $path,
            'url' => "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$path}",
        ];
    }

    private function allowedContactsQuery(User $user): Builder
    {
        $query = User::query()
            ->where('id', '!=', $user->id)
            ->where('is_active', true);

        return match ($user->role) {
            'student' => $query->where('role', 'faculty')->orderBy('name'),
            'faculty' => $query->where(function (Builder $nested) {
                $nested->where('role', 'student')->orWhere('role', 'vpaa');
            })->orderBy('name'),
            'vpaa' => $query->where('role', 'faculty')->orderBy('name'),
            default => $query->whereRaw('1 = 0'),
        };
    }

    private function canChatWith(User $user, User $contact): bool
    {
        return match ($user->role) {
            'student' => $contact->role === 'faculty',
            'faculty' => in_array($contact->role, ['student', 'vpaa'], true),
            'vpaa' => $contact->role === 'faculty',
            default => false,
        };
    }

    private function conversationPayloadForParticipants(User $first, User $second): array
    {
        $participants = collect([$first->id, $second->id])->sort()->values();
        $pair = collect([$first, $second]);

        return [
            'participant_one_id' => $participants->get(0),
            'participant_two_id' => $participants->get(1),
            'student_id' => $pair->firstWhere('role', 'student')?->id,
            'faculty_id' => $pair->firstWhere('role', 'faculty')?->id,
            'last_message_at' => null,
        ];
    }

    private function findConversationBetween(string $firstUserId, string $secondUserId): ?Conversation
    {
        $participants = collect([$firstUserId, $secondUserId])->sort()->values();

        return Conversation::query()
            ->where('participant_one_id', $participants->get(0))
            ->where('participant_two_id', $participants->get(1))
            ->first();
    }

    private function userCanAccessConversation(User $user, string $conversationId): bool
    {
        return Conversation::query()
            ->where('id', $conversationId)
            ->where(function (Builder $query) use ($user) {
                $query->where('participant_one_id', $user->id)
                    ->orWhere('participant_two_id', $user->id);
            })
            ->exists();
    }

    private function conversationHasParticipant(Conversation $conversation, string $userId): bool
    {
        return $conversation->participant_one_id === $userId || $conversation->participant_two_id === $userId;
    }
}
