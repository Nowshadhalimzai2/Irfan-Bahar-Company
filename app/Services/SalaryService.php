<?php

namespace App\Services;

use App\Models\Employee;
use Carbon\Carbon;
use Morilog\Jalali\Jalalian;

class SalaryService
{
    private PersianDateConverter $persianDateConverter;

    public function __construct(?PersianDateConverter $persianDateConverter = null)
    {
        $this->persianDateConverter = $persianDateConverter ?? new PersianDateConverter();
    }

    public function thisMonthSalary(Employee $employee, ?Carbon $referenceDate = null): float
    {
        if (empty($employee->recruitment_date)) {
            return (float) $employee->salary;
        }

        [$now, , $daysInMonth] = $this->persianMonth($referenceDate);
        $recruitment = Jalalian::fromCarbon(Carbon::parse($employee->recruitment_date)->setTimezone(config('app.timezone')));
        $persianNow = Jalalian::fromCarbon($now);

        if ($persianNow->getYear() === $recruitment->getYear() && $persianNow->getMonth() === $recruitment->getMonth()) {
            $recruitmentDay = $recruitment->getDay();
            $payableDays = $daysInMonth - $recruitmentDay + 1;
            return ((float) $employee->salary / $daysInMonth) * $payableDays;
        }

        return (float) $employee->salary;
    }

    public function reduceSalaryBasedOnAbsentDays(Employee $employee, float $thisMonthSalary, ?Carbon $referenceDate = null): float
    {
        [, $monthRange, $daysInMonth] = $this->persianMonth($referenceDate);
        $start = $monthRange['start'];
        $end = $monthRange['end'];

        if (!empty($employee->recruitment_date)) {
            $recruitment = Carbon::parse($employee->recruitment_date)->setTimezone(config('app.timezone'));
            if ($recruitment->greaterThan($start)) {
                $start = $recruitment;
            }
        }

        $absentDays = (int) $employee->attendances()
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->where('is_present', false)
            ->count();

        if ($absentDays <= 0) {
            return $thisMonthSalary;
        }

        $perDay = $daysInMonth > 0 ? ((float) $employee->salary / $daysInMonth) : 0;

        $deduction = $perDay * $absentDays;

        $adjusted = $thisMonthSalary - $deduction;

        return max(0, round($adjusted, 2));
    }

    public function paidThisMonth(Employee $employee, ?Carbon $referenceDate = null): float
    {
        [, $monthRange] = $this->persianMonth($referenceDate);

        return (float) $employee->salaries()
            ->whereBetween('payment_date', [$monthRange['start']->toDateString(), $monthRange['end']->toDateString()])
            ->sum('amount');
    }

    public function remainingSalary(Employee $employee, ?Carbon $referenceDate = null): float
    {
        $adjusted = $this->reduceSalaryBasedOnAbsentDays($employee, $this->thisMonthSalary($employee, $referenceDate), $referenceDate);
        $paid = $this->paidThisMonth($employee, $referenceDate);

        return max(0, round($adjusted - $paid, 2));
    }

    public function absentDays(Employee $employee, ?Carbon $referenceDate = null): int
    {
        [, $monthRange] = $this->persianMonth($referenceDate);
        $start = $monthRange['start'];
        $end = $monthRange['end'];

        if (!empty($employee->recruitment_date)) {
            $recruitment = Carbon::parse($employee->recruitment_date)->setTimezone(config('app.timezone'));
            if ($recruitment->greaterThan($start)) {
                $start = $recruitment;
            }
        }

        return (int) $employee->attendances()
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->where('is_present', false)
            ->count();
    }

    public function daysInMonth(?Carbon $referenceDate = null): int
    {
        [, , $daysInMonth] = $this->persianMonth($referenceDate);

        return $daysInMonth;
    }

    /**
     * @return array{0: Carbon, 1: array{start: Carbon, end: Carbon}, 2: int}
     */
    private function persianMonth(?Carbon $referenceDate = null): array
    {
        $timezone = config('app.timezone');
        $now = $referenceDate ? $referenceDate->copy()->setTimezone($timezone) : Carbon::now($timezone);
        $persianNow = Jalalian::fromCarbon($now);
        $monthRange = $this->persianDateConverter->toGregorianRange($persianNow->format('Y/m'), 'month');

        return [$now, $monthRange, $persianNow->getDaysOf($persianNow->getMonth())];
    }
}
