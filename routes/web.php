<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\BarcodeController;
use App\Http\Controllers\BOMController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\FactoryDashboardController;
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
use App\Http\Controllers\SupplierPaymentController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\WasteController;
use App\Models\Currency;
use App\Models\Item;
use App\Models\ShopAccount;
use App\Services\DashboardService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\StackholderController;


// ---------------------------------------------------------------------------------

Route::get('/register', [UserManagementController::class, 'create'])->name('register');
Route::post('/register', [UserManagementController::class, 'store'])
    ->name('register.store');


Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/', function (): RedirectResponse {

        return redirect()->to(route('dashboard'));
    })->name('home');

    Route::get('/dashboard', function (DashboardService $dashboardService) {
        $sa = ShopAccount::with('currency:id,name')->select('id', 'amount', 'currency_id')->get();

        $businessDate = $dashboardService->currentPersianDate();
        $attendanceSummary = $dashboardService->todayAttendanceSummary();
        $transfersToShop = $dashboardService->shopTransfers();

        $currencies = Currency::all(['id', 'name']);

        $reorderItemsCount = $dashboardService->reOrderItemsCount();
        $totalTransferredValueToShop = $dashboardService->totalTransferredValueToShop();

        $items = $dashboardService->shopItems();
        $totalAmountOfAvailableItems = $dashboardService->totalCostOfAvailableItemsInShop();
        $totalExpenses = $dashboardService->totalExpenses();

        $todaysExpenses = $dashboardService->todaysExpenses();
        $todayIncomes = $dashboardService->todayIncomes();

        $totalPayments = $dashboardService->todaysRealPayments();
        // dd($totalPayments);
        $totalLoans = $dashboardService->todaysLoans();
        $overallLoans = $dashboardService->totalOverallLoans();

        return Inertia::render('dashboard', compact(
            'overallLoans',
            'todayIncomes',
            'sa',
            'todaysExpenses',
            'currencies',
            'transfersToShop',
            'businessDate',
            'attendanceSummary',
            'items',
            'reorderItemsCount',
            'totalTransferredValueToShop',
            'totalAmountOfAvailableItems',
            'totalExpenses',
            'totalPayments',
            'totalLoans',
        ));
    })->name('dashboard')->middleware('refuseFactoryClerk');



    Route::get('/reports/export', [ReportController::class, 'export'])
        ->name('reports.export')
        ->middleware('superadmin');
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index')->middleware('superadmin');

    Route::get('/total-revenue-and-expenses/{currency}', function (string $currency, DashboardService $dashboardService) {
        return response()->json($dashboardService->averageExpensesForCurrency($currency));
    })->middleware('refuseFactoryClerk');


    Route::get('/stackholders', [StackholderController::class, 'index'])->name('employees.index');
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
        Route::get('/sales/order/create', [ProductionOrderController::class, 'create'])->name('sales.order');
        Route::get('/expenses/expenses-range', [ExpenseController::class, 'expensesRange'])->name('expenses.expenses-range');
        Route::resource('expenses', ExpenseController::class)->names('expenses');
        Route::resource('customers', CustomerController::class)->except('index')->names('customers');
        Route::get('/customers/{customer}/invoices', [CustomerController::class, 'invoices'])->name('customers.invoices');
        Route::put('/customers/status/{customer}', [CustomerController::class, 'status'])->name('custoemrs.status');
        Route::put('/sales/{sale}/cancel', [SaleController::class, 'cancelSale'])->name('sales.cancel');
        Route::get('/sales/{sale}/invoice/print', [SaleController::class, 'printInvoice'])->name('sales.invoice.print');
        Route::get('/sales/most-sold-products', [SaleController::class, 'mostSold'])->name('sales.mostSold');
        Route::get('/sales/comments', [SaleController::class, 'comment'])->name('sales.comment');
        Route::patch('/sales/{sale}/notes', [SaleController::class, 'destroyNote'])->name('sales.destroyNote');
        Route::get('/sales/all', [SaleController::class, 'allSales'])->name('sales.all');
        Route::resource('sales', SaleController::class)->names('sales')->except(['update', 'edit']);
        Route::post('/sales/{sale}/invoice', [SaleController::class, 'createInvoice'])->name('sales.invoice.create');
        Route::get('sales/invoice/{invoice}/payments', [PaymentController::class, 'invoicePayments'])->name('invoices.payments');
        Route::get('/sales/{sale}/returns/create', [SaleReturnController::class, 'create'])->name('sales.returns.create');
        Route::post('/sales/{sale}/returns', [SaleReturnController::class, 'store'])->name('sales.returns.store');


        Route::get('/payments/all', [PaymentController::class, 'allPayments'])->name('payments.all');
        Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
        Route::post('/payments', [PaymentController::class, 'store'])->name('payments.store');
        Route::get('/payments/{payment}/receipt', [PaymentController::class, 'receipt'])->name('payments.receipt');
        Route::delete('/payments/{payment}', [PaymentController::class, 'destroy'])->name('payments.destroy');
        Route::resource('items', ItemController::class)->names('items');
    });


    Route::put('/suppliers/status/{supplier}', [SupplierController::class, 'status'])->name('suppliers.status');
    Route::resource('suppliers', SupplierController::class)->names('suppliers');
    Route::post('/supplier-payments', [SupplierPaymentController::class, 'store'])->name('supplier-payments.store');
    Route::get('/locations', [LocationController::class, 'index'])->name('locations.index');
    Route::post('/locations', [LocationController::class, 'store'])->name('locations.index');
    Route::put('/locations/{location}/toggle-is-active/{is_active}', [LocationController::class, 'update'])->name('locations.index');


    // ============================  Goods Receipt and Transfers Section =====================
    Route::resource('receipts', GoodsReceiptController::class)->names('receipts');
    Route::put('/transfers/{transfer}/status/{status}', [TransferController::class, 'changeStatus'])->name('transfers.status');
    Route::resource('transfers', TransferController::class)->names('transfers');
    Route::get('/transfers/{location}/create', [TransferController::class, 'create']);
    Route::get('/transfers/{location}/items/{item}', [TransferController::class, 'getItemBalance']);
    Route::resource('inventory-balances', InventoryBalanceController::class)->names('inventory-balances');
    Route::get('/inventory-movements', [InventoryMovementController::class, 'index'])->name('movements.index');
    Route::resource('boms', BOMController::class)->names('boms')->except('destroy');
    Route::put('/boms/{bom}/block', [BOMController::class, 'block'])->name('boms.block');

    // ALLCATING SECTION ROUTES:
    Route::post(
        '/supplier-payments/{supplierPayment}/allocations',
        [SupplierPaymentController::class, 'allocate']
    )->name('supplier-payments.allocate');

    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'read'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');
    Route::get('/barcode', [BarcodeController::class, 'index'])->name('barcode.index')->middleware(['superadmin']);
    Route::get('/barcode/image', [BarcodeController::class, 'show'])->name('barcode.image')->middleware('superadmin');
    Route::prefix('factory')->group(function () {
        Route::get('/home', FactoryDashboardController::class)
            ->name('factory');

        Route::get('/proudction-orders/{production_order}', [ProductionOrderController::class, 'show'])
            ->name('orders.show-typo');

        Route::get('/production-orders/junks', [ProductionOrderController::class, 'junks'])->name('orders.junks');
        Route::get('/production-orders/{production_order}/{status}/confirm-order-inputs', [ProductionInputController::class, 'confirmInputs'])->name('orders.confirm-inputs');
        Route::get('/production-orders/{production_order}/{status}/confirm-order-outputs', [ProductionInputController::class, 'confirmOutputs'])->name('orders.confirm-outputs');
        Route::put('/production-orders/{production_order}/{status}/confirm-order-outputs', [ProductionInputController::class, 'updateOutputs'])->name('orders.update-outputs');
        Route::put('/production-inputs/{production_order}', [ProductionInputController::class, 'updateInputs'])->name('order-inputs.update');

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
