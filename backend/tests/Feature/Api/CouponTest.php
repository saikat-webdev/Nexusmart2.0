<?php

namespace Tests\Feature\Api;

use App\Models\Coupon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CouponTest extends TestCase
{
    use RefreshDatabase;

    public function test_validate_coupon_returns_discount(): void
    {
        Coupon::create([
            'code' => 'SAVE10',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'min_order_amount' => 0,
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/coupons/validate', [
            'code' => 'save10',
            'order_amount' => 200,
        ]);

        $response
            ->assertOk()
            ->assertJson([
                'valid' => true,
                'discount' => 20.0,
            ]);
    }

    public function test_validate_coupon_fails_for_missing_coupon(): void
    {
        $this->postJson('/api/coupons/validate', [
            'code' => 'NOTFOUND',
            'order_amount' => 100,
        ])->assertStatus(404);
    }
}

