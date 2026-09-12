<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Expense;
use App\Models\InventoryMovement;
use App\Models\Log;
use App\Models\Payment;
use App\Models\ProductionOrder;
use App\Models\Sale;
use App\Models\SaleReturn;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->string('period')->toString() === 'monthly' ? 'monthly' : 'daily';
        $selectedDate = $request->date('date') ?? Carbon::today(config('app.timezone'));

        if ($period === 'monthly') {
            $start = $selectedDate->copy()->startOfMonth();
            $end = $selectedDate->copy()->endOfMonth();
        } else {
            $start = $selectedDate->copy()->startOfDay();
            $end = $selectedDate->copy()->endOfDay();
        }
        $startDate = $start->toDateString();
        $endDate = $end->toDateString();

        $sales = Sale::query()
            ->whereNotIn('status', ['draft', 'cancelled'])
            ->whereBetween('sold_at', [$start, $end]);
        $expenses = Expense::query()->with('currency:id,name')->whereBetween('date', [$startDate, $endDate]);

        $salesTotal = (float) $sales->sum('after_descount_total');
        $expensesTotal = (float) $expenses->sum('amount');
        $paymentsTotal = (float) Payment::query()->whereBetween('paid_at', [$start, $end])->sum('amount');
        $refundsTotal = (float) SaleReturn::query()->whereBetween('requested_at', [$start, $end])->sum('refund_amount');

        $dailyRows = $sales->get(['sold_at', 'after_descount_total'])
            ->groupBy(fn ($sale) => Carbon::parse($sale->sold_at)->toDateString())
            ->map(fn ($rows, $date) => [
                'label' => Carbon::parse($date)->format('M j'),
                'date' => $date,
                'sales' => (float) $rows->sum('after_descount_total'),
                'count' => $rows->count(),
            ])->values();

        $expenseByCurrency = $expenses->get()
            ->groupBy(fn ($expense) => $expense->currency?->name ?? 'Unknown')
            ->map(fn ($rows, $currency) => [
                'currency' => $currency,
                'amount' => (float) $rows->sum('amount'),
                'count' => $rows->count(),
            ])->values();

        $attendance = Attendance::query()
            ->whereBetween('date', [$startDate, $endDate])
            ->selectRaw('is_present, COUNT(*) as total')
            ->groupBy('is_present')
            ->pluck('total', 'is_present');

        $movementSummary = InventoryMovement::query()
            ->whereBetween('occured_at', [$startDate, $endDate])
            ->selectRaw('movement_type, COUNT(*) as movements, SUM(quantity) as quantity')
            ->groupBy('movement_type')
            ->orderByDesc('movements')
            ->get()
            ->map(fn ($row) => [
                'type' => $row->movement_type,
                'movements' => (int) $row->movements,
                'quantity' => (float) $row->quantity,
            ])->values();

        $productionSummary = ProductionOrder::query()
            ->whereBetween('order_date', [$startDate, $endDate])
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => ['status' => $row->status, 'total' => (int) $row->total])
            ->values();

        return Inertia::render('reports/index', [
            'filters' => [
                'period' => $period,
                'date' => $selectedDate->toDateString(),
            ],
            'range' => [
                'start' => $startDate,
                'end' => $endDate,
                'label' => $period === 'monthly' ? $start->format('F Y') : $start->format('F j, Y'),
            ],
            'summary' => [
                'sales' => ['total' => $salesTotal, 'count' => $sales->count()],
                'expenses' => ['total' => $expensesTotal, 'count' => $expenses->count()],
                'payments' => ['total' => $paymentsTotal],
                'refunds' => ['total' => $refundsTotal],
                'attendance' => [
                    'present' => (int) $attendance->get(1, 0),
                    'absent' => (int) $attendance->get(0, 0),
                ],
                'movements' => (int) InventoryMovement::query()->whereBetween('occured_at', [$startDate, $endDate])->count(),
                'production' => (int) ProductionOrder::query()->whereBetween('order_date', [$startDate, $endDate])->count(),
                'activity' => (int) Log::query()->whereBetween('activity_date', [$startDate, $endDate])->count(),
            ],
            'dailySales' => $dailyRows,
            'expenseByCurrency' => $expenseByCurrency,
            'movementSummary' => $movementSummary,
            'productionSummary' => $productionSummary,
        ]);
    }
}