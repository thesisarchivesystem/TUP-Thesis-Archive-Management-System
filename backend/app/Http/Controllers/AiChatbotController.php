<?php
// backend/app/Http/Controllers/AiChatbotController.php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Thesis;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Throwable;

class AiChatbotController extends Controller
{
    private const DEFAULT_FREE_MODEL = 'openrouter/free';

    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'history' => 'nullable|array',
            'history.*.role' => 'required|in:user,assistant',
            'history.*.content' => 'required|string',
            'context' => 'nullable|array',
            'context.role' => 'nullable|string|max:100',
            'context.page' => 'nullable|string|max:255',
            'context.path' => 'nullable|string|max:255',
            'context.section' => 'nullable|string|max:255',
        ]);

        $context = $request->input('context', []);
        $systemPrompt = $this->buildSystemPrompt();
        $systemContext = $this->buildSystemContext($context, $request->message);

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'system', 'content' => $systemContext],
            ...($request->history ?? []),
            ['role' => 'user', 'content' => $request->message],
        ];

        $apiKey = (string) (config('services.openrouter.key') ?: env('OPENROUTER_API_KEY', ''));
        $baseUrl = rtrim((string) config('services.openrouter.base_url', 'https://openrouter.ai/api/v1'), '/');
        $model = (string) config('services.openrouter.model', self::DEFAULT_FREE_MODEL);
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
            'reply' => $this->extractReply($response->json()) ?: 'No reply was returned by the AI provider.',
        ]);
    }

    private function buildSystemPrompt(): string
    {
        return trim(<<<EOT
You are Archie - Archive Assistant, the intelligent assistant for the TUP Manila Thesis Archive Management System.
Your job is to answer questions about the whole system accurately, using only the system facts provided to you.
Only answer questions related to searching theses, uploading theses, managing thesis records, user access, categories, and system features within the Thesis Archive System.
Respond in a clear, concise, and structured format.
Use bullet points or numbered steps when explaining processes.
Keep answers short but helpful.
Maintain a friendly and professional tone.
Only provide detailed explanations when necessary.
Avoid markdown heading markers like ### and avoid divider lines like ---.
Use plain text headings instead of markdown symbols.
When applicable, follow this structure:
Title/Topic
Short explanation (1-2 sentences)
Steps or key details (bulleted or numbered)
Optional note or reminder
If the user asks about something outside the system, refuse politely using this format:
Sorry, this chatbot is designed only for the Thesis Archive Management System.
I can help you with tasks like searching, uploading, or managing theses.
If the question is close to the system, answer it helpfully instead of refusing too early.
Never invent screens, routes, or features that are not supported by the facts below.
When you need to provide a list, format it as bullet points.
If the user encounters an issue, clearly explain the problem and suggest simple steps to fix it.
Keep responses concise, friendly, and academically professional.
EOT);
    }

    private function buildSystemContext(array $context = [], string $message = ''): string
    {
        $role = Arr::get($context, 'role');
        $page = Arr::get($context, 'page');
        $path = Arr::get($context, 'path');
        $section = Arr::get($context, 'section');

        $facts = [
            'Application: TUP Thesis Archive Management System.',
            'Frontend: React 18, TypeScript, Vite.',
            'Backend: Laravel 11 REST API with Sanctum authentication.',
            'Realtime: Ably for notifications, typing indicators, presence, and chat updates.',
            'Storage: Supabase PostgreSQL for data and Supabase Storage for thesis files.',
            'Chatbot name: Archie - Archive Assistant.',
            'Roles: student, faculty, and vpaa.',
            'Shared features: login, logout, password reset, search, thesis details, manuscript access, notifications, messages, support tickets, and extension requests.',
            'Student features: dashboard, profile, advisers, my submissions, recently viewed, archive browsing, and thesis search.',
            'Faculty features: dashboard, profile, activity log, advisees, library items, my theses, thesis submission review, approved theses, and extension request handling.',
            'VPAA features: dashboard, profile, categories, activity log, daily quote, faculty management, and export tools.',
            $this->buildCategoryKnowledge(),
            $this->buildRelevantThesisKnowledge($message, $context),
            'If the user asks how to use the system, explain the exact workflow based on these facts.',
        ];

        if ($role || $page || $path || $section) {
            $facts[] = 'Current UI context: ' . collect([
                $role ? 'role=' . $role : null,
                $page ? 'page=' . $page : null,
                $section ? 'section=' . $section : null,
                $path ? 'path=' . $path : null,
            ])->filter()->implode(', ');
        }

        return implode("\n", $facts);
    }

    private function buildCategoryKnowledge(): string
    {
        try {
            $categories = $this->resolveArchiveCategories();
        } catch (Throwable) {
            return 'Browse by Category section: Web & Mobile Development, Artificial Intelligence & ML, Cybersecurity & Networking, IoT & Embedded Systems, Data Science & Analytics, Human-Computer Interaction, Game Development, and Automation & Robotics.';
        }

        if ($categories->isEmpty()) {
            return 'Browse by Category section: Web & Mobile Development, Artificial Intelligence & ML, Cybersecurity & Networking, IoT & Embedded Systems, Data Science & Analytics, Human-Computer Interaction, Game Development, and Automation & Robotics.';
        }

        return 'Browse by Category section: ' . $categories->map(function (array $category) {
            return $category['name'] . ($category['description'] ? ' - ' . $category['description'] : '');
        })->implode(', ') . '.';
    }

    private function buildRelevantThesisKnowledge(string $message, array $context = []): string
    {
        try {
            $theses = $this->resolveRelevantTheses($message, $context);
        } catch (Throwable) {
            return 'Relevant thesis records: no specific thesis records matched the current question.';
        }

        if ($theses->isEmpty()) {
            return 'Relevant thesis records: no specific thesis records matched the current question.';
        }

        $lines = $theses->map(function (array $thesis) {
            $parts = array_filter([
                $thesis['title'] ?? null,
                isset($thesis['authors']) && $thesis['authors'] !== [] ? 'Authors: ' . implode(', ', $thesis['authors']) : null,
                $thesis['department'] ? 'Department: ' . $thesis['department'] : null,
                $thesis['program'] ? 'Program: ' . $thesis['program'] : null,
                $thesis['school_year'] ? 'School year: ' . $thesis['school_year'] : null,
                $thesis['category'] ? 'Category: ' . $thesis['category'] : null,
            ]);

            return '- ' . implode(' | ', $parts);
        });

        return "Relevant thesis records:\n" . $lines->implode("\n");
    }

    protected function resolveArchiveCategories(): Collection
    {
        if (!Schema::hasTable('categories')) {
            return collect();
        }

        return Category::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['name', 'description'])
            ->filter(fn (Category $category) => $this->isActiveCategory($category))
            ->map(fn (Category $category) => [
                'name' => $category->name,
                'description' => $category->description ? trim((string) $category->description) : null,
            ]);
    }

    protected function resolveRelevantTheses(string $message, array $context = []): Collection
    {
        if (!Schema::hasTable('theses')) {
            return collect();
        }

        $queryText = trim(collect([
            $message,
            Arr::get($context, 'page', ''),
            Arr::get($context, 'section', ''),
        ])->filter()->implode(' '));

        $searchTerms = collect(preg_split('/[^\pL\pN]+/u', Str::lower($queryText)) ?: [])
            ->map(fn (string $term) => trim($term))
            ->filter(fn (string $term) => mb_strlen($term) >= 3)
            ->unique()
            ->take(8)
            ->values();

        $query = Thesis::query()
            ->where('status', 'approved')
            ->with(['category:id,name'])
            ->orderByDesc('approved_at')
            ->orderByDesc('created_at');

        if ($searchTerms->isNotEmpty()) {
            $hasKeywordsColumn = Schema::hasColumn('theses', 'keywords');

            $query->where(function ($builder) use ($searchTerms, $hasKeywordsColumn) {
                // The searchable thesis columns vary by deployment, so only use fields that are known to exist.
                foreach ($searchTerms as $term) {
                    $like = '%' . $term . '%';
                    $builder->orWhereRaw('LOWER(title) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(COALESCE(abstract, \'\')) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(COALESCE(department, \'\')) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(COALESCE(program, \'\')) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(COALESCE(CAST(authors AS TEXT), \'\')) LIKE ?', [$like]);

                    if ($hasKeywordsColumn) {
                        $builder->orWhereRaw('LOWER(COALESCE(CAST(keywords AS TEXT), \'\')) LIKE ?', [$like]);
                    }
                }
            });
        }

        return $query->limit(5)
            ->get(['id', 'title', 'abstract', 'authors', 'department', 'program', 'school_year', 'category_id', 'approved_at'])
            ->map(function (Thesis $thesis) {
                return [
                    'title' => $thesis->title,
                    'authors' => collect($thesis->authors ?? [])->filter()->values()->all(),
                    'department' => $thesis->department,
                    'program' => $thesis->program,
                    'school_year' => $thesis->school_year,
                    'category' => $thesis->category?->name,
                ];
            });
    }

    private function isActiveCategory(Category $category): bool
    {
        $value = $category->getAttribute('is_active');

        if (is_bool($value)) {
            return $value;
        }

        if ($value === null) {
            return true;
        }

        return in_array(Str::lower(trim((string) $value)), ['1', 'true', 't', 'yes'], true);
    }

    private function extractReply(array $payload): ?string
    {
        $content = data_get($payload, 'choices.0.message.content');

        if (is_string($content)) {
            return trim($content);
        }

        if (!is_array($content)) {
            return null;
        }

        return collect($content)
            ->map(function ($part) {
                if (is_string($part)) {
                    return $part;
                }

                if (is_array($part) && ($part['type'] ?? null) === 'text') {
                    return $part['text'] ?? null;
                }

                return null;
            })
            ->filter(fn ($part) => is_string($part) && trim($part) !== '')
            ->implode("\n");
    }
}
