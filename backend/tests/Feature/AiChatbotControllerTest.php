<?php

namespace Tests\Feature;

use App\Http\Controllers\AiChatbotController;
use Mockery;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AiChatbotControllerTest extends TestCase
{
    public function test_it_uses_the_free_router_and_includes_system_context_for_archive_related_questions(): void
    {
        config(['services.openrouter.key' => 'test-key']);

        Http::fake([
            '*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Open the Review Submissions page in the Faculty section to approve or reject thesis submissions.',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/ai/chat', [
            'message' => 'How do I review thesis submissions in the system?',
            'context' => [
                'role' => 'faculty',
                'page' => 'Faculty layout',
                'path' => '/faculty/dashboard',
            ],
        ]);

        $response->assertOk()->assertJson([
            'reply' => 'Open the Review Submissions page in the Faculty section to approve or reject thesis submissions.',
        ]);

        Http::assertSentCount(1);

        $recorded = Http::recorded();
        $this->assertCount(1, $recorded);

        [$request] = $recorded[0];
        $payload = json_decode($request->body(), true) ?: [];

        $this->assertSame(config('services.openrouter.model', 'openrouter/free'), $payload['model'] ?? null);

        $systemMessages = collect($payload['messages'] ?? [])
            ->where('role', 'system')
            ->pluck('content')
            ->implode("\n");

        $this->assertStringContainsString('Faculty features:', $systemMessages);
        $this->assertStringContainsString('Current UI context: role=faculty', $systemMessages);
        $this->assertStringContainsString('/faculty/dashboard', $systemMessages);
        $this->assertStringContainsString('Browse by Category section:', $systemMessages);
        $this->assertStringContainsString('Respond in a clear, concise, and structured format.', $systemMessages);
        $this->assertStringContainsString('Only answer questions related to searching theses, uploading theses, managing thesis records, user access, categories, and system features within the Thesis Archive System.', $systemMessages);
        $this->assertStringContainsString('Title/Topic', $systemMessages);
    }

    public function test_it_still_allows_natural_apologies_for_unrelated_questions_via_the_model(): void
    {
        config(['services.openrouter.key' => 'test-key']);

        Http::fake([
            '*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Sorry, this chatbot is designed only for the Thesis Archive Management System. I can help you with tasks like searching, uploading, or managing theses.',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/ai/chat', [
            'message' => 'What is the weather in Manila tomorrow?',
        ]);

        $response->assertOk()->assertJson([
            'reply' => 'Sorry, this chatbot is designed only for the Thesis Archive Management System. I can help you with tasks like searching, uploading, or managing theses.',
        ]);

        Http::assertSentCount(1);
    }

    public function test_it_still_calls_the_ai_provider_when_category_context_lookup_fails(): void
    {
        config(['services.openrouter.key' => 'test-key']);

        Http::fake([
            '*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'You can browse the available categories from the archive page.',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $mock = Mockery::mock(AiChatbotController::class)->makePartial()->shouldAllowMockingProtectedMethods();
        $mock->shouldReceive('resolveArchiveCategories')->andThrow(new \RuntimeException('Category lookup failed.'));
        $this->app->instance(AiChatbotController::class, $mock);

        $response = $this->postJson('/api/ai/chat', [
            'message' => 'Show me the thesis categories.',
        ]);

        $response->assertOk()->assertJson([
            'reply' => 'You can browse the available categories from the archive page.',
        ]);

        Http::assertSentCount(1);
    }
}
