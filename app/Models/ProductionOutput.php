<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionOutput extends Model
{
    protected $fillable = ['production_order_id','item_id','quantity_produced'];

    public function productionOrder() : BelongsTo {
        
        return $this->belongsTo(ProductionOrder::class);
    }
}
