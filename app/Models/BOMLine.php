<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BOMLine extends Model
{
    protected $fillable = ['bom_id','item_id','required_quantity'];
    protected $table = 'bom_lines';

    public function item () : BelongsTo {
        return $this->belongsTo(Item::class);
        
    }
}
