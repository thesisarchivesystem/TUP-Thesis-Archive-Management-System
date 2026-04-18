<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('theses', function (Blueprint $table) {
            $table->text('cover_file_url')->nullable()->after('file_size');
            $table->string('cover_file_name')->nullable()->after('cover_file_url');
            $table->json('supplementary_files')->nullable()->after('cover_file_name');
        });
    }

    public function down(): void
    {
        Schema::table('theses', function (Blueprint $table) {
            $table->dropColumn(['cover_file_url', 'cover_file_name', 'supplementary_files']);
        });
    }
};
