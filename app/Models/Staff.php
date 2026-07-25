<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Staff extends Model
{
    protected $fillable = ['name', 'f_name', 'position', 'address', 'phone', 'salary', 'shift', 'status', 'recruitment_date'];

    public function salaries(): HasMany
    {

        return $this->hasMany(Salary::class);
    }
    public function attendances(): HasMany
    {

        return $this->hasMany(Attendance::class);
    }
}
