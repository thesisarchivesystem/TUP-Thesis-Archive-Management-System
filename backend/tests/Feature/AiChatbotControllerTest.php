<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AiChatbotControllerTest extends TestCase
{
    public function test_it_returns_a_fixed_apology_for_out_of_scope_questions_without_calling_the_provider(): void
    {
        config(['services.openrouter.key' => 'test-key']);

        Http::fake();

        $response = $this->postJson('/api/ai/chat', [
            'message' => 'What is the weather in Manila tomorrow?',
        ]);

        $response->assertOk()
            ->assertJsonPath('source', 'scope_guard')
            ->assertJsonPath(
                'reply',
                'I am sorry, but I can only answer questions about the TUP Thesis Archive Management System. I can help with searching, uploading, reviewing, sharing files, categories, accounts, messages, notifications, support tickets, or extension requests.'
            );

        Http::assertNothingSent();
    }

    public function test_it_answers_common_archive_workflows_locally(): void
    {
        config(['services.openrouter.key' => 'test-key']);

        Http::fake();

        $response = $this->postJson('/api/ai/chat', [
            'message' => 'How do I review thesis submissions in the system?',
            'context' => [
                'role' => 'faculty',
                'page' => 'Faculty layout',
                'path' => '/faculty/dashboard',
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('source', 'local');

        $this->assertStringContainsString('Reviewing Thesis Submissions', $response->json('reply'));
        $this->assertStringContainsString('/faculty/manage-thesis/review', $response->json('reply'));

        Http::assertNothingSent();
    }

    public function test_it_still_works_without_an_ai_provider_key(): void
    {
        config(['services.openrouter.key' => null]);

        $response = $this->postJson('/api/ai/chat', [
            'message' => 'How can I upload my thesis?',
            'context' => [
                'role' => 'student',
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('source', 'local');

        $this->assertStringContainsString('/student/upload-thesis', $response->json('reply'));
    }

    public function test_role_context_alone_does_not_allow_unrelated_questions(): void
    {
        config(['services.openrouter.key' => 'test-key']);

        Http::fake();

        $response = $this->postJson('/api/ai/chat', [
            'message' => 'What is 2 plus 2?',
            'context' => [
                'role' => 'faculty',
                'path' => '/faculty/dashboard',
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('source', 'scope_guard');

        Http::assertNothingSent();
    }

    public function test_contextual_page_questions_use_the_current_page(): void
    {
        Http::fake();

        $response = $this->postJson('/api/ai/chat', [
            'message' => 'What should I do here?',
            'context' => [
                'role' => 'faculty',
                'path' => '/faculty/students',
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('source', 'local');

        $this->assertStringContainsString('Department File Sharing', $response->json('reply'));
        $this->assertStringContainsString('/faculty/students', $response->json('reply'));

        Http::assertNothingSent();
    }

    public function test_it_uses_the_provider_only_for_unusual_in_scope_questions_and_keeps_the_timeout_short(): void
    {
        config([
            'services.openrouter.key' => 'test-key',
            'services.openrouter.timeout' => 8,
        ]);

        Http::fake([
            '*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Use the archive workflow notes from your department and keep the record metadata complete.',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/ai/chat', [
            'message' => 'How should the archive workflow be handled for a special case?',
            'context' => [
                'role' => 'faculty',
                'path' => '/faculty/dashboard',
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('source', 'provider')
            ->assertJsonPath('reply', 'Use the archive workflow notes from your department and keep the record metadata complete.');

        Http::assertSentCount(1);

        [$request] = Http::recorded()[0];
        $payload = json_decode($request->body(), true) ?: [];

        $this->assertSame(config('services.openrouter.model', 'openrouter/free'), $payload['model'] ?? null);
        $this->assertSame(350, $payload['max_tokens'] ?? null);

        $systemMessages = collect($payload['messages'] ?? [])
            ->where('role', 'system')
            ->pluck('content')
            ->implode("\n");

        $this->assertStringContainsString('Only answer questions related to searching theses', $systemMessages);
        $this->assertStringContainsString('Current UI context: role=faculty', $systemMessages);
    }
}
