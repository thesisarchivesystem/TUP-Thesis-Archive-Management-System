<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vpaa_profiles', function (Blueprint $table) {
            $table->dropColumn('term_start');
        });
    }

    public function down(): void
    {
        Schema::table('vpaa_profiles', function (Blueprint $table) {
            $table->date('term_start')->nullable()->after('role_title');
        });
    }
};
