<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransferLine extends Model
{
    protected $fillable = ['transfer_id','item_id','quantity','unit_price'];

    public function transfer() : BelongsTo{

        return $this->belongsTo(Transfer::class);
    }
    public function item() : BelongsTo{

    return $this->belongsTo(Item::class);
    }
}
