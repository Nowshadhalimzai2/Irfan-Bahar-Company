<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ShopAccount extends Model
{
    protected $fillable = ['amount','currency_id'];

    public function currency ():BelongsTo{

        return $this->belongsTo(Currency::class);
    }
}
