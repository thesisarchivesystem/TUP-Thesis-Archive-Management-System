<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shared_files', function (Blueprint $table) {
            $table->json('category_ids')->nullable()->after('category_id');
        });
    }

    public function down(): void
    {
        Schema::table('shared_files', function (Blueprint $table) {
            $table->dropColumn('category_ids');
        });
    }
};
