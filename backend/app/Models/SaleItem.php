<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class SaleItem extends Model
{
    use HasFactory;

    /**
     * Indicates if the model should be mass-assigned.
     */
    public $timestamps = false; // Sale Items don't typically have created_at/updated_at

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'sale_id',
        'product_id',
        'quantity',
        'unit_price',
        'line_item_total',
        'line_item_tax',
        'line_item_discount',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'line_item_total' => 'decimal:2',
        'line_item_tax' => 'decimal:2',
        'line_item_discount' => 'decimal:2',
    ];

     /**
      * Get the sale that this item belongs to.
      */
     public function sale()
     {
         return $this->belongsTo(Sale::class);
     }

     /**
      * Get the returns associated with this sale item.
      */
     public function returns()
     {
         return $this->hasMany(SaleReturn::class);
     }

     /**
      * Get the product associated with this sale item.
      */
     public function product()
     {
         return $this->belongsTo(Product::class);
     }
}