<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleLine extends Model
{
    protected $fillable = ['sale_id','item_id','unit','quantity','unit_cost','unit_price','discount','discount_total','line_total','sort_order'];

    public function sale():BelongsTo{
        return $this->belongsTo(Sale::class);
    }
    public function item():BelongsTo{
        return $this->belongsTo(Item::class);
    }
    
}
