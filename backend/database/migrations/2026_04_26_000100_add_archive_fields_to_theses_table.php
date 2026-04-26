<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('theses', function (Blueprint $table) {
            $table->boolean('is_archived')->default(false)->after('status');
            $table->timestamp('archived_at')->nullable()->after('approved_at');
        });

        DB::table('theses')
            ->where('status', 'approved')
            ->update([
                'is_archived' => true,
                'archived_at' => DB::raw('COALESCE(approved_at, NOW())'),
            ]);
    }

    public function down(): void
    {
        Schema::table('theses', function (Blueprint $table) {
            $table->dropColumn(['is_archived', 'archived_at']);
        });
    }
};
