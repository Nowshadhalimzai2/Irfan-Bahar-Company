<?php

namespace App\Services;

use App\Models\Employee;
use Carbon\Carbon;

class SalaryService
{
    public function thisMonthSalary(Employee $employee, ?Carbon $referenceDate = null)
    {
        if (empty($employee->recruitment_date)) {
            return $employee->salary;
        }

        $tz = config('app.timezone');
        $now = $referenceDate ? $referenceDate->copy()->setTimezone($tz) : Carbon::now($tz);
        $recruitment = Carbon::parse($employee->recruitment_date)->setTimezone($tz);

        if ($now->year === $recruitment->year && $now->month === $recruitment->month) {
            $daysInMonth = $now->daysInMonth;
            $recruitmentDay = $recruitment->day;
            $payableDays = $daysInMonth - $recruitmentDay + 1;
            return ($employee->salary / $daysInMonth) * $payableDays;
        }

        return $employee->salary;
    }

    public function reduceSalaryBasedOnAbsentDays(Employee $employee, int $thisMonthSalary, ?Carbon $referenceDate = null)
    {
        $tz = config('app.timezone');
        $now = $referenceDate ? $referenceDate->copy()->setTimezone($tz) : Carbon::now($tz);

        $startOfMonth = $now->copy()->startOfMonth()->toDateString();
        $endOfMonth = $now->copy()->endOfMonth()->toDateString();

        // If employee was recruited in the reference month, only count absences starting from recruitment date
        if (!empty($employee->recruitment_date)) {
            $recruitment = Carbon::parse($employee->recruitment_date)->setTimezone($tz);
            if ($recruitment->year === $now->year && $recruitment->month === $now->month) {
                $countStart = $recruitment->toDateString();
            } else {
                $countStart = $startOfMonth;
            }
        } else {
            $countStart = $startOfMonth;
        }

        $absentDays = (int) $employee->attendances()
            ->whereBetween('date', [$countStart, $endOfMonth])
            ->where('is_present', false)
            ->count();

        if ($absentDays <= 0) {
            return $thisMonthSalary;
        }

        $daysInMonth = $now->daysInMonth;

        $perDay = $daysInMonth > 0 ? ($employee->salary / $daysInMonth) : 0;

        $deduction = $perDay * $absentDays;

        $adjusted = $thisMonthSalary - $deduction;

        return max(0, round($adjusted, 2));
    }
}
