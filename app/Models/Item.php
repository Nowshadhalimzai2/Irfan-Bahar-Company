<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Item extends Model
{
    protected $fillable = ['name','code','sku','item_type','unit','default_sale_price','category_id'];

    public function product(): HasOne{

        return $this->hasOne(Product::class);
    }
    public function category(): BelongsTo{
        return $this->belongsTo(Category::class);
    }
}
