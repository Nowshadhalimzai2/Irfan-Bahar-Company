<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionOrder extends Model
{
    protected $fillable = ['ordered_by', 'bom_id', 'status', 'order_date', 'notes'];

    public function bom(): BelongsTo
    {
        return $this->belongsTo(BOM::class, 'bom_id');
    }
}
