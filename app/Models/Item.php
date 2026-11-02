<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Item extends Model
{
    protected $fillable = [
        'name',
        'code',
        'sku',
        'item_type',
        'base_unit_id',
        'unit', // base unit: piece, kg, liter, etc.
        'category_id',

        // Keep temporarily for backward compatibility.
        // New sales should use ItemUnit::selling_price.
        'default_sale_price',
    ];

    protected $casts = [
        'default_sale_price' => 'decimal:2',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function product(): HasOne
    {
        return $this->hasOne(Product::class, 'item_id', 'id');
    }

    public function units(): HasMany
    {
        return $this->hasMany(ItemUnit::class);
    }

    public function baseUnit(): BelongsTo
    {
        return $this->belongsTo(ItemUnit::class, 'base_unit_id');
    }

    public function inventoryBalances(): HasMany
    {
        return $this->hasMany(InventoryBalance::class);
    }

    public function receiptLines(): HasMany
    {
        return $this->hasMany(GoodsReceiptLine::class);
    }

    public function bomLines(): HasMany
    {
        return $this->hasMany(BOMLine::class);
    }

    public function activeUnits(): HasMany
    {
        return $this->units()->where('is_active', true);
    }
}
