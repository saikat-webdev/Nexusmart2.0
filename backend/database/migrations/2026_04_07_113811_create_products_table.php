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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('sku')->unique(); // Assuming SKU is unique
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2)->default(0.00); // Example: $12345678.99
            $table->integer('stock_quantity')->default(0);
            $table->boolean('is_active')->default(true); // To easily enable/disable products
            $table->timestamps(); // created_at and updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};