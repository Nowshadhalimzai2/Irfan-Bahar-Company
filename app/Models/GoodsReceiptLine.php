<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GoodsReceiptLine extends Model
{
    protected $fillable = ['item_id', 'receipt_id', 'quantity', 'unit_cost'];

    public function receiptLines() : HasMany {

        return $this->hasMany(GoodsReceiptLine::class);
    }
   
    public function item() : BelongsTo {

        return $this->belongsTo(Item::class);
    }
}
