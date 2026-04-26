<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AiChatbotController extends Controller
{
    private const OUT_OF_SCOPE_REPLY = 'Sorry! I can only help with the Thesis Archive Management System. If you have questions related to it, feel free to ask.';

    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'history' => 'nullable|array',
            'history.*.role' => 'required|in:user,assistant',
            'history.*.content' => 'required|string',
        ]);

        $conversationText = collect($request->history ?? [])
            ->pluck('content')
            ->push($request->message)
            ->implode(' ');

        if (!$this->isWithinThesisArchiveScope($conversationText)) {
            return response()->json([
                'reply' => self::OUT_OF_SCOPE_REPLY,
            ]);
        }

        $systemPrompt = <<<EOT
You are Archi - Archive Assistant, the intelligent assistant for the TUP Manila Thesis Archive Management System (TAMS).
Only answer questions that are directly related to the Thesis Archive Management System.
You help students, faculty, and administrators with:
- Find and browse thesis records by title, keyword, department, or author
- Understand the thesis submission and approval workflow
- Navigate the system (sign in, upload, review, messaging)
- Answer questions about TUP Manila academic programs and departments
If the user asks anything unrelated to the Thesis Archive Management System, reply exactly:
Sorry! I can only help with the Thesis Archive Management System. If you have questions related to it, feel free to ask.
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

    private function isWithinThesisArchiveScope(string $text): bool
    {
        $normalized = Str::of($text)->lower()->squish()->toString();

        if ($normalized === '') {
            return false;
        }

        $explicitScopePhrases = [
            'thesis archive management system',
            'thesis archive system',
            'tams',
            'archiveai',
            'thesis archive',
        ];

        if ($this->containsAny($normalized, $explicitScopePhrases)) {
            return true;
        }

        $archiveEntities = [
            'manuscript',
            'thesis submission',
            'thesis review',
            'thesis approval',
            'approved thesis',
            'archived thesis',
            'archived theses',
            'recently viewed',
            'support ticket',
            'extension request',
            'faculty',
            'student',
            'vpaa',
            'adviser',
            'advisor',
            'category',
            'department',
            'college',
            'notification',
            'conversation',
            'dashboard',
            'search thesis',
            'browse thesis',
            'thesis record',
        ];

        if ($this->containsAny($normalized, $archiveEntities)) {
            return true;
        }

        $accountSupportTerms = [
            'login',
            'log in',
            'sign in',
            'logout',
            'reset password',
            'forgot password',
            'dashboard',
        ];

        if ($this->containsAny($normalized, $accountSupportTerms)) {
            return true;
        }

        $workflowTerms = [
            'upload',
            'submit',
            'review',
            'approve',
            'reject',
            'archive',
            'search',
            'browse',
            'message',
            'notification',
        ];

        $thesisContextTerms = [
            'thesis',
            'theses',
            'manuscript',
            'submission',
            'approved thesis',
            'archived thesis',
            'archived theses',
            'faculty',
            'student',
            'vpaa',
            'adviser',
            'advisor',
            'category',
            'department',
            'college',
            'support ticket',
            'extension request',
            'conversation',
            'notification',
        ];

        return $this->containsAny($normalized, $workflowTerms)
            && $this->containsAny($normalized, $thesisContextTerms);
    }

    private function containsAny(string $text, array $needles): bool
    {
        foreach ($needles as $needle) {
            if ($needle !== '' && Str::contains($text, $needle)) {
                return true;
            }
        }

        return false;
    }
}
