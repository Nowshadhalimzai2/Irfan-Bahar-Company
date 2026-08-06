<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Product extends Model
{
    protected $fillable = ['item_id','weight','contains','description'];

    public function item(): HasOne{

        return $this->hasOne(Item::class)->where('item_type','product');
    }
}
