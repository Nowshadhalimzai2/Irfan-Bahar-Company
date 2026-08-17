<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Product extends Model
{
    protected $fillable = ['item_id','weight','contains','description','barcode'];

    public function item(): BelongsTo{

        return $this->belongsTo(Item::class)->where('item_type','product');
    }
  
}
