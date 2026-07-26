<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    use HasFactory;
    protected $fillable = ['name', 'f_name', 'position', 'shift', 'salary', 'address', 'phone', 'recruitment_date'];

    public function salaries(): HasMany
    {
        return $this->hasMany(Salary::class);
    }
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }
    public function todayAttendance()
    {
        return $this->hasOne(Attendance::class)->where('date', today());
    }
}
