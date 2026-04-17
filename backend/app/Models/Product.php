<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Product extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'sku',
        'barcode',
        'image_url',
        'description',
        'price',
        'stock_quantity',
        'reorder_level',
        'is_active',
        'category_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'price' => 'decimal:2', // Important for monetary values
        'stock_quantity' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get the SaleItems associated with this product.
     */
    public function saleItems()
    {
        // A product can appear in many sale items
        return $this->hasMany(SaleItem::class);
    }

    /**
     * Get the category of this product
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // Optional: A method to quickly check if it's available
    public function isAvailable()
    {
        return $this->stock_quantity > 0 && $this->is_active;
    }

    /**
     * Check if stock is below reorder level
     */
    public function isLowStock()
    {
        return $this->stock_quantity <= $this->reorder_level;
    }
}