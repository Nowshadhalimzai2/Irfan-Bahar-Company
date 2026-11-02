<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransferLine extends Model
{
    protected $fillable = [
        'transfer_id',
        'item_id',
        'item_unit_id',
        'quantity',
        'conversion_factor',
        'base_quantity',
        'unit_price',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'conversion_factor' => 'decimal:6',
        'base_quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
    ];

    public function transfer() : BelongsTo{

        return $this->belongsTo(Transfer::class);
    }
    public function item() : BelongsTo{

    return $this->belongsTo(Item::class);
    }

    public function itemUnit(): BelongsTo
    {
        return $this->belongsTo(ItemUnit::class);
    }
}
