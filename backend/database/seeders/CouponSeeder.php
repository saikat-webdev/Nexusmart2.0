<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Coupon;

class CouponSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Coupon::create([
            'code' => 'SAVE10',
            'description' => '10% off all items',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'usage_limit' => null,
            'valid_from' => now(),
            'valid_until' => now()->addMonths(3),
            'min_order_amount' => 0,
            'is_active' => true,
        ]);

        Coupon::create([
            'code' => 'FLAT500',
            'description' => '₦500 off orders above ₦5,000',
            'discount_type' => 'fixed',
            'discount_value' => 500,
            'usage_limit' => 100,
            'valid_from' => now(),
            'valid_until' => now()->addMonths(6),
            'min_order_amount' => 5000,
            'is_active' => true,
        ]);

        Coupon::create([
            'code' => 'WELCOME20',
            'description' => '20% off first order',
            'discount_type' => 'percentage',
            'discount_value' => 20,
            'usage_limit' => 500,
            'valid_from' => now(),
            'valid_until' => now()->addMonths(12),
            'min_order_amount' => 2000,
            'is_active' => true,
        ]);

        Coupon::create([
            'code' => 'BULK1000',
            'description' => '₦1,000 off orders above ₦10,000',
            'discount_type' => 'fixed',
            'discount_value' => 1000,
            'usage_limit' => null,
            'valid_from' => now(),
            'valid_until' => now()->addMonths(12),
            'min_order_amount' => 10000,
            'is_active' => true,
        ]);

        Coupon::create([
            'code' => 'SUMMER15',
            'description' => '15% off summer sale',
            'discount_type' => 'percentage',
            'discount_value' => 15,
            'usage_limit' => 200,
            'valid_from' => now(),
            'valid_until' => now()->addDays(30),
            'min_order_amount' => 0,
            'is_active' => true,
        ]);
    }
}
