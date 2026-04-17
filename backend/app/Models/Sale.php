<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Sale extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'invoice_number', // We will generate this
        'customer_name',
        'customer_id',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'coupon_code',
        'total_amount',
        'payment_method',
        'sale_datetime',
        'user_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'sale_datetime' => 'datetime', // Important for timestamps
    ];

    /**
     * Get the user who made the sale.
     */
    public function user()
    {
        // A sale is made by one user
        return $this->belongsTo(User::class);
    }

    /**
     * Get the customer associated with this sale.
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the SaleItems associated with this sale.
     */
    public function saleItems()
    {
        // A sale has many sale items
        return $this->hasMany(SaleItem::class);
    }

    // --- Helper methods for calculating totals ---
    // These can be useful if you don't store subtotals, tax, etc. directly,
    // but since we are storing them for performance/reporting, they are less critical
    // for the Sale model itself, but important for the Sale creation logic.

    /**
     * Generate a unique invoice number.
     * (This is a simple example, better generation strategies exist for production)
     */
    public static function generateInvoiceNumber()
    {
        // Example: YYYYMMDD-HHMMSS-SOMEID
        return date('Ymd-His') . '-' . strtoupper(substr(uniqid(), 0, 4));
    }
}
