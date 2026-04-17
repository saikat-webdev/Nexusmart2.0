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
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique(); // Unique identifier for the invoice
            // If you have customer tracking, you'd add a foreignId('customer_id')->nullable();
            // For now, we'll keep it simple, maybe a nullable customer name field.
            $table->string('customer_name')->nullable();
            $table->decimal('total_amount', 10, 2)->default(0.00); // Total of the sale
            $table->decimal('tax_amount', 10, 2)->default(0.00);  // Total tax applied
            $table->decimal('discount_amount', 10, 2)->default(0.00); // Total discount applied
            $table->decimal('subtotal', 10, 2)->default(0.00); // Price before tax and discount
            $table->timestamp('sale_datetime'); // When the sale occurred
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null'); // Who made the sale
            $table->timestamps(); // created_at and updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};