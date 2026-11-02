<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleLine extends Model
{
    protected $fillable = [
        'sale_id',
        'item_id',
        'item_unit_id',
        'unit',
        'quantity',
        'conversion_factor',
        'base_quantity',
        'unit_cost',
        'unit_price',
        'discount',
        'discount_total',
        'line_total',
        'sort_order',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'conversion_factor' => 'decimal:6',
        'base_quantity' => 'decimal:3',
        'unit_cost' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'discount' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function sale():BelongsTo{
        return $this->belongsTo(Sale::class);
    }
    public function item():BelongsTo{
        return $this->belongsTo(Item::class);
    }

    public function itemUnit(): BelongsTo
    {
        return $this->belongsTo(ItemUnit::class);
    }
    
}
