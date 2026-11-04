<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    public const SUPPORTED_NAMES = ['super_admin', 'admin', 'shop_clerk', 'factory_clerk'];

    protected $fillable = ['name'];

    public function users (): HasMany {
        
        return $this->hasMany(User::class);
    }
}
