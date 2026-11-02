<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleReturnLine extends Model
{
    protected $fillable = [
        'sale_return_id',
        'sale_line_id',
        'item_id',
        'item_unit_id',
        'quantity',
        'conversion_factor',
        'base_quantity',
        'unit_price',
        'line_total',
        'condition',
        'restock_action',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'conversion_factor' => 'decimal:6',
        'base_quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function saleReturn(): BelongsTo
    {

        return $this->belongsTo(SaleReturn::class);
    }
    public function saleLine(): BelongsTo
    {

        return $this->belongsTo(SaleLine::class);
    }
    public function item(): BelongsTo
    {

        return $this->belongsTo(Item::class);
    }

    public function itemUnit(): BelongsTo
    {
        return $this->belongsTo(ItemUnit::class);
    }
}
