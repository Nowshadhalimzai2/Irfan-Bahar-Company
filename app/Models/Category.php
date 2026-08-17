<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Category extends Model
{
    protected $fillable = ['name'];


    public function bom(): HasOne
    {
        return $this->hasOne(BOM::class);
    }
}
