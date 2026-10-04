<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Sale extends Model
{
    protected $fillable = ['customer_id', 'customer_name', 'currency_id', 'created_by', 'status', 'total', 'discount_total', 'after_descount_total', 'amount_paid', 'sold_at', 'notes'];

    public function customer(): BelongsTo
    {

        return $this->belongsTo(Customer::class);
    }
    public function currency(): BelongsTo
    {

        return $this->belongsTo(Currency::class);
    }
    public function saleLines(): HasMany
    {
        return $this->hasMany(SaleLine::class);
    }
    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }
    public function saleReturns(): HasMany
    {

        return $this->hasMany(SaleReturn::class);
    }
    public function getRefundedAmount():float{

        return $this->saleReturns()->sum('refund_amount');
    }

    public function returnValueForUnitPrice(float $unitPrice): float
    {
        $grossTotal = (float) $this->total;
        $netTotal = (float) $this->after_descount_total;
        $netFactor = $grossTotal > 0 ? min(1, max(0, $netTotal / $grossTotal)) : 1;

        return round($unitPrice * $netFactor, 2);
    }
}
