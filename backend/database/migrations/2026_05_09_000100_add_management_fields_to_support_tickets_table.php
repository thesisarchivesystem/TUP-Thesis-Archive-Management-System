<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->string('subject')->nullable()->after('email');
            $table->string('priority', 32)->default('medium')->after('message');
            $table->uuid('assigned_to')->nullable()->after('status');
            $table->timestamp('resolved_at')->nullable()->after('assigned_to');

            $table->foreign('assigned_to')->references('id')->on('users')->nullOnDelete();
            $table->index(['status', 'priority', 'updated_at'], 'support_tickets_status_priority_updated_idx');
        });
    }

    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropIndex('support_tickets_status_priority_updated_idx');
            $table->dropForeign(['assigned_to']);
            $table->dropColumn(['subject', 'priority', 'assigned_to', 'resolved_at']);
        });
    }
};
