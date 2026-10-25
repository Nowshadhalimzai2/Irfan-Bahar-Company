<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SupplierPayment extends Model
{
    protected $fillable = ['id','supplier_id','goods_receipt_id','reference_no','paid_at','amount','notes','payment_method','created_by','status','payment_no','currency_id'];

    // SupplierPayment.php
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function goodsReceipt(): BelongsTo
    {
        return $this->belongsTo(GoodsReceipt::class);
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    public function createdBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'created_by');
    }
}
