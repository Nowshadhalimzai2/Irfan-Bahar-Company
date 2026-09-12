<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaleReturn extends Model
{
    protected $fillable = [
        'sale_id',
        'location_id',
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

    protected $casts = [
        'total' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'received_at' => 'datetime',
        'refunded_at' => 'datetime',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(SaleReturnLine::class);
    }
    
}
