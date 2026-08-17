<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;


class BOM extends Model
{
    protected $table = 'boms';

    protected $fillable = ['formula_name', 'product_id', 'min_exp_qty', 'max_exp_qty', 'is_active'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id', 'item_id');
    }
    public function bomLines(): HasMany
    {
        return $this->hasMany(BOMLine::class,'bom_id');
    }
    public function productionOrders():HasMany{

        return $this->hasMany(ProductionOrder::class);
    }
}
