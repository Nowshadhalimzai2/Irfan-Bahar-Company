<?php

use App\Actions\Fortify\CreateNewUser;
use App\Custome\Log;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\BOMController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\GoodsReceiptController;
use App\Http\Controllers\InventoryBalanceController;
use App\Http\Controllers\InventoryMovementController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProductionInputController;
use App\Http\Controllers\ProductionOrderController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SaleReturnController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\WasteController;
use App\Models\Currency;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\Item;
use App\Models\Payment;
use App\Models\ProductionOrder;
use App\Models\Role;
use App\Models\Sale;
use App\Models\ShopAccount;
use App\Models\Transfer;
use App\Models\User;
use App\Services\DashboardService;
use App\Services\HighProductionService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Laravel\Fortify\Http\Controllers\RegisteredUserController;

if (! function_exists('getEmployees')) {
    function getEmployees()
    {
        return Employee::with('attendances:id,employee_id,date,is_present')->whereHas('attendances', function ($query) {
            $query->whereDate('date', Carbon::today(config('app.timezone')));
        })
            ->select('id', 'name')
            ->get();
    }
}

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/', function (): RedirectResponse {

        return redirect()->to(route('dashboard'));
    })->name('home');

    Route::get('/dashboard', function () {
        $dashbaordService = new DashboardService();
        $sa = ShopAccount::with('currency:id,name')->select('id', 'amount', 'currency_id')->get();

        //  get all emplyess length 
        $employees = getEmployees();

        $transfersToShop = $dashbaordService->shopTransfers();

        $currencies = Currency::all(['id', 'name']);

        $reorderItemsCount = $dashbaordService->reOrderItemsCount();
        //  PRICE OF OVERALL PRODUCTS TRANSFERRED TO SHOP SINCE
        $totalAmountShopOwes = $dashbaordService->totalAmountShopOwes();

        $items = $dashbaordService->shopItems();
        // Total Cost of Available Items In Shop
        $totalAmountOfAvailableItems = $dashbaordService->totalCostOfAvailableItemsInShop();
        // TOTAL EXPENSES SO FAR
        $totalExpenses = $dashbaordService->totalExpenses();

        $todaysExpenses = $dashbaordService->todaysExpenses();
        $todayIncomes = $dashbaordService->todayIncomes();

        //  payments for today for custoemr loans
        $totalPayments = $dashbaordService->todaysRealPayments();
        // total of todays loan
        $totalLoans = $dashbaordService->todaysLoans();
        // $totalIncomes
        $overallLoans = $dashbaordService->totalOverallLoans();
        return Inertia::render('dashboard', compact('overallLoans','todayIncomes', 'sa', 'todaysExpenses', 'currencies', 'transfersToShop', 'employees', 'items', 'reorderItemsCount', 'totalAmountShopOwes', 'totalAmountOfAvailableItems', 'totalExpenses', 'totalPayments', 'totalLoans'));
    })->name('dashboard')->middleware('refuseFactoryClerk');

    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index')->middleware('superadmin');


    Route::get('/total-revenue-and-expenses/{currency}', function (string $currency) {
        $today = Carbon::today(config('app.timezone'));
        $startOftheDate = $today->startOfMonth()->subMonth()->subMonth();
        $expenses = Expense::with('currency:id,name')
            ->whereDate('date', '>', $startOftheDate)
            ->whereHas('currency', function ($q) use ($currency) {
                $q->where('name', $currency);
            })
            ->sum('amount');
        // 100 30
        //  X  Days
        $currentMonthDay = Carbon::today(config('app.timezone'))->dayOfMonth();
        $currentMonthDatePercent = (100 * $currentMonthDay) / Carbon::today(config('app.timezone'))->daysInMonth();

        $aveOfThreeMonths = $expenses / (2 + ($currentMonthDatePercent / 100));
        return response()->json($aveOfThreeMonths);
    })->middleware('refuseFactoryClerk');

    // ---------------------------------------------------------------------------------

    Route::get('/register', function () {


        if (User::query()->exists()) {
            Gate::authorize('manage-users');
        }

        return Inertia::render('auth/register', [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'roles' => Role::select('id', 'name')->get(),
        ]);
    })->name('register')->middleware('superadmin');

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
    })->name('register.store')->middleware('superadmin');

    Route::get('/stackholders', [RegisteredUserController::class, 'index'])->name('employees.index');
    Route::get('/logs', [LogController::class, 'index'])->name('logs.index');
    Route::resource('employees', EmployeeController::class)->except('index')->names('employees');
    Route::post('/employees/{employee}/attendance-toggle', [EmployeeController::class, 'toggleAttendance'])
        ->name('employees.attendance.toggle');

    Route::get('/employees/{employee}/salary-receipt/{salary}', [EmployeeController::class, 'salaryReceipt'])
        ->name('employees.salary.receipt');

    Route::post('/employees/{employee}/pay-salary', [EmployeeController::class, 'paySalary'])->name('pay.salary')
        ->name('employees.pay.salary');

    Route::get('/employees/{employee}/salary-record', [SalaryController::class, 'salaryRecord'])->name('emplyee-salary-record');
    Route::get('/employees/{employee}/attendance-record', [AttendanceController::class, 'attendanceRecord'])->name('emplyee-attendance-record');

    Route::middleware(['refuseFactoryClerk'])->group(function () {
        Route::get('/expenses/expenses-range', [ExpenseController::class, 'expensesRange'])->name('expenses.expenses-range');
        Route::resource('expenses', ExpenseController::class)->names('expenses');
        Route::resource('customers', CustomerController::class)->except('index')->names('customers');
        Route::put('/customers/status/{customer}', [CustomerController::class, 'status'])->name('custoemrs.status');

        Route::resource('sales', SaleController::class)->names('sales');
        Route::post('/sales/{sale}/invoice', [SaleController::class, 'createInvoice'])->name('sales.invoice.create');
        Route::get('/sales/{sale}/invoice/print', [SaleController::class, 'printInvoice'])->name('sales.invoice.print');
        Route::get('/sales/{sale}/returns/create', [SaleReturnController::class, 'create'])->name('sales.returns.create');
        Route::post('/sales/{sale}/returns', [SaleReturnController::class, 'store'])->name('sales.returns.store');

        Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
        Route::post('/payments', [PaymentController::class, 'store'])->name('payments.store');
        Route::get('/payments/{payment}/receipt', [PaymentController::class, 'receipt'])->name('payments.receipt');
    });



    Route::resource('suppliers', SupplierController::class)->names('suppliers');
    Route::get('/locations', [LocationController::class, 'index'])->name('locations.index');
    Route::post('/locations', [LocationController::class, 'store'])->name('locations.index');
    Route::put('/locations/{location}/toggle-is-active/{is_active}', [LocationController::class, 'update'])->name('locations.index');


    // ============================  Goods Receipt and Transfers Section =====================
    Route::resource('receipts', GoodsReceiptController::class)->names('receipts');
    Route::resource('items', ItemController::class)->names('items');
    Route::resource('transfers', TransferController::class)->names('items');
    Route::get('/transfers/{location}/create', [TransferController::class, 'create']);
    Route::get('/transfers/{location}/items/{item}', [TransferController::class, 'getItemBalance']);
    Route::resource('inventory-balances', InventoryBalanceController::class)->names('inventory-balances');
    Route::get('/inventory-movements', [InventoryMovementController::class, 'index'])->name('movements.index');
    Route::resource('boms', BOMController::class)->names('boms');

    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'read'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');

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

            $productionChart = $highProductionService->GenerateProductionChart($productionByCategory, $topProductionCategories);

            $pendingOrders = ProductionOrder::with('bom:id,category_id', 'bom.category:id,name', 'productionOutputs:id,production_order_id,quantity_produced')
                ->select('id', 'ordered_by', 'order_date', 'status', 'bom_id')
                ->where('status', 'pending')
                ->get();
            return Inertia::render('factory/home', compact('items', 'pendingOrders', 'productionChart', 'topProductionCategories'));
        })->name('factory');
        Route::get('/production-orders/junks', [ProductionOrderController::class, 'junks'])->name('orders.junks');
        Route::get('/proudction-orders/{production_order}', [ProductionOrderController::class, 'show'])
            ->name('orders.show-typo');

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
