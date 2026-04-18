<?php

namespace App\Services;

use Ably\AblyRest;
use Illuminate\Support\Facades\Log;

class AblyService
{
    private ?AblyRest $client = null;

    public function __construct()
    {
        $key = config('services.ably.key');

        if (!is_string($key) || trim($key) === '') {
            Log::warning('Ably is not configured. Realtime events are disabled.');
            return;
        }

        $this->client = new AblyRest($key);
    }

    /**
     * Publish a message event to a conversation channel.
     * Channel name: private:conversation.{conversationId}
     */
    public function publishMessage(string $conversationId, array $messageData): void
    {
        if (!$this->client) {
            return;
        }

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
        if (!$this->client) {
            return;
        }

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
        if (!$this->client) {
            return;
        }

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
