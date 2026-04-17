<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'total_spent',
        'total_purchases',
    ];

    protected $casts = [
        'total_spent' => 'decimal:2',
        'total_purchases' => 'integer',
    ];

    /**
     * Get sales for this customer
     */
    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}