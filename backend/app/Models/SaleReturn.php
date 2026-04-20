<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleReturn extends Model
{
    protected $fillable = [
        'sale_id',
        'sale_item_id',
        'product_id',
        'quantity',
        'refund_amount',
        'reason',
        'status',
        'user_id',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'refund_amount' => 'decimal:2',
    ];

    /**
     * Get the sale that this return belongs to
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * Get the sale item that this return references (optional)
     */
    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
    }

    /**
     * Get the product that was returned
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the user who processed this return
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
