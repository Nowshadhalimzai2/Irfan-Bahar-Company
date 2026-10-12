<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\Item;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\Transfer;
use App\Models\TransferLine;
use Carbon\Carbon;
use DateTimeZone;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Morilog\Jalali\Jalalian;

class DashboardService
{
    public function __construct(private PersianDateConverter $persianDateConverter) {}

    private const REORDER_THRESHOLD = 10;
    private const SHOP_TRANSFER_LIMIT = 3;
    private const CASH_PAYMENT_METHOD = 'cash';
    private const SHOP_LOCATION = 'shop';

    public function totalExpenses(): Collection
    {
        return Expense::query()
            ->selectRaw('currency_id, SUM(amount) as total_amount')
            ->groupBy('currency_id')
            ->pluck('total_amount', 'currency_id');
    }

    public function todayIncomes(): array
    {
        $todayRange = $this->todayRange();
        $payments = $this->todayCashPayments();
        $sales = Sale::query()
            ->doesntHave('invoice')
            ->selectRaw('currency_id, SUM(amount_paid) as total_amount')
            ->whereNotIn('status', ['draft', 'cancelled'])
            ->whereRaw('COALESCE(sold_at, created_at) BETWEEN ? AND ?', [$todayRange['start'], $todayRange['end']])
            ->groupBy('currency_id')
            ->pluck('total_amount', 'currency_id');

        return $sales
            ->mapWithKeys(fn($amount, $currencyId) => [
                $currencyId => $amount + ($payments[$currencyId] ?? 0),
            ])
            ->merge($payments->diffKeys($sales))
            ->all();
    }

    public function todaysExpenses(): Collection
    {
        return Expense::query()
            ->selectRaw('currency_id, SUM(amount) as total_amount')
            ->whereDate('date', $this->today())
            ->groupBy('currency_id')
            ->pluck('total_amount', 'currency_id');
    }

    public function totalOverallLoans(): Collection
    {
        return $this->loansByCurrency();
    }

    public function todaysRealPayments(): Collection
    {
        $todayRange = $this->todayRange();

        return Payment::query()
            ->selectRaw('currency_id, SUM(amount) as total_amount')
            ->whereBetween('paid_at', [$todayRange['start'], $todayRange['end']])
            ->whereHas('invoice.sale', fn($query) => $query->whereNotIn('status', ['draft', 'cancelled']))
            ->groupBy('currency_id')
            ->pluck('total_amount', 'currency_id');
    }

    public function todaysLoans(): Collection
    {
        return $this->loansByCurrency($this->today());
    }

    public function todayAttendanceSummary(): array
    {
        $employees = Employee::query()
            ->where('status', true)
            ->with(['attendances' => fn($query) => $query
                ->whereDate('date', $this->today())
                ->select('employee_id', 'is_present')])
            ->get(['id']);

        $present = $employees->filter(fn(Employee $employee) => $employee->attendances->first()?->is_present === true)->count();
        $absent = $employees->filter(fn(Employee $employee) => $employee->attendances->first()?->is_present === false)->count();

        return [
            'total' => $employees->count(),
            'present' => $present,
            'absent' => $absent,
            'unrecorded' => $employees->count() - $present - $absent,
        ];
    }

    public function currentPersianDate(): string
    {
        return Jalalian::now(new DateTimeZone(config('app.timezone')))->format('Y/m/d');
    }

    public function averageExpensesForCurrency(string $currency): float
    {
        $timezone = new DateTimeZone(config('app.timezone'));
        $persianToday = Jalalian::now($timezone);
        $monthStart = Jalalian::fromFormat(
            'Y/m/d',
            sprintf('%04d/%02d/01', $persianToday->getYear(), $persianToday->getMonth()),
            $timezone,
        );
        $rangeStart = $monthStart->subMonths(2)->toCarbon()->toDateString();
        $todayRange = $this->todayRange();
        $rangeEnd = $todayRange['end']->toDateString();
        $expenses = (float) Expense::query()
            ->whereHas('currency', fn($query) => $query->where('name', $currency))
            ->whereBetween('date', [$rangeStart, $rangeEnd])
            ->sum('amount');
        $currentMonthProgress = $persianToday->getDay() / $persianToday->getDaysOf($persianToday->getMonth());

        return $expenses / (2 + $currentMonthProgress);
    }

    public function shopTransfers(): Collection
    {
        return Transfer::query()
            ->with([
                'destination:id,name',
                'transferLines:id,transfer_id,item_id,unit_price,quantity',
                'transferLines.item:id,category_id,default_sale_price',
                'transferLines.item.category:id,name',
            ])
            ->whereHas('destination', fn($query) => $query->where('name', self::SHOP_LOCATION))
            ->where('status', 'completed')
            ->latest()
            ->limit(self::SHOP_TRANSFER_LIMIT)
            ->get();
    }

    public function reOrderItemsCount(): int
    {
        return Item::query()
            ->whereHas(
                'inventoryBalances',
                fn($query) =>
                $query->where('quantity_on_hand', '<', self::REORDER_THRESHOLD)
            )
            ->withCount([
                'inventoryBalances as reorder_inventory_balances_count' => fn($query) =>
                $query->where('quantity_on_hand', '<', self::REORDER_THRESHOLD),
            ])
            ->get()
            ->sum('reorder_inventory_balances_count');
    }

    public function totalTransferredValueToShop(): float
    {
        return (float) TransferLine::query()
            ->join('transfers', 'transfers.id', '=', 'transfer_lines.transfer_id')
            ->join('locations as source_locations', 'source_locations.id', '=', 'transfers.source_id')
            ->join('locations as destination_locations', 'destination_locations.id', '=', 'transfers.destination_id')
            ->where('source_locations.name', 'factory')
            ->where('destination_locations.name', self::SHOP_LOCATION)
            ->where('transfers.status', 'completed')
            ->sum(DB::raw('transfer_lines.quantity * transfer_lines.unit_price'));
    }

    public function shopItems(): Collection
    {
        return Item::query()
            ->with([
                'inventoryBalances' => fn($query) => $query
                    ->select('id', 'item_id', 'location_id', 'quantity_on_hand', 'reserved')
                    ->whereHas(
                        'location',
                        fn($location) =>
                        $location->where('name', self::SHOP_LOCATION)
                    ),
            ])
            ->whereHas(
                'inventoryBalances.location',
                fn($query) =>
                $query->where('name', self::SHOP_LOCATION)
            )
            ->get();
    }

    public function totalCostOfAvailableItemsInShop(): float
    {
        return (float) $this->shopItems()
            ->flatMap(fn($item) => $item->inventoryBalances->map(
                fn($balance) => $item->default_sale_price * max(0, $balance->quantity_on_hand - $balance->reserved)
            ))
            ->sum();
    }

    private function today(): Carbon
    {
        return $this->todayRange()['start'];
    }

    /** @return array{start: Carbon, end: Carbon} */
    private function todayRange(): array
    {
        return $this->persianDateConverter->toGregorianRange(
            $this->currentPersianDate(),
            'date',
            new DateTimeZone(config('app.timezone')),
        );
    }

    private function todayCashPayments(): Collection
    {
        $todayRange = $this->todayRange();

        return Payment::query()
            ->selectRaw('currency_id, SUM(amount) as total_amount')
            ->whereBetween('paid_at', [$todayRange['start'], $todayRange['end']])
            ->where('method', self::CASH_PAYMENT_METHOD)
            ->whereHas('invoice.sale', fn($query) => $query->whereNotIn('status', ['draft', 'cancelled']))
            ->groupBy('currency_id')
            ->pluck('total_amount', 'currency_id');
    }

    private function loansByCurrency(?Carbon $date = null): Collection
    {
        $invoices = Invoice::query()
            ->with([
                'payments:id,invoice_id,amount',
                'sale:id,currency_id,status,amount_paid,after_descount_total,sold_at,created_at',
                'sale.saleReturns:id,sale_id,total,refund_amount',
            ])
            ->whereHas('sale', function ($query) use ($date): void {
                $query->whereNotIn('status', ['draft', 'cancelled']);

                if ($date) {
                    $query->whereRaw('COALESCE(sales.sold_at, sales.created_at) BETWEEN ? AND ?', [
                        $date->copy()->startOfDay(),
                        $date->copy()->endOfDay(),
                    ]);
                }
            })
            ->get();

        return $invoices->reduce(function (Collection $balances, Invoice $invoice): Collection {
            $currencyId = $invoice->sale?->currency_id;

            if ($currencyId !== null) {
                $balances->put($currencyId, ($balances->get($currencyId, 0) + $invoice->financialSummary()['due']));
            }

            return $balances;
        }, collect());
    }
}
