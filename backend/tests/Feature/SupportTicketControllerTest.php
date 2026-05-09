<?php

namespace Tests\Feature;

use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupportTicketControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_admin_can_submit_a_support_ticket(): void
    {
        $user = User::create([
            'first_name' => 'System',
            'last_name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/support-tickets', [
            'full_name' => 'System Admin',
            'email' => 'admin@example.com',
            'category' => 'General Inquiry',
            'message' => 'I need help reviewing a thesis archive record from the admin dashboard.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'Support ticket submitted successfully.')
            ->assertJsonPath('data.requester_role', 'admin')
            ->assertJsonPath('data.category', 'General Inquiry');

        $this->assertDatabaseHas('support_tickets', [
            'user_id' => $user->id,
            'requester_role' => 'admin',
            'full_name' => 'System Admin',
            'email' => 'admin@example.com',
            'category' => 'General Inquiry',
            'status' => 'open',
        ]);

        $ticket = SupportTicket::first();

        $this->assertNotNull($ticket);
        $this->assertSame('I need help reviewing a thesis archive record from the admin dashboard.', $ticket->message);

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $user->id,
            'action' => 'support.ticket_created',
            'subject_type' => 'support_ticket',
            'subject_id' => $ticket?->id,
        ]);
    }
}
