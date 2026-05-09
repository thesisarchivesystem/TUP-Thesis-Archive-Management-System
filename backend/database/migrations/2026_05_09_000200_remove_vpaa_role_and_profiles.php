<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            DB::table('users')
                ->where('role', 'vpaa')
                ->update([
                    'role' => 'admin',
                    'updated_at' => now(),
                ]);

            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('faculty', 'student', 'admin'))");
        }

        Schema::dropIfExists('vpaa_profiles');
    }

    public function down(): void
    {
        if (Schema::hasTable('users')) {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('vpaa', 'faculty', 'student', 'admin'))");
        }
    }
};
