<?php

use App\Actions\Fortify\CreateNewUser;
use App\Custome\Log;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\BOMController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\GoodsReceiptController;
use App\Http\Controllers\InventoryBalanceController;
use App\Http\Controllers\InventoryMovementController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\TransferController;
use App\Models\Expense;
use App\Models\Role;
use App\Models\ShopAccount;
use App\Models\User;
use Carbon\Carbon;
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
        $todaysExpenses = Expense::with('currency:id,name')
            ->select('id', 'amount', 'description', 'date', 'currency_id')
            ->whereDate('date', Carbon::today(config('app.timezone')))
            ->orderBy('id', 'desc')
            ->get();
        $totalExpensesBasedOnCurrency = $todaysExpenses->groupBy('currency_id')->map(function ($expesnes) {
            return $expesnes->sum('amount');
        });
        return Inertia::render('dashboard', compact('sa', 'todaysExpenses', 'totalExpensesBasedOnCurrency'));
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

Route::middleware(['auth', 'refuseFactoryClerk'])->group(function () {
    Route::get('/expenses/expenses-range', [ExpenseController::class, 'expensesRange'])->name('expenses.expenses-range');
    Route::resource('expenses', ExpenseController::class)->names('expenses');
});

Route::middleware(['auth'])->group(function () {
    Route::resource('suppliers', SupplierController::class)->names('suppliers');
    Route::get('/locations', [LocationController::class, 'index'])->name('locations.index');
    Route::post('/locations', [LocationController::class, 'store'])->name('locations.index');
    Route::put('/locations/{location}/toggle-is-active/{is_active}', [LocationController::class, 'update'])->name('locations.index');
});


// ============================  Goods Receipt and Transfers Section =====================
Route::middleware('auth')->group(function () {
    Route::resource('receipts', GoodsReceiptController::class)->names('receipts');
    Route::resource('items', ItemController::class)->names('items');
    Route::resource('transfers', TransferController::class)->names('items');
    Route::resource('inventory-balances', InventoryBalanceController::class)->names('inventory-balances');
    Route::get('/inventory-movements',[InventoryMovementController::class,'index'])->name('movements.index');
});
require __DIR__ . '/settings.php';
require __DIR__ . '/axios-routes.php';
