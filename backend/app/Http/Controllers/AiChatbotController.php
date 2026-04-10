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

        if (!$apiKey) {
            return response()->json([
                'reply' => 'AI chatbot is currently unavailable. Please try again later.',
            ]);
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'HTTP-Referer'  => config('app.url'),
            'X-Title'       => 'TUP Thesis Archive',
        ])->post('https://openrouter.ai/api/v1/chat/completions', [
            'model'    => 'anthropic/claude-3-haiku',
            'messages' => $messages,
        ]);

        if ($response->failed()) {
            return response()->json([
                'reply' => 'Sorry, there was an error processing your request.',
            ], 500);
        }

        return response()->json([
            'reply' => $response->json('choices.0.message.content'),
        ]);
    }
}
