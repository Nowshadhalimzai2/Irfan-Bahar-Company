<?php

namespace App\Models;

use App\Models\ProductionOutput;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductionOrder extends Model
{
    protected $fillable = ['ordered_by', 'bom_id', 'status', 'order_date', 'notes', 'reference_no'];

    public function bom(): BelongsTo
    {
        return $this->belongsTo(BOM::class, 'bom_id');
    }
    public function productionInputs(): HasMany
    {
        return $this->hasMany(ProductionInput::class);
    }

    public function productionOutputs(): HasMany
    {
        return $this->hasMany(ProductionOutput::class);
    }
    public function wastes(): HasMany
    {
        return $this->hasMany(Waste::class);
    }
}
