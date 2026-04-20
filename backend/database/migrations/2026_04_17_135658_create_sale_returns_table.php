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
          Schema::create('sale_returns', function (Blueprint $table) {
              $table->id();
              $table->foreignId('sale_id')->constrained('sales')->onDelete('cascade');
              $table->foreignId('sale_item_id')->nullable()->constrained('sale_items')->onDelete('set null');
              $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
              $table->integer('quantity');
              $table->decimal('refund_amount', 10, 2)->nullable();
              $table->string('reason', 500)->nullable();
              $table->enum('status', ['pending', 'completed', 'rejected'])->default('completed');
              $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
              $table->timestamps();
          });
      }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_returns');
    }
};
