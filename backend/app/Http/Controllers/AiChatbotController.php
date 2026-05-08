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
    private const PROVIDER_TIMEOUT_SECONDS = 8;
    private const MAX_HISTORY_MESSAGES = 6;
    private const OUT_OF_SCOPE_REPLY = 'I am sorry, but I can only answer questions about the TUP Thesis Archive Management System. I can help with searching, uploading, reviewing, sharing files, categories, accounts, messages, notifications, support tickets, or extension requests.';

    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
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

        $message = trim((string) $validated['message']);
        $context = $validated['context'] ?? [];

        if ($this->isOutOfScopeQuestion($message, $context)) {
            return response()->json([
                'reply' => self::OUT_OF_SCOPE_REPLY,
                'source' => 'scope_guard',
            ]);
        }

        $localReply = $this->buildLocalAssistantReply($message, $context);

        if (($localReply['confidence'] ?? 'fallback') === 'high') {
            return response()->json([
                'reply' => $localReply['reply'],
                'source' => 'local',
            ]);
        }

        $providerReply = $this->buildProviderReply($message, $context, $validated['history'] ?? []);

        if ($providerReply) {
            return response()->json([
                'reply' => $providerReply,
                'source' => 'provider',
            ]);
        }

        return response()->json([
            'reply' => $localReply['reply'],
            'source' => 'local_fallback',
        ]);
    }

    private function buildProviderReply(string $message, array $context, array $history): ?string
    {
        $apiKey = (string) (config('services.openrouter.key') ?: env('OPENROUTER_API_KEY', ''));

        if (!$apiKey) {
            return null;
        }

        $systemPrompt = $this->buildSystemPrompt();
        $systemContext = $this->buildSystemContext($context, $message);
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'system', 'content' => $systemContext],
            ...$this->sanitizeHistory($history),
            ['role' => 'user', 'content' => $message],
        ];
        $baseUrl = rtrim((string) config('services.openrouter.base_url', 'https://openrouter.ai/api/v1'), '/');
        $model = (string) config('services.openrouter.model', self::DEFAULT_FREE_MODEL);
        $siteUrl = (string) config('services.openrouter.site_url', config('app.url'));
        $siteName = (string) config('services.openrouter.site_name', config('app.name', 'TUP Thesis Archive'));
        $timeout = max(2, min(12, (int) config('services.openrouter.timeout', self::PROVIDER_TIMEOUT_SECONDS)));

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'HTTP-Referer'  => $siteUrl,
                'X-Title'       => $siteName,
            ])->connectTimeout(min(5, $timeout))->timeout($timeout)->post($baseUrl . '/chat/completions', [
                'model' => $model,
                'messages' => $messages,
                'temperature' => 0.2,
                'max_tokens' => 350,
            ]);
        } catch (Throwable) {
            return null;
        }

        if ($response->failed()) {
            return null;
        }

        return $this->extractReply($response->json());
    }

    private function sanitizeHistory(array $history): array
    {
        return collect($history)
            ->filter(fn ($entry) => is_array($entry) && in_array($entry['role'] ?? null, ['user', 'assistant'], true))
            ->take(-self::MAX_HISTORY_MESSAGES)
            ->map(fn (array $entry) => [
                'role' => $entry['role'],
                'content' => Str::limit(trim((string) ($entry['content'] ?? '')), 700, ''),
            ])
            ->filter(fn (array $entry) => $entry['content'] !== '')
            ->values()
            ->all();
    }

    private function isOutOfScopeQuestion(string $message, array $context = []): bool
    {
        $text = $this->normalizeText($message);

        if ($this->hasSystemKeyword($text)) {
            return false;
        }

        if ($this->matchesAny($text, [
            'weather',
            'recipe',
            'cook',
            'sports',
            'basketball',
            'football',
            'movie',
            'song',
            'music',
            'crypto',
            'stock',
            'price of',
            'medical',
            'medicine',
            'doctor',
            'legal advice',
            'lawyer',
            'politics',
            'president',
            'news',
            'joke',
            'poem',
            'write code',
            'programming',
        ])) {
            return true;
        }

        if ($this->isGeneralSystemPrompt($text)) {
            return false;
        }

        if ($this->isContextualSystemPrompt($text, $context)) {
            return false;
        }

        return true;
    }

    private function buildLocalAssistantReply(string $message, array $context = []): array
    {
        $text = $this->normalizeText($message);
        $role = $this->normalizeRole(Arr::get($context, 'role'));

        if ($this->isContextualSystemPrompt($text, $context)) {
            return $this->localReply($this->buildPageHelpReply($role, $context), 'high');
        }

        if ($this->isGeneralSystemPrompt($text) || $this->matchesAny($text, ['what is this system', 'about this system', 'what is tams', 'what is thesis archive'])) {
            return $this->localReply($this->buildCapabilityReply($role), 'high');
        }

        if ($this->matchesAny($text, ['login', 'log in', 'sign in', 'logout', 'log out', 'password', 'forgot password', 'reset password', 'account'])) {
            return $this->localReply($this->buildAccountReply($role), 'high');
        }

        if ($this->matchesAny($text, ['category', 'categories'])) {
            return $this->localReply($this->buildCategoryReply($role), 'high');
        }

        if ($this->matchesAny($text, ['search', 'find thesis', 'browse', 'filter', 'recently added', 'top searches', 'all theses'])) {
            return $this->localReply($this->buildSearchReply($role), 'high');
        }

        if ($this->matchesAny($text, ['download', 'view manuscript', 'open manuscript', 'watermark', 'watermarked', 'pdf', 'certificate'])) {
            return $this->localReply($this->buildManuscriptReply($role), 'high');
        }

        if ($this->matchesAny($text, ['review', 'approve', 'reject', 'archive thesis', 'approved thesis', 'in archive'])) {
            return $this->localReply($this->buildReviewReply($role), 'high');
        }

        if ($this->matchesAny($text, ['upload', 'submit', 'submission', 'draft', 'my submissions', 'revise', 'revision', 'make revision'])) {
            return $this->localReply($this->buildSubmissionReply($role), 'high');
        }

        if ($this->matchesAny($text, ['department file', 'shared file', 'file sharing', 'library item', 'library items', 'add department', 'share file', 'resource type'])) {
            return $this->localReply($this->buildDepartmentFileReply($role), 'high');
        }

        if ($this->matchesAny($text, ['extension', 'deadline', 'due date', 'request more time'])) {
            return $this->localReply($this->buildExtensionReply($role), 'high');
        }

        if ($this->matchesAny($text, ['message', 'messages', 'chat', 'notification', 'notifications', 'bell'])) {
            return $this->localReply($this->buildCommunicationReply($role), 'high');
        }

        if ($this->matchesAny($text, ['profile', 'name', 'email', 'personal info'])) {
            return $this->localReply($this->buildProfileReply($role), 'high');
        }

        if ($this->matchesAny($text, ['support', 'ticket', 'problem', 'issue', 'bug', 'error'])) {
            return $this->localReply($this->buildSupportReply($role), 'high');
        }

        if ($this->matchesAny($text, ['vpaa', 'activity log', 'daily quote', 'faculty management', 'export'])) {
            return $this->localReply($this->buildVpaaReply(), 'high');
        }

        return $this->localReply($this->buildCapabilityReply($role), 'fallback');
    }

    private function localReply(string $reply, string $confidence): array
    {
        return [
            'reply' => $reply,
            'confidence' => $confidence,
        ];
    }

    private function buildCapabilityReply(?string $role): string
    {
        $roleLine = match ($role) {
            'student' => 'For students, I can guide uploads, my submissions, adviser-related actions, extension requests, thesis browsing, manuscript access, messages, notifications, profile, and support.',
            'faculty' => 'For faculty, I can guide thesis review, managed thesis records, department file sharing, approved or archived theses, advisees, extension requests, messages, notifications, profile, and support.',
            'vpaa' => 'For VPAA users, I can guide archive browsing, categories, activity logs, advisees, messages, notifications, profile, support, and dashboard tools.',
            default => 'I can guide students, faculty, and VPAA users through the archive workflows.',
        };

        return implode("\n", [
            'Archive Assistant',
            $roleLine,
            'You can ask me about:',
            '- Searching and browsing thesis records',
            '- Uploading or managing thesis submissions',
            '- Reviewing, approving, rejecting, or archiving records',
            '- Sharing department files and library resources',
            '- Categories, messages, notifications, support tickets, and extension requests',
        ]);
    }

    private function buildPageHelpReply(?string $role, array $context): string
    {
        $path = $this->normalizeText((string) Arr::get($context, 'path', ''));

        if (str_contains($path, 'upload-thesis') || str_contains($path, 'my-submissions')) {
            return $this->buildSubmissionReply($role);
        }

        if (str_contains($path, 'manage-thesis/review')) {
            return $this->buildReviewReply($role);
        }

        if (str_contains($path, 'extension-request') || str_contains($path, 'extension-requests')) {
            return $this->buildExtensionReply($role);
        }

        if (str_contains($path, 'students')) {
            return $this->buildDepartmentFileReply($role);
        }

        if (str_contains($path, 'categories')) {
            return $this->buildCategoryReply($role);
        }

        if (str_contains($path, 'search')) {
            return $this->buildSearchReply($role);
        }

        if (str_contains($path, 'messages')) {
            return $this->buildCommunicationReply($role);
        }

        if (str_contains($path, 'profile')) {
            return $this->buildProfileReply($role);
        }

        if (str_contains($path, 'support')) {
            return $this->buildSupportReply($role);
        }

        return $this->buildCapabilityReply($role);
    }

    private function buildAccountReply(?string $role): string
    {
        $profilePath = $this->pathForRole($role, 'profile');

        return implode("\n", [
            'Account Access',
            '- To sign in, choose the correct role from the sign-in page: Student, Faculty, or VPAA.',
            '- If you forgot your password, use Forgot Password on the sign-in screen and follow the reset link sent to your email.',
            $profilePath ? '- To update account details, open Profile: ' . $profilePath . '.' : '- After signing in, open Profile from the user menu to review your account details.',
            '- To sign out, open the profile menu in the top bar and choose Sign Out.',
        ]);
    }

    private function buildSearchReply(?string $role): string
    {
        $searchPath = $this->pathForRole($role, 'search');
        $categoriesPath = $this->pathForRole($role, 'categories');

        return implode("\n", array_filter([
            'Searching Thesis Records',
            $searchPath ? '- Use the top search bar or open Search: ' . $searchPath . '.' : '- Use the top search bar or the Search page.',
            '- Search by title, author, abstract keywords, department, program, school year, or category.',
            '- Use filters when you need narrower results.',
            $categoriesPath ? '- To browse by topic, open Categories: ' . $categoriesPath . '.' : '- To browse by topic, open Categories.',
            '- Open a thesis card to view its details and available manuscript actions.',
        ]));
    }

    private function buildCategoryReply(?string $role): string
    {
        $categoriesPath = $this->pathForRole($role, 'categories');
        $categoryKnowledge = $this->buildCategoryKnowledge();

        return implode("\n", array_filter([
            'Categories',
            $categoriesPath ? '- Open Categories: ' . $categoriesPath . '.' : '- Open the Categories page from the sidebar.',
            '- Pick a category to browse related approved thesis records.',
            '- Category pages help narrow the archive by research area.',
            $categoryKnowledge,
        ]));
    }

    private function buildManuscriptReply(?string $role): string
    {
        $roleNote = match ($role) {
            'student' => '- Students can open thesis details from search, dashboard collections, or My Submissions. When allowed, use View Thesis or Download PDF.',
            'faculty' => '- Faculty can open thesis details, review submissions, approved theses, archived theses, or shared files to inspect available manuscripts.',
            'vpaa' => '- VPAA users can open thesis records from dashboard collections, search results, categories, or thesis detail pages.',
            default => '- Open a thesis detail page to see whether manuscript viewing or download actions are available.',
        };

        return implode("\n", [
            'Manuscript Access',
            $roleNote,
            '- If a PDF opens in a new tab, allow popups for the site.',
            '- Some downloads may be watermarked or restricted depending on role and record status.',
            '- If no file action appears, the record may not have an uploaded manuscript yet.',
        ]);
    }

    private function buildSubmissionReply(?string $role): string
    {
        if ($role === 'faculty') {
            return implode("\n", [
                'Faculty Thesis Management',
                '- To add a managed thesis, open /faculty/manage-thesis/add.',
                '- To continue your own records, open My Submissions: /faculty/my-submissions.',
                '- Fill in the title, authors, abstract, category, college or department details, and manuscript file.',
                '- Save a draft if the record is not ready, or submit it when the metadata and file are complete.',
            ]);
        }

        if ($role === 'vpaa') {
            return implode("\n", [
                'VPAA Thesis Guidance',
                '- VPAA users mainly browse, monitor, and organize archive records.',
                '- Thesis upload and submission workflows are handled by students and faculty accounts.',
                '- Use search, dashboard collections, and categories to inspect archived records.',
            ]);
        }

        return implode("\n", [
            'Uploading a Thesis',
            '- Open Upload Thesis: /student/upload-thesis.',
            '- Complete the title, authors, adviser, abstract, category, school year, and related academic details.',
            '- Attach the manuscript PDF and any required supplementary files.',
            '- Save as draft if it still needs work, or submit when it is ready for faculty review.',
            '- Track the status from My Submissions: /student/my-submissions.',
        ]);
    }

    private function buildReviewReply(?string $role): string
    {
        if ($role !== 'faculty') {
            return implode("\n", [
                'Review Workflow',
                '- Thesis approval and rejection actions are handled by faculty accounts.',
                '- Students can track submission status from My Submissions.',
                '- VPAA users can browse and monitor approved archive records from dashboards, search, and categories.',
            ]);
        }

        return implode("\n", [
            'Reviewing Thesis Submissions',
            '- Open Review Submissions: /faculty/manage-thesis/review.',
            '- Select a pending submission to inspect metadata and manuscript access.',
            '- Approve the record when it is ready for the archive, or reject it with clear revision feedback.',
            '- Extension requests also appear in the review area when students need more time.',
        ]);
    }

    private function buildDepartmentFileReply(?string $role): string
    {
        if ($role !== 'faculty') {
            return implode("\n", [
                'Department Files',
                '- Department file sharing is a faculty workflow.',
                '- Faculty can upload books, dissertations, research files, manuscripts, journals, and other resource types for a department library.',
                '- Students and VPAA users can access shared resources only where the system exposes them through their role.',
            ]);
        }

        return implode("\n", [
            'Department File Sharing',
            '- Open Department File Sharing: /faculty/students.',
            '- Expand Add Department File and complete the file details.',
            '- Choose the Type, including Book, Dissertation, Research File, Manuscript, Journal, or Others.',
            '- If you choose Others, type the specific file type before saving.',
            '- Select categories, sharing scope, file name, notes, and attachment, then Save Draft or Share.',
        ]);
    }

    private function buildExtensionReply(?string $role): string
    {
        if ($role === 'faculty') {
            return implode("\n", [
                'Extension Requests',
                '- Open Review Submissions: /faculty/manage-thesis/review.',
                '- Check the Extension Requests section.',
                '- Open a request to compare the current deadline with the requested deadline.',
                '- Approve or reject the request, then the student will be notified through the system.',
            ]);
        }

        if ($role === 'student') {
            return implode("\n", [
                'Requesting an Extension',
                '- Open My Submissions: /student/my-submissions.',
                '- Choose Extension Request on the thesis that needs more time.',
                '- Enter the requested deadline and a clear reason.',
                '- Submit the request so your assigned faculty adviser can review it.',
            ]);
        }

        return implode("\n", [
            'Extension Requests',
            '- Students submit extension requests from My Submissions.',
            '- Faculty review and decide extension requests from the Review Submissions area.',
            '- The request should include the thesis record, requested deadline, and reason.',
        ]);
    }

    private function buildCommunicationReply(?string $role): string
    {
        $messagesPath = $this->pathForRole($role, 'messages');

        return implode("\n", array_filter([
            'Messages and Notifications',
            $messagesPath ? '- Open Messages from the top bar or sidebar: ' . $messagesPath . '.' : '- Open Messages from the top bar or sidebar.',
            '- Use messages to communicate with users available to your role.',
            '- Use the bell icon to review notifications such as submission updates, shared files, extension requests, and system activity.',
            '- Select a notification to open the related record when a link is available.',
        ]));
    }

    private function buildProfileReply(?string $role): string
    {
        $profilePath = $this->pathForRole($role, 'profile');

        return implode("\n", array_filter([
            'Profile',
            $profilePath ? '- Open Profile: ' . $profilePath . '.' : '- Open Profile from the user menu.',
            '- Review your account name, email, role, and related academic details.',
            '- Save changes only after checking the information carefully.',
            '- If a field is locked, contact support or the appropriate administrator.',
        ]));
    }

    private function buildSupportReply(?string $role): string
    {
        $supportPath = $this->pathForRole($role, 'support');

        return implode("\n", array_filter([
            'Support',
            $supportPath ? '- Open Support: ' . $supportPath . '.' : '- Open Support from the sidebar or footer.',
            '- Describe the issue, what page you were on, and what you expected to happen.',
            '- Include the thesis title or file name when the problem is tied to a specific record.',
            '- Submit the ticket and wait for the support team to review it.',
        ]));
    }

    private function buildVpaaReply(): string
    {
        return implode("\n", [
            'VPAA Tools',
            '- Dashboard: monitor archive activity and thesis collections.',
            '- Categories: manage and browse research categories at /vpaa/categories.',
            '- Activity Log: review recorded system actions at /vpaa/activity-log.',
            '- Messages and notifications: communicate and follow system updates.',
            '- Profile and Support: manage account details or report issues.',
        ]);
    }

    private function normalizeRole(?string $role): ?string
    {
        $role = $this->normalizeText((string) $role);

        return in_array($role, ['student', 'faculty', 'vpaa'], true) ? $role : null;
    }

    private function pathForRole(?string $role, string $page): ?string
    {
        if (!$role) {
            return null;
        }

        $paths = [
            'student' => [
                'search' => '/student/search',
                'categories' => '/student/categories',
                'messages' => '/student/messages',
                'profile' => '/student/profile',
                'support' => '/student/support',
            ],
            'faculty' => [
                'search' => '/faculty/search',
                'categories' => '/faculty/categories',
                'messages' => '/faculty/messages',
                'profile' => '/faculty/profile',
                'support' => '/faculty/support',
            ],
            'vpaa' => [
                'search' => '/vpaa/search',
                'categories' => '/vpaa/categories',
                'messages' => '/vpaa/messages',
                'profile' => '/vpaa/profile',
                'support' => '/vpaa/support',
            ],
        ];

        return $paths[$role][$page] ?? null;
    }

    private function hasSystemKeyword(string $text): bool
    {
        return $this->matchesAny($text, [
            'thesis',
            'archive',
            'tams',
            'tup',
            'archie',
            'student',
            'faculty',
            'vpaa',
            'manuscript',
            'upload',
            'submit',
            'submission',
            'adviser',
            'advisee',
            'category',
            'categories',
            'search',
            'dashboard',
            'profile',
            'notification',
            'message',
            'support',
            'ticket',
            'extension',
            'deadline',
            'review',
            'approve',
            'reject',
            'department file',
            'shared file',
            'file sharing',
            'library item',
            'college',
            'department',
            'account',
            'login',
            'sign in',
            'logout',
            'password',
            'watermark',
            'pdf',
            'download',
            'recently viewed',
            'recently added',
            'top searches',
            'my submissions',
            'activity log',
            'daily quote',
            'faculty management',
            'export',
            'terms',
        ]);
    }

    private function isGeneralSystemPrompt(string $text): bool
    {
        $trimmed = trim($text);

        if (preg_match('/^(hi|hello|hey|good morning|good afternoon|good evening|help|help me|start|guide me)$/i', $trimmed)) {
            return true;
        }

        return $this->matchesAny($trimmed, [
            'what can you do',
            'who are you',
            'your name',
            'how can you help',
            'what do you know',
            'assist me',
            'guide me',
        ]);
    }

    private function isContextualSystemPrompt(string $text, array $context): bool
    {
        if (!Arr::get($context, 'path') && !Arr::get($context, 'page')) {
            return false;
        }

        return $this->matchesAny($text, [
            'this page',
            'current page',
            'this form',
            'this screen',
            'what should i do here',
            'how do i use this',
            'how do i use this page',
            'where am i',
        ]);
    }

    private function matchesAny(string $text, array $needles): bool
    {
        foreach ($needles as $needle) {
            if ($needle !== '' && str_contains($text, $needle)) {
                return true;
            }
        }

        return false;
    }

    private function normalizeText(string $value): string
    {
        return Str::lower(trim(preg_replace('/\s+/', ' ', $value) ?? $value));
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
            'VPAA features: dashboard, profile, categories, activity log, daily quote on the dashboard, advisees, messages, thesis browsing, support, and terms.',
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
