<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use SoftDeletes;
    protected $fillable = ['invoice_id', 'amount', 'method', 'reference', 'paid_at', 'notes','currency_id','payment_number'];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
    public function currency():BelongsTo{
        return $this->belongsTo(Currency::class);
    }
}
