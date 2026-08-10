<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryBalance extends Model
{
    protected $fillable = ['item_id','location_id','quantity_on_hand','reserved'];
}
