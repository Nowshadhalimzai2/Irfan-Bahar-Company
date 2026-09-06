<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'name',
        'nick_name',
        'email',
        'phone',
        'address',
        'is_active',
    ];
}
