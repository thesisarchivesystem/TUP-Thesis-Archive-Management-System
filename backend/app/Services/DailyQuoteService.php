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

            return null;
        }

        $payload = $response->json();

        if (!is_array($payload) || !isset($payload[0]) || !is_array($payload[0])) {
            Log::warning('ZenQuotes daily quote response had an unexpected format.', [
                'payload' => $payload,
            ]);

            return null;
        }

        $quote = $payload[0];
        $body = isset($quote['q']) ? trim((string) $quote['q']) : '';
        $author = isset($quote['a']) ? trim((string) $quote['a']) : '';

        if ($body === '' || $author === '') {
            return null;
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
}
