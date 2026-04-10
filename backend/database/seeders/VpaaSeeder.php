<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class VpaaSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'vpaa@tup.edu.ph'],
            [
                'name'     => 'VPAA Admin',
                'password' => Hash::make('password'),
                'role'     => 'vpaa',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
