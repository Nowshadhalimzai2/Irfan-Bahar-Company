<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryBalance extends Model
{
    protected $fillable = ['item_id','location_id','quantity_on_hand','reserved'];

    public function item() : BelongsTo {
        
        return $this->belongsTo(Item::class);
    }
    public function location() : BelongsTo {
        
        return $this->belongsTo(Location::class);
    }
}
