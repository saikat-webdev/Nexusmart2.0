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
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value');
            $table->string('type')->default('string'); // string, number, boolean, json
            $table->string('label')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Insert default settings
        DB::table('settings')->insert([
            [
                'key' => 'tax_rate',
                'value' => '10.00',
                'type' => 'number',
                'label' => 'Tax Rate (%)',
                'description' => 'Default tax rate applied to all sales',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'tax_enabled',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Enable Tax',
                'description' => 'Enable or disable tax calculation',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'tax_label',
                'value' => 'VAT',
                'type' => 'string',
                'label' => 'Tax Label',
                'description' => 'Label to display for tax (e.g., VAT, GST, Sales Tax)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'store_name',
                'value' => 'NexusMart',
                'type' => 'string',
                'label' => 'Store Name',
                'description' => 'Your store name displayed on invoices',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
