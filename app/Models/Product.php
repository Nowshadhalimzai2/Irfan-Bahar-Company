<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $primaryKey = 'item_id';

    public $incrementing = false;

    protected $keyType = 'int';

    protected $fillable = [
        'item_id',
        'weight',
        'description',
    ];

    protected $casts = [
        'weight' => 'decimal:3',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id', 'id');
    }
}