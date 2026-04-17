<?php

namespace Tests\Feature\Api;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_list_update_and_delete_product(): void
    {
        $create = $this->postJson('/api/products', [
            'name' => 'Coke',
            'sku' => 'SKU-COKE-001',
            'price' => 25.50,
            'stock_quantity' => 100,
            'description' => 'Soft drink',
            'is_active' => true,
        ]);

        $create
            ->assertStatus(201)
            ->assertJsonStructure(['data' => ['id', 'name', 'sku']]);

        $productId = $create->json('data.id');
        $this->assertNotNull($productId);

        $listResponse = $this->getJson('/api/products')->assertOk();
        $listPayload = $listResponse->json();
        $this->assertIsArray($listPayload);
        $this->assertNotEmpty($listPayload);
        $this->assertArrayHasKey('id', $listPayload[0]);
        $this->assertArrayHasKey('name', $listPayload[0]);
        $this->assertArrayHasKey('sku', $listPayload[0]);

        $searchResponse = $this->getJson('/api/products?search=Coke')->assertOk();
        $searchPayload = $searchResponse->json();
        $this->assertIsArray($searchPayload);
        $this->assertNotEmpty($searchPayload);

        $this->putJson("/api/products/{$productId}", [
            'price' => 30.00,
        ])->assertOk();

        $this->assertDatabaseHas('products', ['id' => $productId, 'price' => 30.00]);

        $this->deleteJson("/api/products/{$productId}")
            ->assertStatus(204);

        $this->assertDatabaseMissing('products', ['id' => $productId]);
    }

    public function test_cannot_delete_product_with_sales_history(): void
    {
        $product = Product::create([
            'name' => 'Bread',
            'sku' => 'SKU-BREAD-001',
            'price' => 40.00,
            'stock_quantity' => 10,
            'reorder_level' => 2,
            'is_active' => true,
        ]);

        $sale = \App\Models\Sale::create([
            'invoice_number' => \App\Models\Sale::generateInvoiceNumber(),
            'customer_name' => 'Walk-in',
            'user_id' => null,
            'sale_datetime' => now(),
            'subtotal' => 40,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total_amount' => 40,
        ]);

        $sale->saleItems()->create([
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 40,
            'line_item_total' => 40,
            'line_item_tax' => 0,
            'line_item_discount' => 0,
        ]);

        $this->deleteJson("/api/products/{$product->id}")
            ->assertStatus(409);
    }
}
