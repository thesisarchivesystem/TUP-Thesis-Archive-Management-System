<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiChatbotController extends Controller
{
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'history' => 'nullable|array',
            'history.*.role' => 'required|in:user,assistant',
            'history.*.content' => 'required|string',
        ]);

        $systemPrompt = <<<EOT
You are ArchiveAI, the intelligent assistant for the TUP Manila Thesis Archive Management System (TAMS).
You help students, faculty, and administrators:
- Find and browse thesis records by title, keyword, department, or author
- Understand the thesis submission and approval workflow
- Navigate the system (sign in, upload, review, messaging)
- Answer questions about TUP Manila academic programs and departments
Keep responses concise, friendly, and academically professional.
EOT;

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ...($request->history ?? []),
            ['role' => 'user', 'content' => $request->message],
        ];

        $apiKey = config('services.openrouter.key');
        $baseUrl = rtrim((string) config('services.openrouter.base_url', 'https://openrouter.ai/api/v1'), '/');
        $model = (string) config('services.openrouter.model', 'openai/gpt-4o-mini');
        $siteUrl = (string) config('services.openrouter.site_url', config('app.url'));
        $siteName = (string) config('services.openrouter.site_name', config('app.name', 'TUP Thesis Archive'));

        if (!$apiKey) {
            return response()->json([
                'reply' => 'AI chatbot is currently unavailable. Please try again later.',
                'error' => 'OPENROUTER_API_KEY is not configured.',
            ], 503);
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'HTTP-Referer'  => $siteUrl,
            'X-Title'       => $siteName,
        ])->timeout(60)->post($baseUrl . '/chat/completions', [
            'model'    => $model,
            'messages' => $messages,
        ]);

        if ($response->failed()) {
            return response()->json([
                'reply' => 'Sorry, there was an error processing your request.',
                'error' => $response->json('error.message')
                    ?? $response->json('message')
                    ?? 'OpenRouter request failed.',
            ], 500);
        }

        return response()->json([
            'reply' => $response->json('choices.0.message.content') ?: 'No reply was returned by the AI provider.',
        ]);
    }
}
