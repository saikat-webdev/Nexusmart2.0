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
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->onDelete('cascade'); // Link to the sale
            $table->foreignId('product_id')->constrained()->onDelete('restrict'); // Link to the product
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2); // Price of one unit at the time of sale
            $table->decimal('line_item_total', 10, 2); // quantity * unit_price
            $table->decimal('line_item_tax', 10, 2)->default(0.00); // Tax for this specific item line
            $table->decimal('line_item_discount', 10, 2)->default(0.00); // Discount for this specific item line
            // could add fields for specific product attributes at time of sale if they change
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};