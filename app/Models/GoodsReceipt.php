<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GoodsReceipt extends Model
{
    protected $fillable = ['supplier_id', 'destination_location_id', 'reference_no', 'received_at', 'notes', 'total_amount', 'amount_paid', 'currency_id'];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
    // GoodsReceipt.php
    public function payments(): HasMany
    {
        return $this->hasMany(SupplierPayment::class);
    }
    public function receiptLines(): HasMany
    {

        return $this->hasMany(GoodsReceiptLine::class, 'receipt_id');
    }
    public function location(): BelongsTo
    {

        return $this->belongsTo(Location::class, 'destination_location_id');
    }
    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }
}
