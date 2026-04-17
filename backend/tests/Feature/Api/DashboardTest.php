<?php

namespace Tests\Feature\Api;

use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_stats_requires_authentication(): void
    {
        $this->getJson('/api/dashboard/stats')->assertStatus(401);
    }

    public function test_dashboard_stats_returns_expected_shape(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $product = Product::create([
            'name' => 'Milk',
            'sku' => 'SKU-MILK-001',
            'price' => 50.00,
            'stock_quantity' => 10,
            'reorder_level' => 5,
            'is_active' => true,
        ]);

        $sale = Sale::create([
            'invoice_number' => Sale::generateInvoiceNumber(),
            'customer_name' => 'Walk-in',
            'user_id' => $user->id,
            'sale_datetime' => now(),
            'subtotal' => 100,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total_amount' => 100,
        ]);

        $sale->saleItems()->create([
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 50,
            'line_item_total' => 100,
            'line_item_tax' => 0,
            'line_item_discount' => 0,
        ]);

        $this->getJson('/api/dashboard/stats')
            ->assertOk()
            ->assertJsonStructure([
                'today' => ['sales', 'count'],
                'month' => ['sales', 'count'],
                'totals' => ['products', 'customers', 'low_stock_products'],
                'recent_sales',
                'top_products',
                'sales_trend',
            ]);
    }
}

