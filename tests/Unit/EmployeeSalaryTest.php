<?php

namespace Tests\Unit;

use App\Models\Attendance;
use App\Models\Employee;
use App\Http\Controllers\EmployeeController;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeSalaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_prorated_and_absence_deduction_for_recruitment_mid_month()
    {
        Carbon::setTestNow(Carbon::create(2026, 7, 28, 0, 0, 0));

        $daysInMonth = Carbon::now()->daysInMonth; // July -> 31

        $salary = 3100; // easy number: 100 per day if 31 days

        // recruited on 10th -> day 10
        $recruitmentDate = Carbon::now()->startOfMonth()->addDays(9); // 10th

        $employee = Employee::create([
            'name' => 'Test',
            'f_name' => 'Tester',
            'position' => 'other',
            'shift' => 'day',
            'salary' => $salary,
            'address' => 'addr',
            'phone' => '0712345678',
            'recruitment_date' => $recruitmentDate->toDateString(),
        ]);

        // absent days: 5 days after recruitment
        $absentDays = 5;
        $startAbsent = $recruitmentDate->copy();
        for ($i = 0; $i < $absentDays; $i++) {
            Attendance::create([
                'employee_id' => $employee->id,
                'date' => $startAbsent->copy()->addDays($i)->toDateString(),
                'is_present' => false,
            ]);
        }

        $service = new \App\Services\SalaryService();

        $gross = $service->thisMonthSalary($employee, Carbon::now());

        $perDay = $salary / $daysInMonth;
        $payableDays = $daysInMonth - 10 + 1; // from 10th to end inclusive
        $expectedGross = ($salary / $daysInMonth) * $payableDays;

        $this->assertEquals(round($expectedGross, 2), round($gross, 2));

        $adjusted = $service->reduceSalaryBasedOnAbsentDays($employee, $gross, Carbon::now());

        $expectedAdjusted = $expectedGross - ($perDay * $absentDays);
        $this->assertEquals(round($expectedAdjusted, 2), round($adjusted, 2));
    }

    public function test_payment_date_previous_month_is_respected()
    {
        // reference: Payment selected as June 15, 2026
        $paymentDate = Carbon::create(2026, 6, 15, 0, 0, 0);

        $salary = 3000; // June has 30 days -> 100 per day

        // recruited before June so full month salary applies for June
        $recruitmentDate = Carbon::create(2026, 5, 20);

        $employee = Employee::create([
            'name' => 'PrevMonth',
            'f_name' => 'Tester',
            'position' => 'other',
            'shift' => 'day',
            'salary' => $salary,
            'address' => 'addr',
            'phone' => '0712345678',
            'recruitment_date' => $recruitmentDate->toDateString(),
        ]);

        // absent 3 days in June
        $absentDates = [
            '2026-06-10',
            '2026-06-11',
            '2026-06-12',
        ];

        foreach ($absentDates as $d) {
            Attendance::create([
                'employee_id' => $employee->id,
                'date' => $d,
                'is_present' => false,
            ]);
        }

        $service = new \App\Services\SalaryService();

        $gross = $service->thisMonthSalary($employee, $paymentDate);

        $this->assertEquals($salary, round($gross, 2));

        $adjusted = $service->reduceSalaryBasedOnAbsentDays($employee, $gross, $paymentDate);

        $expectedAdjusted = $salary - (100 * count($absentDates));
        $this->assertEquals(round($expectedAdjusted, 2), round($adjusted, 2));
    }

    public function test_leap_year_february_prorate()
    {
        $paymentDate = Carbon::create(2024, 2, 20);

        $salary = 2900; // 29 days -> 100 per day
        // recruited on 15th Feb
        $recruitmentDate = Carbon::create(2024, 2, 15);

        $employee = Employee::create([
            'name' => 'Leap',
            'f_name' => 'Tester',
            'position' => 'other',
            'shift' => 'day',
            'salary' => $salary,
            'address' => 'addr',
            'phone' => '0712345678',
            'recruitment_date' => $recruitmentDate->toDateString(),
        ]);

        $service = new \App\Services\SalaryService();

        $gross = $service->thisMonthSalary($employee, $paymentDate);

        $daysInMonth = 29;
        $payableDays = $daysInMonth - 15 + 1; // 15
        $expectedGross = ($salary / $daysInMonth) * $payableDays;

        $this->assertEquals(round($expectedGross, 2), round($gross, 2));
    }

    public function test_recruited_on_last_day_of_month()
    {
        $paymentDate = Carbon::create(2026, 7, 31);

        $salary = 3100; // 31 days -> 100 per day
        // recruited on last day (31st)
        $recruitmentDate = Carbon::create(2026, 7, 31);

        $employee = Employee::create([
            'name' => 'LastDay',
            'f_name' => 'Tester',
            'position' => 'other',
            'shift' => 'day',
            'salary' => $salary,
            'address' => 'addr',
            'phone' => '0712345678',
            'recruitment_date' => $recruitmentDate->toDateString(),
        ]);

        $service = new \App\Services\SalaryService();

        $gross = $service->thisMonthSalary($employee, $paymentDate);

        $expectedGross = ($salary / 31) * 1;
        $this->assertEquals(round($expectedGross, 2), round($gross, 2));
    }

    public function test_no_absences_full_month()
    {
        $paymentDate = Carbon::create(2026, 8, 15);

        $salary = 3100; // August 31 -> full salary expected
        $recruitmentDate = Carbon::create(2026, 5, 1);

        $employee = Employee::create([
            'name' => 'Full',
            'f_name' => 'Tester',
            'position' => 'other',
            'shift' => 'day',
            'salary' => $salary,
            'address' => 'addr',
            'phone' => '0712345678',
            'recruitment_date' => $recruitmentDate->toDateString(),
        ]);

        $service = new \App\Services\SalaryService();

        $gross = $service->thisMonthSalary($employee, $paymentDate);
        $adjusted = $service->reduceSalaryBasedOnAbsentDays($employee, $gross, $paymentDate);

        $this->assertEquals(round($salary, 2), round($gross, 2));
        $this->assertEquals(round($salary, 2), round($adjusted, 2));
    }
}
