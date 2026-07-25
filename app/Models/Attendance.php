<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    protected $fillable = ['present', 'employee_id', 'date'];

    public function employee(): BelongsTo
    {

        return $this->belongsTo(Employee::class);
    }
}
