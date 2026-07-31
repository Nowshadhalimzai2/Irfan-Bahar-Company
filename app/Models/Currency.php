<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Currency extends Model
{
    protected $fillable = ['name'];
    public function shopaccount(){
        return $this->hasOne(ShopAccount::class);
    }
}
