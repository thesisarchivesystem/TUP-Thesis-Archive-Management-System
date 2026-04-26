<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AiChatbotControllerTest extends TestCase
{
    public function test_it_returns_the_fixed_refusal_message_for_out_of_scope_questions(): void
    {
        config(['services.openrouter.key' => 'test-key']);

        Http::fake();

        $response = $this->postJson('/api/ai/chat', [
            'message' => 'What is the weather in Manila tomorrow?',
        ]);

        $response->assertOk()->assertJson([
            'reply' => 'Sorry! I can only help with the Thesis Archive Management System. If you have questions related to it, feel free to ask.',
        ]);

        Http::assertNothingSent();
    }

    public function test_it_still_calls_openrouter_for_thesis_archive_questions(): void
    {
        config(['services.openrouter.key' => 'test-key']);

        Http::fake([
            '*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Use the thesis search and archive tools in the dashboard.',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/ai/chat', [
            'message' => 'How do I search thesis records by department?',
        ]);

        $response->assertOk()->assertJson([
            'reply' => 'Use the thesis search and archive tools in the dashboard.',
        ]);

        Http::assertSentCount(1);
    }
}
