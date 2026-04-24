<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('faculty_profiles')
            ->where('faculty_role', 'Department Chair')
            ->update(['faculty_role' => 'Dean']);
    }

    public function down(): void
    {
        DB::table('faculty_profiles')
            ->where('faculty_role', 'Dean')
            ->update(['faculty_role' => 'Department Chair']);
    }
};
