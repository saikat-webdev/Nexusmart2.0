<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Products table indexes
        Schema::table('products', function (Blueprint $table) {
            $table->index('is_active'); // For filtering active products
            $table->index('category_id'); // For category filtering
            $table->index('stock_quantity'); // For low stock queries
            $table->index('reorder_level'); // For low stock comparison
            $table->fullText(['name', 'sku', 'barcode']); // For search optimization
        });

        // Sales table indexes
        Schema::table('sales', function (Blueprint $table) {
            $table->index('sale_datetime'); // For date range queries
            $table->index('customer_id'); // For customer filtering
            $table->index('user_id'); // For user filtering
        });

        // Sale items indexes
        Schema::table('sale_items', function (Blueprint $table) {
            $table->index('sale_id'); // For joining sales
            $table->index('product_id'); // For product lookups
        });

        // Customer indexes
        Schema::table('customers', function (Blueprint $table) {
            $table->index('total_spent'); // For sorting by total spent
            $table->index('email'); // For email lookup
            $table->index('phone'); // For phone lookup
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['is_active']);
            $table->dropIndex(['category_id']);
            $table->dropIndex(['stock_quantity']);
            $table->dropIndex(['reorder_level']);
            $table->dropFullText(['name', 'sku', 'barcode']);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex(['sale_datetime']);
            $table->dropIndex(['customer_id']);
            $table->dropIndex(['user_id']);
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropIndex(['sale_id']);
            $table->dropIndex(['product_id']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex(['total_spent']);
            $table->dropIndex(['email']);
            $table->dropIndex(['phone']);
        });
    }
};
