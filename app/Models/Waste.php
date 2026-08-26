<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Waste extends Model
{
    protected $fillable = ['production_order_id','item_id','wasted_quantity','reason'];

    public function item():BelongsTo{

        return $this->belongsTo(Item::class)->whereNot('item_type','product');
    }
}
