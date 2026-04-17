<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@nexusmart.com',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        // Cashier user
        User::create([
            'name' => 'Cashier One',
            'email' => 'cashier@nexusmart.com',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        // Manager user
        User::create([
            'name' => 'Manager User',
            'email' => 'manager@nexusmart.com',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);
    }
}