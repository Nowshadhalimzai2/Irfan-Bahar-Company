<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\Salary;
use App\Models\ShopAccount;
use App\Notifications\EmployeeCreated;
use Carbon\Carbon;
use App\Services\SalaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class EmployeeController extends Controller
{


    public function toggleAttendance(Request $request, Employee $employee)
    {
        DB::beginTransaction();
        try {
            $attendance = Attendance::firstOrCreate(
                ['employee_id' => $employee->id, 'date' => today()],
                ['is_present' => true]
            );

            $attendance->is_present = ! $attendance->is_present;
            $is_present = $attendance->is_present ? "حاضر" : " غیر حاضر ";
            Inertia::flash('toast', ['type' => 'success', 'message' => $employee->name . ' را موفقانه در سیستم شد ' . $is_present]);
            $attendance->save();
            DB::commit();
        } catch (\Throwable $th) {
            DB::rollBack();
            Inertia::flash('toast', ['type' => 'fail', 'message' => 'فعالیت در سیستم انجام نشد' . $th->getMessage()]);
        }


        return redirect()->back();
    }


    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        Gate::authorize('manage-users');
        return Inertia::render('employee/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Gate::authorize('manage-users');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'f_name' => 'required|string|max:255',
            // phone: allow numeric string up to 10 characters
            'phone' => 'required|string|max:10|starts_with:07',
            'address' => 'required|string|max:255',
            'position' => 'required|string',
            'salary' => 'required|numeric',
            'shift' => 'required|string',
            'date' => 'nullable|date',
        ]);
        DB::beginTransaction();
        try {
            $emp = Employee::create([
                ...$validated,
                'recruitment_date' => $validated['date'] ?? now(),
            ]);
           
            Notification::send(Auth::user(), new EmployeeCreated($emp));
            $log = new Log();
            $log->create('insert', " کارکن جدید ", $emp->name);
            DB::commit();
            Inertia::flash('toast', ['type' => 'success', 'message' => ' را موفقانه در سیستم اضافه شد ' . $emp->name]);
            return redirect()->to(route('employees.index'));
        } catch (\Throwable $th) {
            DB::rollBack();
            Inertia::flash('toast', ['type' => 'error', 'message' => 'کارکن را در سیستم اضافه نشد ' . $th->getMessage()]);
            return redirect()->back();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Employee $employee)
    {
        $employee->load('todayAttendance');

        $now = Carbon::now(config('app.timezone'));
        $previousMonth = $now->copy()->subMonth();

        $currentMonthSalaries = $employee->salaries()
            ->whereYear('payment_date', $now->year)
            ->whereMonth('payment_date', $now->month)
            ->get(['id', 'employee_id', 'amount', 'payment_date']);

        $previousMonthSalaries = $employee->salaries()
            ->whereYear('payment_date', $previousMonth->year)
            ->whereMonth('payment_date', $previousMonth->month)
            ->get(['id', 'employee_id', 'amount', 'payment_date']);
        $salaryService = new SalaryService();
        $paymentDate = Carbon::now(config('app.timezone'));
        $grossMonthSalary = $salaryService->thisMonthSalary($employee, $paymentDate);
        $thisMonthSalary = $salaryService->reduceSalaryBasedOnAbsentDays($employee, $grossMonthSalary, $paymentDate);
        $absentDays = $salaryService->absentDays($employee, $paymentDate);
        $paidThisMonth = $salaryService->paidThisMonth($employee, $paymentDate);
        $remainingSalary = $salaryService->remainingSalary($employee, $paymentDate);
        $daysInMonth = $salaryService->daysInMonth($paymentDate);
        $perDay = $daysInMonth > 0 ? round($employee->salary / $daysInMonth, 2) : 0;

        return Inertia::render("employee/show", compact("employee", "currentMonthSalaries", "previousMonthSalaries", 'thisMonthSalary', 'grossMonthSalary', 'absentDays', 'perDay', 'paidThisMonth', 'remainingSalary'));
    }

    public function salaryReceipt(Employee $employee, Salary $salary)
    {
        if ($salary->employee_id !== $employee->id) {
            abort(404);
        }

        $paymentDate = Carbon::parse($salary->payment_date)->setTimezone(config('app.timezone'));
        $salaryService = new SalaryService();

        $grossMonthSalary = $salaryService->thisMonthSalary($employee, $paymentDate);
        $adjustedSalary = $salaryService->reduceSalaryBasedOnAbsentDays($employee, $grossMonthSalary, $paymentDate);
        $absentDays = $salaryService->absentDays($employee, $paymentDate);
        $paidThisMonth = $salaryService->paidThisMonth($employee, $paymentDate);
        $remainingSalary = $salaryService->remainingSalary($employee, $paymentDate);
        $daysInMonth = $salaryService->daysInMonth($paymentDate);
        $perDay = $daysInMonth > 0 ? round($employee->salary / $daysInMonth, 2) : 0;

        return Inertia::render('employee/salary-receipt', compact('employee', 'salary', 'grossMonthSalary', 'adjustedSalary', 'absentDays', 'paidThisMonth', 'remainingSalary', 'perDay'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Employee $employee)
    {
        Gate::authorize('manage-users');

        return Inertia::render('employee/edit', compact('employee'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Employee $employee)
    {
        Gate::authorize('manage-users');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'f_name' => 'required|string|max:255',
            'phone' => 'required|string|max:10|starts_with:07',
            'address' => 'required|string|max:255',
            'position' => 'required|string',
            'salary' => 'required|numeric',
            'shift' => 'required|string',

        ]);
        DB::beginTransaction();
        try {
            $emp = $employee->update([
                ...$validated,
            ]);
            $log = new Log();
            $log->create('update', "", $employee->name);
            DB::commit();
            Inertia::flash('toast', ['type' => 'success', 'message' => ' را موفقانه در سیستم به روز رسانی شد ' . $employee->name]);
            return redirect()->to(route('employees.index'));
        } catch (\Throwable $th) {
            DB::rollBack();
            Inertia::flash('toast', ['type' => 'error', 'message' => 'به روز رسانی نشد  ' . $th->getMessage() . ' مصخصات کارمند ']);
            return redirect()->back();
        }
    }



    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Employee $employee)
    {
        Gate::authorize('manage-users');

        DB::beginTransaction();
        try {
            $log = new Log();
            $log->create('delete', '', $employee->name);
            $employee->delete();
            Inertia::flash('toast', ['type' => 'success', 'message' => ' موفقانه از سیستم حذف شد ' . $employee->name . ' کارمند ']);
            DB::commit();
            return redirect()->to(route('employees.index'));
        } catch (\Throwable $th) {
            Inertia::flash('toast', ['type' => 'error', 'message' => ' حذف نشد ' . $employee->name . ' کارمند' . $th->getMessage()]);
            DB::rollBack();
            return redirect()->back();
        }
    }



    public function paySalary(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|integer|exists:employees,id',
            'payment_date' => ['nullable', 'date'],
        ]);
        $log = new Log();

        $employee = Employee::findOrFail($request->employee_id);

        $paymentDate = $request->filled('payment_date')
            ? Carbon::parse($request->input('payment_date'))->setTimezone(config('app.timezone'))
            : Carbon::now(config('app.timezone'));

        $salaryService = new SalaryService();
        $remainingSalary = (float) $salaryService->remainingSalary($employee, $paymentDate);



        $request->validate([
            'amount' => ['required', 'numeric', 'gte:10', 'lte:' . $remainingSalary],
        ]);

        $amount = (float) $request->amount;
        // $startOfMonth = $paymentDate->copy()->startOfMonth()->toDateString();
        // $endOfMonth = $paymentDate->copy()->endOfMonth()->toDateString();

        DB::beginTransaction();

        try {
            $shopAccount = ShopAccount::query()->firstOrFail();
        
            // $paidThisMonth = (float) $employee->salaries()
            //     ->whereBetween('payment_date', [$startOfMonth, $endOfMonth])
            //     ->sum('amount');
            if ($employee->recruitment_date > $request->payment_date) {
                $log->create('other', "می خواست برای {$employee->name} معاش پرداخت کند اما توسظ یوزر تاریخ پیش از استخدام انتخاب شده بود");
                Inertia::flash('toast', [
                    'type' => 'error',
                    'message' => 'شما نمی توانین که معاش قبل از استخدام پرداخت کنین. لطف نماین در وقت پرداخت تاریخ را درست انتخاب کنین',
                ]);
                return redirect()->back();
            }
            if ($remainingSalary <= 0) {
                $log->create('other', "می خواست برای {$employee->name} معاش پرداخت کند اما کارمند در این ماه معاش خوده کامل ګرفته بود ");

                Inertia::flash('toast', [
                    'type' => 'error',
                    'message' => 'معاش این ماه قبلاً کامل پرداخت شده است.',
                ]);
                return redirect()->back();
            }
            if ($shopAccount->amount < $amount) {
                DB::rollBack();

                Inertia::flash('toast', [
                    'type' => 'error',
                    'message' => 'متاسفانه در دوکان پول کافی ندارم!',
                ]);

                $log->create('insert', "می خواست برای {$employee->name} معاش پرداخت کند اما پول در حساب دوکان کافی نبود");

                return redirect()->back();
            }

            if ($amount > $remainingSalary) {
                DB::rollBack();

                Inertia::flash('toast', [
                    'type' => 'error',
                    'message' => "مبلغ وارد شده از باقی‌مانده معاش قابل پرداخت بیشتر است",
                ]);

                $log->create('insert', "می خواست برای {$employee->name} معاش پرداخت کند اما مبلغ بیشتر از باقی‌مانده ماه بود");

                return redirect()->back();
            }

            $salary = $employee->salaries()->create([
                'amount' => $amount,
                'payment_date' => $paymentDate->toDateString(),
            ]);

            $shopAccount->amount -= $amount;
            $shopAccount->save();

            // Add the transaction to the expesnes list.
            $des= sprintf('برای %s معاش وصول شد',$employee->name);
            Expense::create([
                'amount' => $amount,
                'description' => $des,
                'date' => $paymentDate->toDateString(),
                'currency_id' => 1, // Assuming currency_id is 1 for the default currency
            ]);
            DB::commit();

            $log = new Log();
            $log->create('insert', sprintf('برای %s در معاش وصل شد',$employee->name),'',"/employees/$employee->id/salary-receipt/$salary->id");

            return redirect()->route('employees.salary.receipt', [$employee, $salary]);
        } catch (\Throwable $th) {
            DB::rollBack();

            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'پرداخت معاش انجام نشد: ' . $th->getMessage(),
            ]);
        }

        return redirect()->back();
    }


    // Salary calculation moved to App\Services\SalaryService
}
