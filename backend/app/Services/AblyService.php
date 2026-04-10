<?php

namespace App\Services;

use Ably\AblyRest;
use Illuminate\Support\Facades\Log;

class AblyService
{
    private AblyRest $client;

    public function __construct()
    {
        $this->client = new AblyRest(config('services.ably.key'));
    }

    /**
     * Publish a message event to a conversation channel.
     * Channel name: private:conversation.{conversationId}
     */
    public function publishMessage(string $conversationId, array $messageData): void
    {
        try {
            $channel = $this->client->channel('private:conversation.' . $conversationId);
            $channel->publish('message.new', $messageData);
        } catch (\Exception $e) {
            Log::error('Ably publishMessage failed: ' . $e->getMessage());
        }
    }

    /**
     * Publish a thesis status change to a user's personal notification channel.
     * Channel name: private:notifications.{userId}
     */
    public function publishNotification(string $userId, string $event, array $data): void
    {
        try {
            $channel = $this->client->channel('private:notifications.' . $userId);
            $channel->publish($event, $data);
        } catch (\Exception $e) {
            Log::error('Ably publishNotification failed: ' . $e->getMessage());
        }
    }

    /**
     * Publish a typing indicator event.
     */
    public function publishTyping(string $conversationId, string $senderId, bool $isTyping): void
    {
        try {
            $channel = $this->client->channel('private:conversation.' . $conversationId);
            $channel->publish('typing', [
                'user_id'   => $senderId,
                'is_typing' => $isTyping,
            ]);
        } catch (\Exception $e) {
            Log::error('Ably publishTyping failed: ' . $e->getMessage());
        }
    }
}
