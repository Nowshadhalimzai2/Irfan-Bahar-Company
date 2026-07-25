<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Salary extends Model
{
    protected $fillable = ['amount','employee_id','payment_date'];

    public function employee():BelongsTo{

        return $this->belongsTo(Employee::class);
    }
}
