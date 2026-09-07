<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleReturn extends Model
{
    protected $fillable = [
        'sale_id',
        'invoice_id',
        'created_by',
        'return_number',
        'status',
        'reason',
        'currency',
        'total',
        'refund_amount',
        'refund_method',
        'refund_reference',

        'requested_at',
        'approved_at',
        'received_at',
        'refunded_at',

        'notes',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
    
}
