<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Salary extends Model
{
    protected $fillable = ['amount','payment_date','user_id'];

    public function user():BelongsTo{

        return $this->belongsTo(User::class);
    }
}
