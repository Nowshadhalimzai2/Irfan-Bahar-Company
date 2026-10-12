<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Expense;
use App\Models\GoodsReceiptLine;
use App\Models\InventoryBalance;
use App\Models\InventoryMovement;
use App\Models\Log;
use App\Models\Payment;
use App\Models\ProductionOrder;
use App\Models\ProductionOutput;
use App\Models\Sale;
use App\Models\SaleLine;
use App\Models\SaleReturn;
use App\Models\SaleReturnLine;
use App\Models\TransferLine;
use Carbon\Carbon;
use DateTimeZone;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Morilog\Jalali\Jalalian;

class ReportService
{
    public function __construct(private PersianDateConverter $persianDateConverter) {}

    /**
     * Consolidated reporting for the factory + shop business.
     *
     * Internal factory-to-shop transfers are visible for operational review but are
     * intentionally excluded from the consolidated external revenue and gross profit
     * metrics used for customer-facing business reporting.
     */
    public function buildForPeriod(string $period, Carbon|string $date, array $filters = []): array
    {
        $timezone = new DateTimeZone(config('app.timezone'));
        $requestedDate = $date instanceof Carbon ? $date->copy()->toDateString() : trim($date);
        $today = Jalalian::now($timezone);
        $preset = $filters['preset'] ?? 'custom';
        if ($preset === 'today') {
            $dateRange = $this->persianDateConverter->toGregorianRange($today->format('Y/m/d'), 'date', $timezone);
        } elseif ($preset === 'yesterday') {
            $dateRange = $this->persianDateConverter->toGregorianRange($today->subDay()->format('Y/m/d'), 'date', $timezone);
        } elseif ($preset === 'this_month') {
            $dateRange = $this->persianDateConverter->toGregorianRange($today->format('Y/m'), 'month', $timezone);
        } elseif ($preset === 'last_month') {
            $dateRange = $this->persianDateConverter->toGregorianRange($today->subMonths(1)->format('Y/m'), 'month', $timezone);
        } elseif ($date instanceof Carbon) {
            $selectedDate = $date->copy()->setTimezone($timezone);
            $dateRange = $period === 'monthly'
                ? [$selectedDate->copy()->startOfMonth(), $selectedDate->copy()->endOfMonth()]
                : [$selectedDate->copy()->startOfDay(), $selectedDate->copy()->endOfDay()];
        } elseif (str_contains($requestedDate, '/')) {
            $dateRange = $this->persianDateConverter->toGregorianRange($requestedDate, $period === 'monthly' ? 'month' : 'date', $timezone);
        } else {
            // Keep compatibility for internal callers that still pass ISO dates.
            $selectedDate = Carbon::parse($requestedDate, $timezone);
            $dateRange = $period === 'monthly'
                ? [$selectedDate->copy()->startOfMonth(), $selectedDate->copy()->endOfMonth()]
                : [$selectedDate->copy()->startOfDay(), $selectedDate->copy()->endOfDay()];
        }

        [$start, $end] = array_values($dateRange);
        $selectedDate = $start->copy();
        $startDate = $start->toDateString();
        $endDate = $end->toDateString();
        $monthRange = ($period === 'monthly' && $preset === 'custom') || in_array($preset, ['this_month', 'last_month'], true);
        $startPersianDate = Jalalian::fromCarbon($start)->format('Y/m/d');
        $endPersianDate = Jalalian::fromCarbon($end)->format('Y/m/d');
        $selectedPersianDate = $period === 'monthly'
            ? Jalalian::fromCarbon($start)->format('Y/m')
            : $startPersianDate;

        $salesQuery = $this->applySaleFilters(
            Sale::query()->whereNotIn('status', ['draft', 'cancelled']),
            $filters,
        );

        $salesQuery->whereRaw('COALESCE(sold_at, created_at) BETWEEN ? AND ?', [$start->copy()->startOfDay(), $end->copy()->endOfDay()]);
        $grossSalesTotal = (float) $salesQuery->sum('after_descount_total');
        $salesCount = (int) $salesQuery->count();

        $returnsQuery = SaleReturn::query();

        $returnsQuery->where(function ($query) use ($start, $end) {
            $query->whereBetween('refunded_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
                ->orWhereBetween('received_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
                ->orWhereBetween('requested_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()]);
        });
        if (! empty($filters['customer'])) {
            $returnsQuery->whereHas('sale', fn (Builder $query) => $this->applySaleFilters($query, ['customer' => $filters['customer']]));
        }
        if (! empty($filters['product']) || ! empty($filters['category'])) {
            $returnsQuery->whereHas('lines.item', fn (Builder $query) => $query
                ->when(! empty($filters['product']), fn (Builder $itemQuery) => $itemQuery->where('id', $filters['product']))
                ->when(! empty($filters['category']), fn (Builder $itemQuery) => $itemQuery->where('category_id', $filters['category'])));
        }

        $returnsTotal = (float) $returnsQuery->sum('refund_amount');
        $salesTotal = $grossSalesTotal - $returnsTotal;

        $costOfGoodsSoldQuery = SaleLine::query()
            ->join('sales', 'sales.id', '=', 'sale_lines.sale_id')
            ->whereNotIn('sales.status', ['draft', 'cancelled'])
            ->when(! empty($filters['product']), fn ($query) => $query->where('sale_lines.item_id', $filters['product']))
            ->when(! empty($filters['category']), fn ($query) => $query->whereHas('item', fn (Builder $itemQuery) => $itemQuery->where('category_id', $filters['category'])));
        if (! empty($filters['customer'])) {
            $costOfGoodsSoldQuery->whereHas('sale', fn (Builder $query) => $this->applySaleFilters($query, ['customer' => $filters['customer']]));
        }

        $costOfGoodsSoldQuery->whereRaw('COALESCE(sales.sold_at, sales.created_at) BETWEEN ? AND ?', [$start->copy()->startOfDay(), $end->copy()->endOfDay()]);

        $costOfGoodsSold = (float) $costOfGoodsSoldQuery->sum(DB::raw('sale_lines.quantity * sale_lines.unit_cost'));

        $returnedGoodsCostQuery = SaleReturnLine::query()
            ->join('sale_returns', 'sale_returns.id', '=', 'sale_return_lines.sale_return_id')
            ->join('sale_lines', 'sale_lines.id', '=', 'sale_return_lines.sale_line_id')
            ->when(! empty($filters['product']), fn ($query) => $query->where('sale_return_lines.item_id', $filters['product']))
            ->when(! empty($filters['category']), fn ($query) => $query->join('items as returned_items', 'returned_items.id', '=', 'sale_return_lines.item_id')->where('returned_items.category_id', $filters['category']))
            ->when(! empty($filters['customer']), fn ($query) => $query->whereHas('saleReturn.sale', fn (Builder $saleQuery) => $this->applySaleFilters($saleQuery, ['customer' => $filters['customer']])));

        $returnedGoodsCostQuery->where(function ($query) use ($start, $end) {
            $query->whereBetween('sale_returns.refunded_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
                ->orWhereBetween('sale_returns.received_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
                ->orWhereBetween('sale_returns.requested_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()]);
        });

        $returnedGoodsCost = (float) $returnedGoodsCostQuery->sum(DB::raw('sale_return_lines.quantity * sale_lines.unit_cost'));

        $adjustedCostOfGoodsSold = max($costOfGoodsSold - $returnedGoodsCost, 0);
        $grossProfit = $salesTotal - $adjustedCostOfGoodsSold;

        $rawMaterialPurchaseCost = (float) GoodsReceiptLine::query()
            ->join('goods_receipts', 'goods_receipts.id', '=', 'goods_receipt_lines.receipt_id')
            ->whereBetween('goods_receipts.received_at', [$startDate, $endDate])
            ->when(! empty($filters['vendor']), fn ($query) => $query->where('goods_receipts.supplier_id', $filters['vendor']))
            ->sum(DB::raw('goods_receipt_lines.quantity * goods_receipt_lines.unit_cost'));

        $productionOutputQuantity = (float) ProductionOutput::query()
            ->join('production_orders', 'production_orders.id', '=', 'production_outputs.production_order_id')
            ->where('production_orders.status', 'completed')
            ->whereBetween('production_orders.order_date', [$startDate, $endDate])
            ->sum('quantity_produced');
        $productionOutputCost = (float) ProductionOutput::query()
            ->join('production_orders', 'production_orders.id', '=', 'production_outputs.production_order_id')
            ->join('items', 'items.id', '=', 'production_outputs.product_id')
            ->where('production_orders.status', 'completed')
            ->whereBetween('production_orders.order_date', [$startDate, $endDate])
            ->selectRaw('SUM(quantity_produced * items.default_sale_price) as total')
            ->value('total');

        $productionOrdersCount = (int) ProductionOrder::query()
            ->whereBetween('order_date', [$startDate, $endDate])
            ->count();

        $internalTransferValue = (float) TransferLine::query()
            ->join('transfers', 'transfers.id', '=', 'transfer_lines.transfer_id')
            ->join('locations as source_locations', 'source_locations.id', '=', 'transfers.source_id')
            ->join('locations as destination_locations', 'destination_locations.id', '=', 'transfers.destination_id')
            ->whereBetween('transfers.transferred_at', [$startDate, $endDate])
            ->where('source_locations.name', 'factory')
            ->where('destination_locations.name', 'shop')
            ->where('transfers.status', 'completed')
            ->sum(DB::raw('transfer_lines.quantity * transfer_lines.unit_price'));

        $shopStockValue = (float) InventoryBalance::query()
            ->join('items', 'items.id', '=', 'inventory_balances.item_id')
            ->join('locations', 'locations.id', '=', 'inventory_balances.location_id')
            ->where('locations.name', 'shop')
            ->sum(DB::raw('inventory_balances.quantity_on_hand * items.default_sale_price'));

        $factoryStockValue = (float) InventoryBalance::query()
            ->join('items', 'items.id', '=', 'inventory_balances.item_id')
            ->join('locations', 'locations.id', '=', 'inventory_balances.location_id')
            ->where('locations.name', 'factory')
            ->sum(DB::raw('inventory_balances.quantity_on_hand * items.default_sale_price'));

        $lowStockItems = InventoryBalance::query()
            ->fromSub(
                InventoryBalance::query()
                    ->selectRaw('item_id, sum(quantity_on_hand - reserved) as available_qty')
                    ->groupBy('item_id')
                    ->havingRaw('sum(quantity_on_hand - reserved) < ?', [10]),
                'low_stock'
            );

        $dailyRows = $salesQuery
            ->get(['sold_at', 'created_at', 'after_descount_total'])
            ->groupBy(fn ($sale) => Carbon::parse($sale->sold_at ?? $sale->created_at)->toDateString())
            ->map(fn ($rows, $date) => [
                'label' => Jalalian::fromCarbon(Carbon::parse($date))->format('m/d'),
                'date' => $date,
                'sales' => (float) $rows->sum('after_descount_total'),
                'count' => $rows->count(),
            ])
            ->values();

        $expenseByCurrency = Expense::query()
            ->with('currency:id,name')
            ->whereBetween('date', [$startDate, $endDate])
            ->get()
            ->groupBy(fn ($expense) => $expense->currency?->name ?? 'Unknown')
            ->map(fn ($rows, $currency) => [
                'currency' => $currency,
                'amount' => (float) $rows->sum('amount'),
                'count' => $rows->count(),
            ])
            ->values();

        $salesByCurrencyQuery = $this->applySaleFilters(
            Sale::query()->with('currency:id,name')->whereNotIn('status', ['draft', 'cancelled']),
            $filters,
        );

        $salesByCurrencyQuery->whereRaw('COALESCE(sold_at, created_at) BETWEEN ? AND ?', [$start->copy()->startOfDay(), $end->copy()->endOfDay()]);

        $salesByCurrency = $salesByCurrencyQuery->get()
            ->groupBy(fn ($sale) => $sale->currency?->name ?? 'Unknown')
            ->map(fn ($sales, $currency) => [
                'currency' => $currency,
                'total' => (float) $sales->sum('after_descount_total'),
                'count' => $sales->count(),
            ])
            ->values();

        $returnsByCurrencyQuery = SaleReturn::query();

        $returnsByCurrencyQuery->where(function ($query) use ($start, $end) {
            $query->whereBetween('refunded_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
                ->orWhereBetween('received_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
                ->orWhereBetween('requested_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()]);
        });
        if (! empty($filters['customer'])) {
            $returnsByCurrencyQuery->whereHas('sale', fn (Builder $query) => $this->applySaleFilters($query, ['customer' => $filters['customer']]));
        }
        if (! empty($filters['product']) || ! empty($filters['category'])) {
            $returnsByCurrencyQuery->whereHas('lines.item', fn (Builder $query) => $query
                ->when(! empty($filters['product']), fn (Builder $itemQuery) => $itemQuery->where('id', $filters['product']))
                ->when(! empty($filters['category']), fn (Builder $itemQuery) => $itemQuery->where('category_id', $filters['category'])));
        }

        $returnsByCurrency = $returnsByCurrencyQuery->get()
            ->groupBy(fn ($return) => $return->currency ?? 'Unknown')
            ->map(fn ($returns, $currency) => [
                'currency' => $currency,
                'total' => (float) $returns->sum('refund_amount'),
                'count' => $returns->count(),
            ])
            ->values();

        $combinedCurrencyKeys = collect($salesByCurrency)->pluck('currency')
            ->merge(collect($returnsByCurrency)->pluck('currency'))
            ->merge(collect($expenseByCurrency)->pluck('currency'))
            ->unique()
            ->values();

        $currencySummary = $combinedCurrencyKeys->map(function ($currency) use ($salesByCurrency, $returnsByCurrency, $expenseByCurrency) {
            $sales = collect($salesByCurrency)->firstWhere('currency', $currency);
            $returns = collect($returnsByCurrency)->firstWhere('currency', $currency);
            $expenses = collect($expenseByCurrency)->firstWhere('currency', $currency);

            return [
                'currency' => $currency,
                'sales_total' => (float) ($sales['total'] ?? 0),
                'refund_total' => (float) ($returns['total'] ?? 0),
                'net_total' => (float) (($sales['total'] ?? 0) - ($returns['total'] ?? 0)),
                'expenses_total' => (float) ($expenses['amount'] ?? 0),
                'sales_count' => (int) ($sales['count'] ?? 0),
                'refund_count' => (int) ($returns['count'] ?? 0),
                'expense_count' => (int) ($expenses['count'] ?? 0),
            ];
        })->values();

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
            ])
            ->values();

        $productionSummary = ProductionOrder::query()
            ->whereBetween('order_date', [$startDate, $endDate])
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => ['status' => $row->status, 'total' => (int) $row->total])
            ->values();

        $topProducts = SaleLine::query()
            ->join('sales', 'sales.id', '=', 'sale_lines.sale_id')
            ->join('items', 'items.id', '=', 'sale_lines.item_id')
            ->whereNotIn('sales.status', ['draft', 'cancelled'])
            ->when(! empty($filters['product']), fn ($query) => $query->where('sale_lines.item_id', $filters['product']))
            ->when(! empty($filters['category']), fn ($query) => $query->where('items.category_id', $filters['category']))
            ->whereRaw('COALESCE(sales.sold_at, sales.created_at) BETWEEN ? AND ?', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->selectRaw('items.name as name, SUM(sale_lines.line_total) as total, SUM(sale_lines.quantity) as quantity')
            ->groupBy('items.id', 'items.name')
            ->orderByDesc('total')
            ->limit(6)
            ->get()
            ->map(fn ($row) => ['name' => $row->name, 'total' => (float) $row->total, 'quantity' => (float) $row->quantity])
            ->values();

        $customerSales = Sale::query()
            ->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
            ->selectRaw("
        COALESCE(
            NULLIF(customers.name, ''),
            NULLIF(sales.customer_name, ''),
            'Walk-in'
        ) AS customer,
        SUM(sales.after_descount_total) AS total,
        COUNT(*) AS orders
    ")
            ->whereNotIn('sales.status', ['draft', 'cancelled'])
            ->when(! empty($filters['customer']), fn ($query) => $query->where(function ($customerQuery) use ($filters) {
                if (ctype_digit((string) $filters['customer'])) {
                    $customerQuery->where('sales.customer_id', $filters['customer']);
                } else {
                    $customerQuery->where('sales.customer_name', 'like', '%'.$filters['customer'].'%');
                }
            }))
            ->when(! empty($filters['product']), fn ($query) => $query->whereExists(function ($subquery) use ($filters) {
                $subquery->selectRaw('1')->from('sale_lines')->whereColumn('sale_lines.sale_id', 'sales.id')->where('sale_lines.item_id', $filters['product']);
            }))
            ->when(! empty($filters['category']), fn ($query) => $query->whereExists(function ($subquery) use ($filters) {
                $subquery->selectRaw('1')->from('sale_lines')->join('items', 'items.id', '=', 'sale_lines.item_id')->whereColumn('sale_lines.sale_id', 'sales.id')->where('items.category_id', $filters['category']);
            }))
            ->whereRaw('COALESCE(sales.sold_at, sales.created_at) BETWEEN ? AND ?', [
                $start->copy()->startOfDay(),
                $end->copy()->endOfDay(),
            ])
            ->groupByRaw("
        COALESCE(
            NULLIF(customers.name, ''),
            NULLIF(sales.customer_name, ''),
            'Walk-in'
        )
    ")
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'customer' => $row->customer,
                'total' => (float) $row->total,
                'orders' => (int) $row->orders,
            ])
            ->values();

        $vendorPurchases = GoodsReceiptLine::query()
            ->join('goods_receipts', 'goods_receipts.id', '=', 'goods_receipt_lines.receipt_id')
            ->join('suppliers', 'suppliers.id', '=', 'goods_receipts.supplier_id')
            ->whereBetween('goods_receipts.received_at', [$startDate, $endDate])
            ->when(! empty($filters['vendor']), fn ($query) => $query->where('goods_receipts.supplier_id', $filters['vendor']))
            ->selectRaw('suppliers.name as vendor, SUM(goods_receipt_lines.quantity * goods_receipt_lines.unit_cost) as total, COUNT(*) as count')
            ->groupBy('suppliers.id', 'suppliers.name')
            ->orderByDesc('total')
            ->limit(6)
            ->get()
            ->map(fn ($row) => ['vendor' => $row->vendor, 'total' => (float) $row->total, 'count' => (int) $row->count])
            ->values();

        $internalTransfers = TransferLine::query()
            ->join('transfers', 'transfers.id', '=', 'transfer_lines.transfer_id')
            ->join('items', 'items.id', '=', 'transfer_lines.item_id')
            ->join('locations as source_locations', 'source_locations.id', '=', 'transfers.source_id')
            ->join('locations as destination_locations', 'destination_locations.id', '=', 'transfers.destination_id')
            ->whereBetween('transfers.transferred_at', [$startDate, $endDate])
            ->where('source_locations.name', 'factory')
            ->where('destination_locations.name', 'shop')
            ->where('transfers.status', 'completed')
            ->selectRaw('transfers.transferred_at as date, items.name as product, SUM(transfer_lines.quantity) as quantity, SUM(transfer_lines.quantity * transfer_lines.unit_price) as value')
            ->groupBy('transfers.transferred_at', 'items.id', 'items.name')
            ->orderByDesc('transfers.transferred_at')
            ->limit(8)
            ->get()
            ->map(fn ($row) => ['date' => $row->date, 'product' => $row->product, 'quantity' => (float) $row->quantity, 'value' => (float) $row->value])
            ->values();

        $shopInventory = InventoryBalance::query()
            ->join('items', 'items.id', '=', 'inventory_balances.item_id')
            ->join('locations', 'locations.id', '=', 'inventory_balances.location_id')
            ->where('locations.name', 'shop')
            ->selectRaw('items.name as product, quantity_on_hand as quantity, (quantity_on_hand * items.default_sale_price) as value')
            ->orderBy('quantity_on_hand')
            ->limit(8)
            ->get()
            ->map(fn ($row) => ['product' => $row->product, 'quantity' => (float) $row->quantity, 'value' => (float) $row->value, 'is_low_stock' => $row->quantity < 10 ? true : false])
            ->values();

        $paymentsQuery = Payment::query()
            ->whereBetween('paid_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()]);

        if (! empty($filters['customer']) || ! empty($filters['product']) || ! empty($filters['category'])) {
            $paymentsQuery->whereHas('invoice.sale', fn (Builder $query) => $this->applySaleFilters($query, $filters));
        }

        // dd($lowStockItems);
        return [
            'filters' => [
                'period' => $period,
                'preset' => $preset,
                'date' => $selectedPersianDate,
                'dateGregorian' => $selectedDate->toDateString(),
                'business_unit' => $filters['business_unit'] ?? 'consolidated',
                'product' => $filters['product'] ?? null,
                'category' => $filters['category'] ?? null,
                'vendor' => $filters['vendor'] ?? null,
                'customer' => $filters['customer'] ?? null,
            ],
            'range' => [
                'start' => $startPersianDate,
                'end' => $endPersianDate,
                'label' => $monthRange ? Jalalian::fromCarbon($start)->format('Y/m') : $startPersianDate,
            ],
            'summary' => [
                'sales' => ['total' => $salesTotal, 'gross_total' => $grossSalesTotal, 'count' => $salesCount],
                'expenses' => ['total' => (float) Expense::query()->whereBetween('date', [$startDate, $endDate])->sum('amount'), 'count' => (int) Expense::query()->whereBetween('date', [$startDate, $endDate])->count()],
                'payments' => ['total' => (float) $paymentsQuery->sum('amount')],
                'refunds' => ['total' => $returnsTotal],
                'returns_total' => $returnsTotal,
                'attendance' => [
                    'present' => (int) $attendance->get(1, 0),
                    'absent' => (int) $attendance->get(0, 0),
                ],
                'movements' => (int) InventoryMovement::query()->whereBetween('occured_at', [$startDate, $endDate])->count(),
                'production' => $productionOrdersCount,
                'activity' => (int) Log::query()->whereBetween('activity_date', [$startDate, $endDate])->count(),
                'cost_of_goods_sold' => $adjustedCostOfGoodsSold,
                'gross_profit' => $grossProfit,
                'raw_material_purchase_cost' => $rawMaterialPurchaseCost,
                'production_quantity_completed' => $productionOutputQuantity,
                'production_cost' => $productionOutputCost,
                'shop_stock_value' => $shopStockValue,
                'factory_stock_value' => $factoryStockValue,
                'low_stock_items_count' => $lowStockItems->count(),
                'low_stock_items' => $lowStockItems->get()->map(fn (InventoryBalance $balance) => [
                    'item' => ['id' => $balance->item_id, 'name' => $balance->item->name, 'code' => $balance->item->code, 'price' => $balance->item->default_sale_price],
                    'quantity' => $balance->available_qty,
                    'total_cost' => $balance->available_qty * $balance->item->default_sale_price,
                ])->values(),
                'internal_transfers' => $internalTransferValue,
            ],
            'dailySales' => $dailyRows,
            'expenseByCurrency' => $expenseByCurrency,
            'currencySummary' => $currencySummary,
            'movementSummary' => $movementSummary,
            'productionSummary' => $productionSummary,
            'topProducts' => $topProducts,
            'customerSales' => $customerSales,
            'vendorPurchases' => $vendorPurchases,
            'internalTransfers' => $internalTransfers,
            'shopInventory' => $shopInventory,
        ];
    }

    private function applySaleFilters(Builder $query, array $filters): Builder
    {
        return $query
            ->when(! empty($filters['customer']), fn (Builder $saleQuery) => $saleQuery->where(function (Builder $customerQuery) use ($filters) {
                if (ctype_digit((string) $filters['customer'])) {
                    $customerQuery->where('customer_id', $filters['customer']);
                } else {
                    $customerQuery->where('customer_name', 'like', '%'.$filters['customer'].'%');
                }
            }))
            ->when(! empty($filters['product']) || ! empty($filters['category']), fn (Builder $saleQuery) => $saleQuery->whereHas('saleLines.item', fn (Builder $itemQuery) => $itemQuery
                ->when(! empty($filters['product']), fn (Builder $itemQuery) => $itemQuery->where('id', $filters['product']))
                ->when(! empty($filters['category']), fn (Builder $itemQuery) => $itemQuery->where('category_id', $filters['category']))));
    }
}
