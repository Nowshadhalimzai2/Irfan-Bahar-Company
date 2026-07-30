<?php

use App\Actions\Fortify\CreateNewUser;
use App\Custome\Log;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\SalaryController;
use App\Models\Role;
use App\Models\ShopAccount;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Laravel\Fortify\Http\Controllers\RegisteredUserController;

Route::inertia('/', 'welcome')->name('home');
// Route::inertia('/products',)->name('products.index');
Route::inertia('/contact-us', 'contact-us')->name('contact-us');
Route::inertia('/about-us', 'about-us')->name('about-us');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        $sa = ShopAccount::with('currency:id,name')->select('id', 'amount', 'currency_id')->get();
        // dd($sa);
        return Inertia::render('dashboard', compact('sa'));
    })->name('dashboard');
});

Route::get('/register', function () {


    if (User::query()->exists()) {
        Gate::authorize('manage-users');
    }

    return Inertia::render('auth/register', [
        'passwordRules' => Password::defaults()->toPasswordRulesString(),
        'roles' => Role::select('id', 'name')->get(),
    ]);
})->name('register');

Route::post('/register', function (Request $request, CreateNewUser $creator) {
    if (User::query()->exists()) {
        Gate::authorize('manage-users');
    }

    DB::beginTransaction();
    try {
        $user = $creator->create($request->all());

        if (! Auth::check()) {
            Auth::login($user);
        }

        $log = new Log();
        $log->create('insert', ' یوزر  جدید', $user->name);
        Inertia::flash('toast', ['type' => 'success', 'message' => ' موفقانه ایجاد شد {$request->name} اکونت یوزر']);
        DB::commit();
    } catch (\Throwable $th) {
        DB::rollBack();
        Inertia::flash('toast', ['type' => 'success', 'message' => ' یک مشکل در وجود امد. ' . $th->getMessage()]);
        return redirect()->back();
    }

    return redirect()->route('dashboard')->with('success', 'User created successfully.');
})->name('register.store');

Route::middleware(['auth'])->group(function () {
    Route::get('/stackholders', [RegisteredUserController::class, 'index'])->name('employees.index');
    Route::get('/logs', [LogController::class, 'index'])->name('logs.index');
    Route::resource('employees', EmployeeController::class)->except('index')->names('employees');
    Route::post('/employees/{employee}/attendance-toggle', [EmployeeController::class, 'toggleAttendance'])
        ->name('employees.attendance.toggle');

    Route::get('/employees/{employee}/salary-receipt/{salary}', [EmployeeController::class, 'salaryReceipt'])
        ->name('employees.salary.receipt');

    Route::post('/employees/{employee}/pay-salary', [EmployeeController::class, 'paySalary'])->name('pay.salary')
        ->name('employees.pay.salary');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/employees/{employee}/salary-record', [SalaryController::class, 'salaryRecord'])->name('emplyee-salary-record');
    Route::get('/employees/{employee}/attendance-record', [AttendanceController::class, 'attendanceRecord'])->name('emplyee-attendance-record');
    
});
require __DIR__ . '/settings.php';
require __DIR__ . '/axios-routes.php';
