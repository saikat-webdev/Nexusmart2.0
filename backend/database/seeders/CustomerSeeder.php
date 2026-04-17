<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Customer;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customers = [
            ['name' => 'Walk-in Customer', 'email' => null, 'phone' => null],
            ['name' => 'Rahul Sharma', 'email' => 'rahul@example.com', 'phone' => '+91 9876543210'],
            ['name' => 'Priya Patel', 'email' => 'priya@example.com', 'phone' => '+91 9876543211'],
            ['name' => 'Amit Kumar', 'email' => 'amit@example.com', 'phone' => '+91 9876543212'],
            ['name' => 'Sneha Singh', 'email' => 'sneha@example.com', 'phone' => '+91 9876543213'],
        ];

        foreach ($customers as $customer) {
            Customer::create($customer);
        }
    }
}