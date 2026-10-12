<?php

namespace Tests\Unit;

use App\Models\Attendance;
use App\Models\Currency;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\Expense;
use App\Services\DashboardService;
use App\Services\PersianDateConverter;
use Carbon\Carbon;
use DateTimeZone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Morilog\Jalali\Jalalian;
use Tests\TestCase;

class DashboardServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_reports_present_absent_and_unrecorded_active_employees_separately(): void
    {
        $present = $this->createEmployee('Present');
        $absent = $this->createEmployee('Absent');
        $this->createEmployee('Unrecorded');
        $this->createEmployee('Inactive', false);

        Attendance::query()->create([
            'employee_id' => $present->id,
            'date' => Carbon::today(config('app.timezone')),
            'is_present' => true,
        ]);
        Attendance::query()->create([
            'employee_id' => $absent->id,
            'date' => Carbon::today(config('app.timezone')),
            'is_present' => false,
        ]);

        $this->assertSame([
            'total' => 3,
            'present' => 1,
            'absent' => 1,
            'unrecorded' => 1,
        ], app(DashboardService::class)->todayAttendanceSummary());
    }

    public function test_it_includes_a_single_invoice_payment_in_today_receipts(): void
    {
        $currency = Currency::query()->create(['name' => 'AFG']);
        $sale = Sale::query()->create([
            'customer_name' => 'Dashboard customer',
            'currency_id' => $currency->id,
            'status' => 'completed',
            'total' => 100,
            'discount_total' => 0,
            'after_descount_total' => 100,
            'amount_paid' => 0,
            'sold_at' => Carbon::today(config('app.timezone')),
        ]);
        $invoice = Invoice::query()->create([
            'sale_id' => $sale->id,
            'invoice_number' => 'DASH-INV-001',
            'status' => 'issued',
            'currency' => $currency->name,
            'subtotal' => 100,
            'total' => 100,
        ]);
        Payment::query()->create([
            'invoice_id' => $invoice->id,
            'amount' => 35,
            'method' => 'bank_transfer',
            'currency_id' => $currency->id,
            'paid_at' => Carbon::today(config('app.timezone'))->setTime(12, 0),
        ]);

        $this->assertSame(35.0, (float) app(DashboardService::class)->todaysRealPayments()->get($currency->id));
        $this->assertSame(65.0, (float) app(DashboardService::class)->todaysLoans()->get($currency->id));
        $this->assertSame(65.0, (float) app(DashboardService::class)->totalOverallLoans()->get($currency->id));
    }

    public function test_dashboard_date_and_expense_average_follow_persian_calendar_months(): void
    {
        $timezone = new DateTimeZone(config('app.timezone'));
        Carbon::setTestNow(Carbon::parse('2026-10-12 12:00:00', $timezone));

        try {
            $persianToday = Jalalian::now($timezone);
            $dateConverter = app(PersianDateConverter::class);
            $windowStartPersianMonth = Jalalian::fromFormat('Y/m/d', $persianToday->format('Y/m/d'), $timezone)->subMonths(2);
            $windowStart = $dateConverter->toGregorianRange($windowStartPersianMonth->format('Y/m'), 'month', $timezone)['start'];
            $todayRange = $dateConverter->toGregorianRange($persianToday->format('Y/m/d'), 'date', $timezone);
            $currency = Currency::query()->create(['name' => 'AFG']);

            $this->createExpense($currency->id, $windowStart->toDateString(), 100);
            $this->createExpense($currency->id, $windowStart->copy()->subDay()->toDateString(), 1000);
            $this->createExpense($currency->id, $todayRange['end']->copy()->addDay()->toDateString(), 1000);

            $average = app(DashboardService::class)->averageExpensesForCurrency('AFG');
            $currentMonthProgress = $persianToday->getDay() / $persianToday->getDaysOf($persianToday->getMonth());

            $this->assertSame($persianToday->format('Y/m/d'), app(DashboardService::class)->currentPersianDate());
            $this->assertSame(100 / (2 + $currentMonthProgress), $average);
        } finally {
            Carbon::setTestNow();
        }
    }

    private function createEmployee(string $name, bool $active = true): Employee
    {
        $employee = Employee::query()->create([
            'name' => $name,
            'f_name' => 'Dashboard test',
            'phone' => '0700000000',
            'address' => 'Test address',
            'position' => 'worker',
            'shift' => 'day',
            'salary' => 100,
            'recruitment_date' => Carbon::today(config('app.timezone')),
        ]);

        $employee->forceFill(['status' => $active])->save();

        return $employee;
    }

    private function createExpense(int $currencyId, string $date, float $amount): Expense
    {
        return Expense::query()->create([
            'currency_id' => $currencyId,
            'description' => 'Dashboard date test',
            'date' => $date,
            'amount' => $amount,
        ]);
    }
}