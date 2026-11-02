<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemUnit extends Model
{
    protected $fillable = [
        'item_id',
        'name',
        'symbol',
        'conversion_to_base',
        'code',
        'barcode',
        'selling_price',
        'purchase_price',
        'is_active',
    ];

    protected $casts = [
        'conversion_to_base' => 'decimal:6',
        'selling_price' => 'decimal:2',
        'purchase_price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeByBarcode(Builder $query, string $barcode): Builder
    {
        return $query->where('barcode', $barcode);
    }

    public function toBaseQuantity(float|int $quantity): float
    {
        return $quantity * (float) $this->conversion_to_base;
    }
}
