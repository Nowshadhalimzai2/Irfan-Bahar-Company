<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Item extends Model
{
    protected $fillable = ['name','code','item_type','unit','default_sale_price'];

    public function product(): HasOne{

        return $this->hasOne(Product::class);
    }
}
