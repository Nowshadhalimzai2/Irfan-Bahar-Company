<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Locale;

class Transfer extends Model
{
    protected $fillable = ['source_id','destination_id','reference_no','transferred_at','notes'];

    public function source() : BelongsTo {

        return $this->belongsTo(Location::class,'source_id');
        
    }
    public function destination() : BelongsTo {

        return $this->belongsTo(Location::class,'destination_id');
        
    }
    public function transferLines() : HasMany {

        return $this->hasMany(TransferLine::class);
        
    }
}
