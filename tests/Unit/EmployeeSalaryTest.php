<?php

namespace Tests\Unit;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Salary;
use App\Services\SalaryService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Morilog\Jalali\Jalalian;
use Tests\TestCase;

class EmployeeSalaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_proration_and_absence_deduction_follow_persian_month(): void
    {
        $referenceDate = $this->persianDate('1405/04/20');
        $recruitmentDate = $this->persianDate('1405/04/10');
        $employee = $this->employee('PersianProration', 3100, $recruitmentDate);

        foreach (range(0, 4) as $dayOffset) {
            Attendance::create([
                'employee_id' => $employee->id,
                'date' => Jalalian::fromFormat('Y/m/d', '1405/04/10')->addDays($dayOffset)->toCarbon()->toDateString(),
                'is_present' => false,
            ]);
        }

        $service = new SalaryService();
        $gross = $service->thisMonthSalary($employee, $referenceDate);
        $expectedGross = (3100 / 31) * 22;

        $this->assertEquals(round($expectedGross, 2), round($gross, 2));
        $this->assertEquals(round($expectedGross - (100 * 5), 2), round($service->reduceSalaryBasedOnAbsentDays($employee, $gross, $referenceDate), 2));
        $this->assertSame(31, $service->daysInMonth($referenceDate));
    }

    public function test_absences_and_salary_payments_are_grouped_by_persian_month(): void
    {
        $referenceDate = $this->persianDate('1405/03/25');
        $employee = $this->employee('PersianMonth', 3100, $this->persianDate('1405/02/20'));

        foreach ([20, 21, 22] as $day) {
            Attendance::create([
                'employee_id' => $employee->id,
                'date' => $this->persianDate(sprintf('1405/03/%02d', $day))->toDateString(),
                'is_present' => false,
            ]);
        }

        Salary::create([
            'employee_id' => $employee->id,
            'amount' => 250,
            'payment_date' => $this->persianDate('1405/03/01')->toDateString(),
        ]);
        Salary::create([
            'employee_id' => $employee->id,
            'amount' => 900,
            'payment_date' => $this->persianDate('1405/02/31')->toDateString(),
        ]);

        $service = new SalaryService();
        $gross = $service->thisMonthSalary($employee, $referenceDate);

        $this->assertSame(3, $service->absentDays($employee, $referenceDate));
        $this->assertEquals(250, $service->paidThisMonth($employee, $referenceDate));
        $this->assertEquals(round(3100 - (3100 / 31 * 3), 2), round($service->reduceSalaryBasedOnAbsentDays($employee, $gross, $referenceDate), 2));
    }

    public function test_persian_leap_month_has_thirty_days_for_proration(): void
    {
        $referenceDate = $this->persianDate('1403/12/20');
        $employee = $this->employee('PersianLeap', 3000, $this->persianDate('1403/12/15'));
        $service = new SalaryService();

        $this->assertSame(30, $service->daysInMonth($referenceDate));
        $this->assertEquals(round((3000 / 30) * 16, 2), round($service->thisMonthSalary($employee, $referenceDate), 2));
    }

    public function test_recruitment_on_last_day_of_persian_month_prorates_one_day(): void
    {
        $referenceDate = $this->persianDate('1405/04/31');
        $employee = $this->employee('PersianLastDay', 3100, $referenceDate);

        $this->assertEquals(100, (new SalaryService())->thisMonthSalary($employee, $referenceDate));
    }

    public function test_no_absences_keeps_full_persian_month_salary(): void
    {
        $referenceDate = $this->persianDate('1405/05/15');
        $employee = $this->employee('PersianFullMonth', 3100, $this->persianDate('1405/02/01'));
        $service = new SalaryService();
        $gross = $service->thisMonthSalary($employee, $referenceDate);

        $this->assertSame(3100.0, $gross);
        $this->assertSame(3100.0, $service->reduceSalaryBasedOnAbsentDays($employee, $gross, $referenceDate));
    }

    private function employee(string $name, int $salary, Carbon $recruitmentDate): Employee
    {
        return Employee::create([
            'name' => $name,
            'f_name' => 'Tester',
            'position' => 'other',
            'shift' => 'day',
            'salary' => $salary,
            'address' => 'addr',
            'phone' => '0712345678',
            'recruitment_date' => $recruitmentDate->toDateString(),
        ]);
    }

    private function persianDate(string $date): Carbon
    {
        return Jalalian::fromFormat('Y/m/d', $date)->toCarbon();
    }
}
