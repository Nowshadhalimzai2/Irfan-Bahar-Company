<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;


class BOM extends Model
{
    protected $table = 'boms';

    protected $fillable = ['formula_name', 'category_id', 'min_exp_qty', 'max_exp_qty', 'is_active','code'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
    public function bomLines(): HasMany
    {
        return $this->hasMany(BOMLine::class,'bom_id');
    }
    public function productionOrders():HasMany{

        return $this->hasMany(ProductionOrder::class);
    }
}
