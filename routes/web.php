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
use App\Http\Controllers\ProductionInputController;
use App\Http\Controllers\ProductionOrderController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\WasteController;
use App\Models\Currency;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\Item;
use App\Models\ProductionOrder;
use App\Models\Role;
use App\Models\ShopAccount;
use App\Models\Transfer;
use App\Models\User;
use App\Services\HighProductionService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Laravel\Fortify\Http\Controllers\RegisteredUserController;

function getEmplyeesNumbers(){
    return Employee::count();
}
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
        
        //  get all emplyess length 
        $emp_count = getEmplyeesNumbers();
        $transfersToShop = Transfer::with('destination:id,name','transferLines:id,tranfer_id,item_id','transferLines.item:id,category_id','transferLines.item.category:id,name')->whereHas('destination',function ($q) {
            $q->where('name','shop');
        })
        ->orderBy('created_at','desc')
        ->limit(3)
        ->get();
        $currencies = Currency::all(['id','name']);
        return Inertia::render('dashboard', compact('sa', 'todaysExpenses', 'totalExpensesBasedOnCurrency','currencies','transfersToShop','emp_count'));
    })->name('dashboard');
});

Route::get('/total-revenue-and-expenses/{currency}',function(string $currency){
    $today = Carbon::today(config('app.timezone'));
    $startOftheDate = $today->startOfMonth()->subMonth(2);
    $expenses = Expense::with('currency:id,name')
    ->whereDate('date', '>', $startOftheDate)
    ->whereHas('currency', function ($q) use ($currency) {
            $q->where('name', $currency);
    })
    ->sum('amount');
    // 100 30
    //  X  Days
    $currenyMonthDay = Carbon::today(config('app.timezone'))->dayOfMonth();
    $currentMonthDatePercent = (100*$currenyMonthDay)/Carbon::today(config('app.timezone'))->daysInMonth();

    $aveOfThreeMonths = $expenses/(2+($currentMonthDatePercent/100));
    return response()->json($aveOfThreeMonths);    
});

// ---------------------------------------------------------------------------------

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
    Route::get('/transfers/{location}/create',[TransferController::class,'create']);
    Route::get('/transfers/{location}/items/{item}',[TransferController::class,'getItemBalance']);
    Route::resource('inventory-balances', InventoryBalanceController::class)->names('inventory-balances');
    Route::get('/inventory-balances/filter/{filterData}',[InventoryBalanceController::class,'filterItems'])->name('inventory-balances.filter');
    Route::get('/inventory-movements', [InventoryMovementController::class, 'index'])->name('movements.index');
    Route::resource('boms', BOMController::class)->names('boms');
});

Route::middleware(['auth'])->group(function () {
    Route::prefix('factory')->group(function () {
        Route::get('/home', function () {

            //  ===========  get items available in Factory  ===========
            $items = Item::with([
                'inventoryBalances' => function ($query) {
                    $query->whereHas('location', function ($locationQuery) {
                        $locationQuery->where('name', 'factory');
                    });
                },
                'inventoryBalances.location:id,name',
                'product:item_id,per_pack,weight',
                'category:id,name',
            ])->whereHas('inventoryBalances', function ($p0) {
                $p0->whereNot('quanity_on_hand', 0)
                    ->whereHas('location', function ($locationQuery) {
                        $locationQuery->where('name', 'factory');
                    });
            })->paginate(4);

            $highProductionService = new HighProductionService();
            $productionByCategory = $highProductionService->getCategoryByProduction();


            $topProductionCategories = $highProductionService->topProductionCategory($productionByCategory);

            $productionChart = $highProductionService->GenerateProductionChart($productionByCategory,$topProductionCategories);

            $pendingOrders = ProductionOrder::with('bom:id,category_id', 'bom.category:id,name', 'productionOutputs:id,production_order_id,quantity_produced')
                ->select('id', 'ordered_by', 'order_date', 'status', 'bom_id')
                ->where('status','pending')
                ->get();
            return Inertia::render('factory/home', compact('items', 'pendingOrders', 'productionChart', 'topProductionCategories'));
        })->name('factory');
        Route::get('/production-orders/junks', [ProductionOrderController::class, 'junks'])->name('orders.junks');

        Route::get('/production-orders/{production_order}/{status}/confirm-order-inputs', [ProductionInputController::class, 'confirmInputs'])->name('orders.confirm-inputs');
        Route::put('/production-inputs/{production_order}', [ProductionInputController::class, 'update'])->name('order-inputs.update');

        Route::resource('production-orders', ProductionOrderController::class)->names('orders');
        Route::get('/production-orders/get-related-products/{category}', [ProductionOrderController::class, 'getCategoryBasedProducts']);
        Route::get('/production-orders/{production_order}/production-inputs', [ProductionInputController::class, 'getInputs']);
        Route::put('/production-orders/{production_order}/change-status/{status}', [ProductionOrderController::class, 'changeOrderStatus']);
        Route::post('/wastes/{production_order}', [WasteController::class, 'store'])->name('wastes.store');
        Route::get('/wastes/{production_order}', [WasteController::class, 'create'])->name('wastes.create');
        Route::get('/production-orders/{production_order}/wastes', [WasteController::class, 'show'])->name('wastes.index');
    });
});
require __DIR__ . '/settings.php';
require __DIR__ . '/axios-routes.php';
