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
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('contact_person', 255)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('email', 255)->nullable()->unique();
            $table->text('address')->nullable();
            $table->string('tax_id', 50)->nullable()->unique();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Index for frequently queried columns
            $table->index('name');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
