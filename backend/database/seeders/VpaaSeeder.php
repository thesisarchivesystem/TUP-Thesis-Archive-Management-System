<?php

namespace Database\Seeders;

use App\Models\VpaaProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class VpaaSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'vpaa@tup.edu.ph'],
            [
                'first_name' => 'Dr. Alicia D.',
                'last_name' => 'Navarro',
                'name'     => 'Dr. Alicia D. Navarro',
                'password' => Hash::make('password'),
                'role'     => 'vpaa',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $user->update([
            'first_name' => 'Dr. Alicia D.',
            'last_name' => 'Navarro',
        ]);

        VpaaProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'employee_id' => 'TUPM-VPAA-2009-01',
                'mobile' => '+63 918 552 1101',
                'office' => 'VPAA Office, Admin Building',
                'role_title' => 'Vice President for Academic Affairs',
                'supervised_units' => 'College of Engineering, CS Dept',
                'office_hours' => 'Mon to Fri 8:00 AM - 5:00 PM',
                'signature_title' => 'VPAA - TUP Manila',
            ]
        );

        $this->call(DailyQuoteSeeder::class);
    }
}
