<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'code',
        'description',
        'discount_type',
        'discount_value',
        'usage_limit',
        'usage_count',
        'valid_from',
        'valid_until',
        'min_order_amount',
        'is_active',
    ];

    protected $casts = [
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'discount_value' => 'float',
        'min_order_amount' => 'float',
        'is_active' => 'boolean',
        'usage_count' => 'integer',
        'usage_limit' => 'integer',
    ];

    /**
     * Check if the coupon is valid and can be used
     */
    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $now = now();

        if ($this->valid_from && $now < $this->valid_from) {
            return false;
        }

        if ($this->valid_until && $now > $this->valid_until) {
            return false;
        }

        if ($this->usage_limit && $this->usage_count >= $this->usage_limit) {
            return false;
        }

        return true;
    }

    /**
     * Check if coupon meets minimum order amount
     */
    public function meetsMinimumAmount($orderAmount): bool
    {
        return $orderAmount >= $this->min_order_amount;
    }

    /**
     * Calculate discount amount
     */
    public function calculateDiscount($orderAmount): float
    {
        if ($this->discount_type === 'fixed') {
            return min($this->discount_value, $orderAmount);
        }

        // Percentage discount
        return ($orderAmount * $this->discount_value) / 100;
    }

    /**
     * Increment usage count
     */
    public function recordUsage(): void
    {
        $this->increment('usage_count');
    }
}

