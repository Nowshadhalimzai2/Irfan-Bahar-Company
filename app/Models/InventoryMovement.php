<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryMovement extends Model
{
    protected $fillable = ['location_id', 'item_id', 'quantity', 'notes', 'movement_type', 'reference_no', 'occured_at'];

    public function location(): BelongsTo
    {

        return $this->belongsTo(Location::class);
    }
    public function item(): BelongsTo
    {

        return $this->belongsTo(Item::class);
    }
}
