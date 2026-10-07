<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\Sale;
use App\Models\Supplier;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StackholderController extends Controller
{
    public function index()
    {
        $suppliers = Supplier::select(['id', 'name', 'phone', 'email', 'address', 'status'])->get();
        $users = User::with('role:id,name')
            ->select(['id', 'name', 'email', 'role_id', 'status'])
            ->get();

        $startOfMonth = now()->startOfMonth()->toDateString();
        $endOfMonth = now()->endOfMonth()->toDateString();

        $this->ensureTodayAttendance();

        $employees = Employee::query()
            ->select(['id', 'name', 'position', 'salary', 'status'])
            ->with('todayAttendance')
            ->withCount([
                'attendances as present_days' => fn($query) => $query
                    ->where('is_present', true)
                    ->whereBetween('date', [$startOfMonth, $endOfMonth]),
                'attendances as absent_days' => fn($query) => $query
                    ->where('is_present', false)
                    ->whereBetween('date', [$startOfMonth, $endOfMonth]),
            ])
            ->orderBy('id')
            ->get();

        $customers = Customer::with([
            'sales' => fn($query) => $query
                ->where('status', '!=', 'cancelled')
                ->select(['id', 'status', 'after_descount_total', 'amount_paid', 'customer_id', 'currency_id']),
            'sales.currency:id,name',
            'sales.saleReturns:id,sale_id,total,refund_amount',
            'sales.invoice:id,sale_id,total,currency',
            'sales.invoice.payments:id,invoice_id,amount',
            'sales.invoice.sale:id,amount_paid',
            'sales.invoice.sale.saleReturns:id,sale_id,total,refund_amount',
        ])->select('id', 'name', 'nick_name', 'phone', 'is_active')->get();

        $customers = $customers->map(fn(Customer $customer) => [
            'id' => $customer->id,
            'name' => $customer->name,
            'nick_name' => $customer->nick_name,
            'phone' => $customer->phone,
            'is_active' => $customer->is_active,
            'balances' => $customer->sales->reduce(function (array $balances, Sale $sale) {
                if (($sale->status ?? null) === 'cancelled') {
                    return $balances;
                }

                if ($sale->invoice) {
                    $balance = $sale->invoice->financialSummary()['due'];
                    $currency = $sale->invoice->currency;
                } else {
                    $returnTotal = (float) $sale->saleReturns->sum('total');
                    $refundedAmount = (float) $sale->saleReturns->sum('refund_amount');
                    $netTotal = max(0, (float) $sale->after_descount_total - $returnTotal);
                    $netPaid = max(0, (float) $sale->amount_paid - $refundedAmount);
                    $balance = max(0, $netTotal - $netPaid);
                    $currency = $sale->currency?->name ?? 'AFG';
                }

                $balances[$currency] = ($balances[$currency] ?? 0) + $balance;

                return $balances;
            }, []),
        ]);

        $stackholders = [];
        $user = Auth::user();
        if ($user instanceof User) {
            if ($user->hasRole('super_admin') || $user->hasRole('admin')) {
                $stackholders[] = [
                    'customers' => $customers,
                    'employees' => $employees,
                    'users' => $users,
                    'suppliers' => $suppliers,
                ];
            } elseif ($user->hasRole('shop_clerk')) {
                $stackholders[] = [
                    'customers' => $customers,
                    'employees' => $employees,
                    'suppliers' => $suppliers,
                ];
            } elseif ($user->hasRole('factory_clerk')) {
                $stackholders[] = ['suppliers' => $suppliers];
            }
        }

        return Inertia::render('stackholder/index', [
            'stackholders' => $stackholders,
        ]);
    }

    protected function ensureTodayAttendance(): void
    {
        $today = today();
        $existingEmployeeIds = Attendance::where('date', $today)
            ->pluck('employee_id')
            ->toArray();

        $missingEmployeeIds = Employee::whereNotIn('id', $existingEmployeeIds)
            ->pluck('id');

        if ($missingEmployeeIds->isNotEmpty()) {
            $rows = $missingEmployeeIds->map(fn($id) => [
                'employee_id' => $id,
                'date' => $today,
                'is_present' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ])->toArray();

            Attendance::insert($rows);
        }
    }
}