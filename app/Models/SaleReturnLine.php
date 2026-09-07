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
        'quantity',
        'unit_price',
        'line_total',
        'condition',
        'restock_action',
        'notes',
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
}
