<?php

namespace App\Services;

use App\Models\DailyQuote;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DailyQuoteService
{
    private const FALLBACK_QUOTES = [
        ['body' => 'Research is creating new knowledge.', 'author' => 'Neil Armstrong'],
        ['body' => 'The important thing is not to stop questioning.', 'author' => 'Albert Einstein'],
        ['body' => 'Education is the passport to the future, for tomorrow belongs to those who prepare for it today.', 'author' => 'Malcolm X'],
        ['body' => 'The beautiful thing about learning is that no one can take it away from you.', 'author' => 'B.B. King'],
        ['body' => 'Success is the sum of small efforts repeated day in and day out.', 'author' => 'Robert Collier'],
        ['body' => 'A room without books is like a body without a soul.', 'author' => 'Marcus Tullius Cicero'],
        ['body' => 'There is more treasure in books than in all the pirate\'s loot on Treasure Island.', 'author' => 'Walt Disney'],
    ];

    public function getTodayQuote(): ?array
    {
        $today = now()->toDateString();

        return Cache::remember(
            "zenquotes.daily.{$today}",
            now()->endOfDay(),
            fn () => $this->fetchTodayQuote($today)
        );
    }

    private function fetchTodayQuote(string $today): ?array
    {
        $localQuote = DailyQuote::query()
            ->whereDate('quote_date', $today)
            ->where('is_active', DB::raw('true'))
            ->first();

        if ($localQuote) {
            return $this->formatDatabaseQuote($localQuote);
        }

        $fallbackQuote = DailyQuote::query()
            ->where('is_active', DB::raw('true'))
            ->orderByDesc('quote_date')
            ->first();

        if ($fallbackQuote) {
            return $this->formatDatabaseQuote($fallbackQuote);
        }

        $baseUrl = rtrim((string) config('services.zenquotes.base_url', 'https://zenquotes.io/api'), '/');
        $apiKey = trim((string) config('services.zenquotes.key', ''));
        $endpoint = $apiKey === ''
            ? "{$baseUrl}/today"
            : "{$baseUrl}/today/{$apiKey}";

        try {
            $response = Http::acceptJson()
                ->timeout(2)
                ->get($endpoint)
                ->throw();
        } catch (\Throwable $exception) {
            Log::warning('Failed to fetch ZenQuotes daily quote.', [
                'endpoint' => $endpoint,
                'message' => $exception->getMessage(),
            ]);

            return $this->formatFallbackQuote($today);
        }

        $payload = $response->json();

        if (!is_array($payload) || !isset($payload[0]) || !is_array($payload[0])) {
            Log::warning('ZenQuotes daily quote response had an unexpected format.', [
                'payload' => $payload,
            ]);

            return $this->formatFallbackQuote($today);
        }

        $quote = $payload[0];
        $body = isset($quote['q']) ? trim((string) $quote['q']) : '';
        $author = isset($quote['a']) ? trim((string) $quote['a']) : '';

        if ($body === '' || $author === '') {
            return $this->formatFallbackQuote($today);
        }

        return [
            'id' => "zenquotes-{$today}",
            'body' => $body,
            'author' => $author,
            'quote_date' => $today,
            'is_active' => true,
            'source' => 'zenquotes',
            'attribution_text' => 'Inspirational quotes provided by ZenQuotes API',
            'attribution_url' => 'https://zenquotes.io/',
            'fetched_at' => Carbon::now()->toISOString(),
        ];
    }

    private function formatDatabaseQuote(DailyQuote $quote): array
    {
        return [
            'id' => $quote->id,
            'body' => $quote->body,
            'author' => $quote->author,
            'quote_date' => optional($quote->quote_date)->toDateString(),
            'is_active' => (bool) $quote->is_active,
            'source' => 'local',
        ];
    }

    private function formatFallbackQuote(string $today): array
    {
        $quote = self::FALLBACK_QUOTES[abs(crc32($today)) % count(self::FALLBACK_QUOTES)];

        return [
            'id' => "fallback-{$today}",
            'body' => $quote['body'],
            'author' => $quote['author'],
            'quote_date' => $today,
            'is_active' => true,
            'source' => 'fallback',
        ];
    }
}
