<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

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

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }
    public function invoices(): HasOneThrough
    {
        return $this->hasOneThrough(Invoice::class, Sale::class);
    }
}
