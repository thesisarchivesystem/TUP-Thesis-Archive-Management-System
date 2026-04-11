<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->nullable()->after('id');
            $table->string('last_name')->nullable()->after('first_name');
        });

        DB::table('users')->select(['id', 'name'])->orderBy('created_at')->chunkById(100, function ($users) {
            foreach ($users as $user) {
                $name = trim((string) $user->name);
                if ($name === '') {
                    continue;
                }

                $parts = preg_split('/\s+/', $name) ?: [];
                $firstName = array_shift($parts) ?: $name;
                $lastName = count($parts) ? implode(' ', $parts) : $firstName;

                DB::table('users')
                    ->where('id', $user->id)
                    ->update([
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                    ]);
            }
        }, 'id');
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'last_name']);
        });
    }
};
