<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Item;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\Transfer;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class DashboardService
{
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
        $payments = $this->todayCashPayments();
        $sales = Sale::query()
            ->doesntHave('invoice')
            ->selectRaw('currency_id, SUM(amount_paid) as total_amount')
            ->whereDate('sold_at', $this->today())
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
        $sales = Sale::query()
            ->has('invoice')
            ->selectRaw('currency_id, SUM(after_descount_total) as total_amount')
            ->groupBy('currency_id')
            ->pluck('total_amount', 'currency_id');

        $payments = Payment::query()
            ->selectRaw('currency_id, SUM(amount) as total_amount')
            ->groupBy('currency_id')
            ->pluck('total_amount', 'currency_id');

        return $sales->keys()
            ->merge($payments->keys())
            ->unique()
            ->mapWithKeys(fn($currencyId) => [
                $currencyId => ($sales[$currencyId] ?? 0) - ($payments[$currencyId] ?? 0),
            ]);
    }

    public function todaysRealPayments(): Collection
    {
        $invoiceIds = Payment::query()
            ->select('invoice_id')
            ->whereDate('paid_at',$this->today())
            ->groupBy('invoice_id')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('invoice_id');
        $invoces= Invoice::query()->with('sale:id,amount_paid')->whereIn('id',[...$invoiceIds])->get();
        $totalSalePaid= $invoces->sum(fn(Invoice $inv)=>$inv->sale->amount_paid);
        $todaysPayment= Payment::query()
            ->selectRaw('currency_id, SUM(amount) as total_amount')
            ->whereIn('invoice_id', $invoiceIds)
            // ->where('method',self::CASH_PAYMENT_METHOD)
            ->whereDate('paid_at', $this->today())
            ->groupBy('currency_id')
            ->pluck('total_amount', 'currency_id');
            return $todaysPayment;
            }

    public function todaysLoans(): Collection
    {
        return Sale::query()
            ->selectRaw('currency_id, SUM(after_descount_total) - SUM(amount_paid) as total_loan')
            ->whereDate('sold_at', $this->today())
            ->groupBy('currency_id')
            ->pluck('total_loan', 'currency_id');
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

    public function totalAmountShopOwes(): float
    {
        return (float) $this->shopTransfers()
            ->flatMap->transferLines
            ->sum(fn($line) => $line->item->default_sale_price * $line->quantity);
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
                fn($balance) => $item->default_sale_price * $balance->quantity_on_hand
            ))
            ->sum();
    }

    private function today(): Carbon
    {
        return Carbon::today(config('app.timezone'));
    }

    private function todayCashPayments(): Collection
    {
        return Payment::query()
            ->selectRaw('currency_id, SUM(amount) as total_amount')
            ->whereDate('paid_at', $this->today())
            ->where('method', self::CASH_PAYMENT_METHOD)
            ->groupBy('currency_id')
            ->pluck('total_amount', 'currency_id');
    }
}
