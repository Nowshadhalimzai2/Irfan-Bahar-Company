<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoodsReceipt extends Model
{
    protected $fillable = ['supplier_id', 'destination_location_id', 'reference_no', 'received_at', 'notes'];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
