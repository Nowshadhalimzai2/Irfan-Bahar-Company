<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoodsReceiptLine extends Model
{
    protected $fillable = [
        'item_id',
        'item_unit_id',
        'receipt_id',
        'quantity',
        'conversion_factor',
        'base_quantity',
        'unit_cost',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'conversion_factor' => 'decimal:6',
        'base_quantity' => 'decimal:3',
        'unit_cost' => 'decimal:2',
    ];

    public function receipt(): BelongsTo
    {
        return $this->belongsTo(GoodsReceipt::class, 'receipt_id');
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
