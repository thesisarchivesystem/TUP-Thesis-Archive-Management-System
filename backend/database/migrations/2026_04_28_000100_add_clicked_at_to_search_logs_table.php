<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('search_logs', function (Blueprint $table) {
            $table->timestamp('clicked_at')->nullable()->after('results_count');
            $table->index(['thesis_id', 'clicked_at']);
        });
    }

    public function down(): void
    {
        Schema::table('search_logs', function (Blueprint $table) {
            $table->dropIndex(['thesis_id', 'clicked_at']);
            $table->dropColumn('clicked_at');
        });
    }
};
