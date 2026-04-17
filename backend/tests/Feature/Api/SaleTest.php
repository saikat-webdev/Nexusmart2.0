<?php

namespace Tests\Feature\Api;

use App\Models\Coupon;
use App\Models\Product;
use App\Models\SaleItem;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_sale_and_decrements_stock(): void
    {
        $user = User::factory()->create();

        $product = Product::create([
            'name' => 'Soap',
            'sku' => 'SKU-SOAP-001',
            'price' => 30.00,
            'stock_quantity' => 10,
            'reorder_level' => 2,
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/sales', [
            'customer_name' => 'Walk-in',
            'user_id' => $user->id,
            'products' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ]);

        $response
            ->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'invoice_number',
                    'total_amount',
                    'sale_items',
                ],
            ]);

        $this->assertDatabaseCount('sales', 1);
        $this->assertDatabaseCount('sale_items', 1);
        $this->assertDatabaseHas('sale_items', [
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $product->refresh();
        $this->assertSame(8, $product->stock_quantity);
    }

    public function test_sale_fails_when_stock_is_insufficient(): void
    {
        $user = User::factory()->create();

        $product = Product::create([
            'name' => 'Rice',
            'sku' => 'SKU-RICE-001',
            'price' => 100.00,
            'stock_quantity' => 1,
            'reorder_level' => 1,
            'is_active' => true,
        ]);

        $this->postJson('/api/sales', [
            'customer_name' => 'Walk-in',
            'user_id' => $user->id,
            'products' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ])->assertStatus(422);

        $this->assertDatabaseCount('sales', 0);
        $this->assertDatabaseCount('sale_items', 0);
    }

    public function test_can_create_sale_with_coupon_and_records_usage(): void
    {
        $user = User::factory()->create();

        Setting::create([
            'key' => 'tax_rate',
            'value' => '10',
            'type' => 'number',
            'label' => 'Tax Rate',
        ]);

        $product = Product::create([
            'name' => 'Juice',
            'sku' => 'SKU-JUICE-001',
            'price' => 100.00,
            'stock_quantity' => 10,
            'reorder_level' => 2,
            'is_active' => true,
        ]);

        $coupon = Coupon::create([
            'code' => 'SAVE10',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'min_order_amount' => 0,
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/sales', [
            'customer_name' => 'Walk-in',
            'user_id' => $user->id,
            'coupon_code' => 'save10',
            'discount_amount' => 10,
            'products' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
        ]);

        $response
            ->assertStatus(201)
            ->assertJsonPath('data.coupon_code', 'SAVE10')
            ->assertJsonPath('data.discount_amount', 10.0)
            ->assertJsonPath('data.tax_amount', 9.0)
            ->assertJsonPath('data.total_amount', 99.0);

        $coupon->refresh();
        $this->assertSame(1, $coupon->usage_count);
    }

    public function test_sale_rejects_discount_without_valid_coupon(): void
    {
        $user = User::factory()->create();

        $product = Product::create([
            'name' => 'Tea',
            'sku' => 'SKU-TEA-001',
            'price' => 50.00,
            'stock_quantity' => 10,
            'reorder_level' => 2,
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/sales', [
            'customer_name' => 'Walk-in',
            'user_id' => $user->id,
            'discount_amount' => 15,
            'products' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonPath('error', 'A discount amount cannot be applied without a valid coupon code.');

        $this->assertDatabaseCount('sales', 0);
    }
}
