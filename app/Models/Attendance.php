<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    protected $fillable = ['present', 'date', 'user_id'];

    public function user(): BelongsTo
    {

        return $this->belongsTo(User::class);
    }
}
