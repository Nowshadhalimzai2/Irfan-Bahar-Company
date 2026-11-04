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
        $export = (bool) ($filters['export'] ?? false);
        $startPersianDate = Jalalian::fromCarbon($start)->format('Y/m/d');
        $endPersianDate = Jalalian::fromCarbon($end)->format('Y/m/d');
        $selectedPersianDate = $period === 'monthly'
            ? Jalalian::fromCarbon($start)->format('Y/m')
            : $startPersianDate;

        $salesQuery = $this->applySaleFilters(
            Sale::query()->with('currency:id,name')->whereNotIn('status', ['draft', 'cancelled']),
            $filters,
        );

        // Compare the Gregorian date portion explicitly. Some existing records
        // use ISO timestamps (2026-10-07T08:04), while others use SQL datetime
        // strings (2026-10-07 08:04:00). A raw BETWEEN on an exact day can
        // exclude the ISO values because `T` sorts after the space separator.
        $salesQuery->whereRaw('DATE(COALESCE(sold_at, created_at)) BETWEEN ? AND ?', [$startDate, $endDate]);
        $salesCount = (int) $salesQuery->count();

        $costOfGoodsSoldQuery = SaleLine::query()
            ->join('sales', 'sales.id', '=', 'sale_lines.sale_id')
            ->whereNotIn('sales.status', ['draft', 'cancelled'])
            ->when(! empty($filters['product']), fn ($query) => $query->where('sale_lines.item_id', $filters['product']))
            ->when(! empty($filters['category']), fn ($query) => $query->whereHas('item', fn (Builder $itemQuery) => $itemQuery->where('category_id', $filters['category'])));
        if (! empty($filters['customer'])) {
            $costOfGoodsSoldQuery->whereHas('sale', fn (Builder $query) => $this->applySaleFilters($query, ['customer' => $filters['customer']]));
        }

        $costOfGoodsSoldQuery->whereRaw('DATE(COALESCE(sales.sold_at, sales.created_at)) BETWEEN ? AND ?', [$startDate, $endDate]);

        $costOfGoodsSoldByCurrency = (clone $costOfGoodsSoldQuery)
            ->leftJoin('currencies', 'currencies.id', '=', 'sales.currency_id')
            ->selectRaw('COALESCE(currencies.name, \'AFG\') as currency, SUM(sale_lines.quantity * sale_lines.unit_cost) as total')
            ->groupBy('currencies.name')
            ->get()
            ->map(fn ($row) => ['currency' => $row->currency, 'total' => (float) $row->total]);

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

        $returnedGoodsCostByCurrency = (clone $returnedGoodsCostQuery)
            ->leftJoin('sales', 'sales.id', '=', 'sale_lines.sale_id')
            ->leftJoin('currencies', 'currencies.id', '=', 'sales.currency_id')
            ->selectRaw('COALESCE(currencies.name, \'AFG\') as currency, SUM(sale_return_lines.quantity * sale_lines.unit_cost) as total')
            ->groupBy('currencies.name')
            ->get()
            ->map(fn ($row) => ['currency' => $row->currency ?? 'AFG', 'total' => (float) $row->total]);

        $rawMaterialPurchaseQuery = GoodsReceiptLine::query()
            ->join('goods_receipts', 'goods_receipts.id', '=', 'goods_receipt_lines.receipt_id')
            ->join('items', 'items.id', '=', 'goods_receipt_lines.item_id')
            ->whereDate('goods_receipts.received_at', '>=', $startDate)
            ->whereDate('goods_receipts.received_at', '<=', $endDate)
            ->where('items.item_type', '!=', 'product')
            ->when(! empty($filters['vendor']), fn ($query) => $query->where('goods_receipts.supplier_id', $filters['vendor']))
            ->when(! empty($filters['product']), fn ($query) => $query->where('goods_receipt_lines.item_id', $filters['product']))
            ->when(! empty($filters['category']), fn ($query) => $query->where('items.category_id', $filters['category']));
        $rawMaterialPurchaseByCurrency = (clone $rawMaterialPurchaseQuery)
            ->leftJoin('currencies', 'currencies.id', '=', 'goods_receipts.currency_id')
            ->selectRaw('COALESCE(currencies.name, \'AFG\') as currency, SUM(goods_receipt_lines.quantity * goods_receipt_lines.unit_cost) as total')
            ->groupBy('currencies.name')
            ->get()
            ->map(fn ($row) => ['currency' => $row->currency, 'total' => (float) $row->total]);

        $productionOutputByUnit = ProductionOutput::query()
            ->join('production_orders', 'production_orders.id', '=', 'production_outputs.production_order_id')
            ->join('items', 'items.id', '=', 'production_outputs.product_id')
            ->leftJoin('item_units as base_units', 'base_units.id', '=', 'items.base_unit_id')
            ->where('production_orders.status', 'completed')
            ->whereDate('production_orders.order_date', '>=', $startDate)
            ->whereDate('production_orders.order_date', '<=', $endDate)
            // ->when(! empty($filters['product']), fn ($query) => $query->where('items.id', $filters['product']))
            // ->when(! empty($filters['category']), fn ($query) => $query->where('items.category_id', $filters['category']))
            // ->selectRaw('COALESCE(NULLIF(base_units.name, \'\'), items.unit) as unit, SUM(production_outputs.quantity_produced) as quantity')
            ->groupBy('base_units.name', 'items.unit')
            // ->orderBy('unit')
            ->count();
            // ->map(fn ($row) => [
            //     'unit' => $row->unit,
            //     'quantity' => (float) $row->quantity,
            // ]);
        $productionOutputQuantity = $productionOutputByUnit;
            // ->map(fn (array $row) => rtrim(rtrim(number_format($row['quantity'], 3, '.', ''), '0'), '.').' '.$row['unit'])
            // ->implode(', ') ?: '0';

        $productionUnitPriceSql = 'COALESCE(base_units.purchase_price, (
            SELECT goods_receipt_lines.unit_cost / NULLIF(goods_receipt_lines.conversion_factor, 0)
            FROM goods_receipt_lines
            INNER JOIN goods_receipts ON goods_receipts.id = goods_receipt_lines.receipt_id
            WHERE goods_receipt_lines.item_id = inventory_movements.item_id
              AND DATE(goods_receipts.received_at) <= DATE(inventory_movements.occured_at)
            ORDER BY goods_receipts.received_at DESC, goods_receipt_lines.id DESC
            LIMIT 1
        ), 0)';
        $productionLatestReceiptCurrencySql = '(
            SELECT currencies.name
            FROM goods_receipt_lines
            INNER JOIN goods_receipts ON goods_receipts.id = goods_receipt_lines.receipt_id
            INNER JOIN currencies ON currencies.id = goods_receipts.currency_id
            WHERE goods_receipt_lines.item_id = inventory_movements.item_id
              AND DATE(goods_receipts.received_at) <= DATE(inventory_movements.occured_at)
            ORDER BY goods_receipts.received_at DESC, goods_receipt_lines.id DESC
            LIMIT 1
        )';
        $productionConsumptionQuery = InventoryMovement::query()
            ->join('items', 'items.id', '=', 'inventory_movements.item_id')
            ->leftJoin('item_units as base_units', 'base_units.id', '=', 'items.base_unit_id')
            ->where('inventory_movements.movement_type', 'production_consumption')
            ->whereDate('inventory_movements.occured_at', '>=', $startDate)
            ->whereDate('inventory_movements.occured_at', '<=', $endDate)
            ->when(! empty($filters['product']), fn ($query) => $query->where('items.id', $filters['product']))
            ->when(! empty($filters['category']), fn ($query) => $query->where('items.category_id', $filters['category']));
        $productionOutputCostByCurrency = (clone $productionConsumptionQuery)
            ->selectRaw("
                COALESCE({$productionLatestReceiptCurrencySql}, 'AFG') as currency,
                SUM(ABS(inventory_movements.quantity) * {$productionUnitPriceSql}) as total
            ")
            ->groupBy('currency')
            ->get()
            ->map(fn ($row) => ['currency' => $row->currency, 'total' => (float) $row->total]);

        $productionOrdersQuery = ProductionOrder::query()
            ->whereDate('order_date', '>=', $startDate)
            ->whereDate('order_date', '<=', $endDate)
            ->when(! empty($filters['product']) || ! empty($filters['category']), fn ($query) => $query->whereHas(
                'productionOutputs.product.item',
                fn (Builder $itemQuery) => $itemQuery
                    ->when(! empty($filters['product']), fn (Builder $itemQuery) => $itemQuery->whereKey($filters['product']))
                    ->when(! empty($filters['category']), fn (Builder $itemQuery) => $itemQuery->where('category_id', $filters['category'])),
            ));

        $productionOrdersCount = (int) (clone $productionOrdersQuery)->count();

        $internalTransferValue = (float) TransferLine::query()
            ->join('transfers', 'transfers.id', '=', 'transfer_lines.transfer_id')
            ->join('items', 'items.id', '=', 'transfer_lines.item_id')
            ->join('locations as source_locations', 'source_locations.id', '=', 'transfers.source_id')
            ->join('locations as destination_locations', 'destination_locations.id', '=', 'transfers.destination_id')
            ->whereDate('transfers.transferred_at', '>=', $startDate)
            ->whereDate('transfers.transferred_at', '<=', $endDate)
            ->where('source_locations.name', 'factory')
            ->where('destination_locations.name', 'shop')
            ->where('transfers.status', 'completed')
            ->when(! empty($filters['product']), fn ($query) => $query->where('items.id', $filters['product']))
            ->when(! empty($filters['category']), fn ($query) => $query->where('items.category_id', $filters['category']))
            ->sum(DB::raw('transfer_lines.quantity * transfer_lines.unit_price'));

        $shopStockValue = (float) InventoryBalance::query()
            ->join('items', 'items.id', '=', 'inventory_balances.item_id')
            ->leftJoin('item_units as base_units', 'base_units.id', '=', 'items.base_unit_id')
            ->join('locations', 'locations.id', '=', 'inventory_balances.location_id')
            ->where('locations.name', 'shop')
            ->when(! empty($filters['product']), fn ($query) => $query->where('items.id', $filters['product']))
            ->when(! empty($filters['category']), fn ($query) => $query->where('items.category_id', $filters['category']))
            ->sum(DB::raw('inventory_balances.quantity_on_hand * COALESCE(base_units.selling_price, items.default_sale_price)'));

        $factoryStockValue = (float) InventoryBalance::query()
            ->join('items', 'items.id', '=', 'inventory_balances.item_id')
            ->leftJoin('item_units as base_units', 'base_units.id', '=', 'items.base_unit_id')
            ->join('locations', 'locations.id', '=', 'inventory_balances.location_id')
            ->where('locations.name', 'factory')
            ->when(! empty($filters['product']), fn ($query) => $query->where('items.id', $filters['product']))
            ->when(! empty($filters['category']), fn ($query) => $query->where('items.category_id', $filters['category']))
            ->sum(DB::raw('inventory_balances.quantity_on_hand * COALESCE(base_units.selling_price, items.default_sale_price)'));

        $lowStockItems = InventoryBalance::query()
            ->fromSub(
                InventoryBalance::query()
                    ->selectRaw('item_id, sum(quantity_on_hand - reserved) as available_qty')
                    ->groupBy('item_id')
                    ->havingRaw('sum(quantity_on_hand - reserved) < ?', [10]),
                'low_stock'
            )
            ->with(['item.baseUnit'])
            ->whereExists(fn ($query) => $query
                ->selectRaw('1')
                ->from('items')
                ->whereColumn('items.id', 'low_stock.item_id')
                ->when(! empty($filters['product']), fn ($itemQuery) => $itemQuery->where('items.id', $filters['product']))
                ->when(! empty($filters['category']), fn ($itemQuery) => $itemQuery->where('items.category_id', $filters['category'])));

        $dailyRows = $salesQuery
            ->get(['sold_at', 'created_at', 'after_descount_total', 'currency_id'])
            ->groupBy(fn ($sale) => Carbon::parse($sale->sold_at ?? $sale->created_at)->toDateString().'|'.($sale->currency?->name ?? 'AFG'))
            ->map(fn ($rows, $key) => [
                'label' => Jalalian::fromCarbon(Carbon::parse(explode('|', $key, 2)[0]))->format('m/d'),
                'date' => explode('|', $key, 2)[0],
                'currency' => explode('|', $key, 2)[1],
                'sales' => (float) $rows->sum('after_descount_total'),
                'count' => $rows->count(),
            ])
            ->values();

        $expenseByCurrency = Expense::query()
            ->with('currency:id,name')
            ->whereDate('date', '>=', $startDate)
            ->whereDate('date', '<=', $endDate)
            ->get()
            ->groupBy(fn ($expense) => $expense->currency?->name ?? 'AFG')
            ->map(fn ($rows, $currency) => [
                'currency' => $currency,
                'amount' => (float) $rows->sum('amount'),
                'count' => $rows->count(),
            ])
            ->values();

        $expenses = Expense::query()
            ->with('currency:id,name')
            ->whereDate('date', '>=', $startDate)
            ->whereDate('date', '<=', $endDate)
            ->orderBy('date')
            ->get()
            ->map(fn (Expense $expense) => [
                'date' => $expense->date,
                'currency' => $expense->currency?->name ?? 'AFG',
                'description' => $expense->description,
                'amount' => (float) $expense->amount,
            ])
            ->values();

        $salesByCurrencyQuery = $this->applySaleFilters(
            Sale::query()->with('currency:id,name')->whereNotIn('status', ['draft', 'cancelled']),
            $filters,
        );

        $salesByCurrencyQuery->whereRaw('DATE(COALESCE(sold_at, created_at)) BETWEEN ? AND ?', [$startDate, $endDate]);

        $salesByCurrency = $salesByCurrencyQuery->get()
            ->groupBy(fn ($sale) => $sale->currency?->name ?? 'AFG')
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
            ->groupBy(fn ($return) => $return->currency ?: 'AFG')
            ->map(fn ($returns, $currency) => [
                'currency' => $currency,
                'total' => (float) $returns->sum('refund_amount'),
                'count' => $returns->count(),
            ])
            ->values();

        $paymentsByCurrencyQuery = Payment::query()
            ->with('currency:id,name')
            ->whereBetween('paid_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()]);
        if (! empty($filters['customer']) || ! empty($filters['product']) || ! empty($filters['category'])) {
            $paymentsByCurrencyQuery->whereHas('invoice.sale', fn (Builder $query) => $this->applySaleFilters($query, $filters));
        }
        $paymentsByCurrency = $paymentsByCurrencyQuery->get()
            ->groupBy(fn ($payment) => $payment->currency?->name ?? 'AFG')
            ->map(fn ($payments, $currency) => [
                'currency' => $currency,
                'total' => (float) $payments->sum('amount'),
                'count' => $payments->count(),
            ])
            ->values();

        $combinedCurrencyKeys = collect($salesByCurrency)->pluck('currency')
            ->merge(collect($returnsByCurrency)->pluck('currency'))
            ->merge(collect($expenseByCurrency)->pluck('currency'))
            ->merge($costOfGoodsSoldByCurrency->pluck('currency'))
            ->merge($returnedGoodsCostByCurrency->pluck('currency'))
            ->merge($rawMaterialPurchaseByCurrency->pluck('currency'))
            ->merge($paymentsByCurrency->pluck('currency'))
            ->merge($productionOutputCostByCurrency->pluck('currency'))
            ->unique()
            ->values();

        $currencySummary = $combinedCurrencyKeys->map(function ($currency) use ($salesByCurrency, $returnsByCurrency, $expenseByCurrency, $costOfGoodsSoldByCurrency, $returnedGoodsCostByCurrency, $rawMaterialPurchaseByCurrency, $paymentsByCurrency, $productionOutputCostByCurrency) {
            $sales = collect($salesByCurrency)->firstWhere('currency', $currency);
            $returns = collect($returnsByCurrency)->firstWhere('currency', $currency);
            $expenses = collect($expenseByCurrency)->firstWhere('currency', $currency);
            $costOfGoodsSold = $costOfGoodsSoldByCurrency->firstWhere('currency', $currency);
            $returnedGoodsCost = $returnedGoodsCostByCurrency->firstWhere('currency', $currency);
            $rawMaterialPurchases = $rawMaterialPurchaseByCurrency->firstWhere('currency', $currency);
            $payments = $paymentsByCurrency->firstWhere('currency', $currency);
            $productionCost = $productionOutputCostByCurrency->firstWhere('currency', $currency);
            $adjustedCostOfGoodsSold = max((float) ($costOfGoodsSold['total'] ?? 0) - (float) ($returnedGoodsCost['total'] ?? 0), 0);
            $netSales = (float) ($sales['total'] ?? 0) - (float) ($returns['total'] ?? 0);

            return [
                'currency' => $currency,
                'sales_total' => (float) ($sales['total'] ?? 0),
                'refund_total' => (float) ($returns['total'] ?? 0),
                'net_total' => $netSales,
                'expenses_total' => (float) ($expenses['amount'] ?? 0),
                'payments_total' => (float) ($payments['total'] ?? 0),
                'cost_of_goods_sold' => $adjustedCostOfGoodsSold,
                'gross_profit' => $netSales - $adjustedCostOfGoodsSold,
                'raw_material_purchase_cost' => (float) ($rawMaterialPurchases['total'] ?? 0),
                'production_cost' => (float) ($productionCost['total'] ?? 0),
                'sales_count' => (int) ($sales['count'] ?? 0),
                'refund_count' => (int) ($returns['count'] ?? 0),
                'expense_count' => (int) ($expenses['count'] ?? 0),
            ];
        })->values();

        $attendance = Attendance::query()
            ->whereDate('date', '>=', $startDate)
            ->whereDate('date', '<=', $endDate)
            ->selectRaw('is_present, COUNT(*) as total')
            ->groupBy('is_present')
            ->pluck('total', 'is_present');

        $movementSummary = InventoryMovement::query()
            ->join('items', 'items.id', '=', 'inventory_movements.item_id')
            ->leftJoin('item_units as base_units', 'base_units.id', '=', 'items.base_unit_id')
            ->whereDate('inventory_movements.occured_at', '>=', $startDate)
            ->whereDate('inventory_movements.occured_at', '<=', $endDate)
            ->when(! empty($filters['product']), fn ($query) => $query->where('items.id', $filters['product']))
            ->when(! empty($filters['category']), fn ($query) => $query->where('items.category_id', $filters['category']))
            ->selectRaw('inventory_movements.movement_type, COALESCE(NULLIF(base_units.name, \'\'), items.unit) as unit, COUNT(*) as movements, SUM(ABS(inventory_movements.quantity)) as quantity')
            ->groupBy('inventory_movements.movement_type', 'base_units.name', 'items.unit')
            ->orderByDesc('movements')
            ->get()
            ->map(fn ($row) => [
                'type' => $row->movement_type,
                'unit' => $row->unit,
                'movements' => (int) $row->movements,
                'quantity' => (float) $row->quantity,
            ])
            ->values();

        $productionSummary = (clone $productionOrdersQuery)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => ['status' => $row->status, 'total' => (int) $row->total])
            ->values();

        $topProducts = SaleLine::query()
            ->join('sales', 'sales.id', '=', 'sale_lines.sale_id')
            ->join('items', 'items.id', '=', 'sale_lines.item_id')
            ->leftJoin('item_units as base_units', 'base_units.id', '=', 'items.base_unit_id')
            ->leftJoin('currencies', 'currencies.id', '=', 'sales.currency_id')
            ->whereNotIn('sales.status', ['draft', 'cancelled'])
            ->when(! empty($filters['product']), fn ($query) => $query->where('sale_lines.item_id', $filters['product']))
            ->when(! empty($filters['category']), fn ($query) => $query->where('items.category_id', $filters['category']))
            ->whereRaw('DATE(COALESCE(sales.sold_at, sales.created_at)) BETWEEN ? AND ?', [$startDate, $endDate])
            ->selectRaw('items.name as name, COALESCE(NULLIF(base_units.name, \'\'), items.unit) as unit, COALESCE(currencies.name, \'AFG\') as currency, SUM(sale_lines.line_total) as total, SUM(COALESCE(sale_lines.base_quantity, sale_lines.quantity)) as quantity')
            ->groupBy('items.id', 'items.name', 'base_units.name', 'items.unit', 'currencies.name')
            ->orderByDesc('total')
            ->when(! $export, fn ($query) => $query->limit(6))
            ->get()
            ->map(fn ($row) => ['name' => $row->name, 'unit' => $row->unit, 'currency' => $row->currency, 'total' => (float) $row->total, 'quantity' => (float) $row->quantity])
            ->values();

        $customerSales = Sale::query()
            ->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
            ->leftJoin('currencies', 'currencies.id', '=', 'sales.currency_id')
            ->selectRaw("
        COALESCE(
            NULLIF(customers.name, ''),
            NULLIF(sales.customer_name, ''),
            'Walk-in'
        ) AS customer,
        COALESCE(currencies.name, 'AFG') AS currency,
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
            ->whereRaw('DATE(COALESCE(sales.sold_at, sales.created_at)) BETWEEN ? AND ?', [$startDate, $endDate])
            ->groupByRaw("
        COALESCE(
            NULLIF(customers.name, ''),
            NULLIF(sales.customer_name, ''),
            'Walk-in'
        ), currencies.name
    ")
            ->orderByDesc('total')
            ->when(! $export, fn ($query) => $query->limit(5))
            ->get()
            ->map(fn ($row) => [
                'customer' => $row->customer,
                'currency' => $row->currency ?? 'AFG',
                'total' => (float) $row->total,
                'orders' => (int) $row->orders,
            ])
            ->values();

        $vendorPurchases = GoodsReceiptLine::query()
            ->join('goods_receipts', 'goods_receipts.id', '=', 'goods_receipt_lines.receipt_id')
            ->join('items', 'items.id', '=', 'goods_receipt_lines.item_id')
            ->join('suppliers', 'suppliers.id', '=', 'goods_receipts.supplier_id')
            ->leftJoin('currencies', 'currencies.id', '=', 'goods_receipts.currency_id')
            ->whereDate('goods_receipts.received_at', '>=', $startDate)
            ->whereDate('goods_receipts.received_at', '<=', $endDate)
            ->when(! empty($filters['vendor']), fn ($query) => $query->where('goods_receipts.supplier_id', $filters['vendor']))
            ->when(! empty($filters['product']), fn ($query) => $query->where('items.id', $filters['product']))
            ->when(! empty($filters['category']), fn ($query) => $query->where('items.category_id', $filters['category']))
            ->selectRaw('suppliers.name as vendor, COALESCE(currencies.name, \'AFG\') as currency, SUM(goods_receipt_lines.quantity * goods_receipt_lines.unit_cost) as total, COUNT(*) as count')
            ->groupBy('suppliers.id', 'suppliers.name', 'currencies.name')
            ->orderByDesc('total')
            ->when(! $export, fn ($query) => $query->limit(6))
            ->get()
            ->map(fn ($row) => ['vendor' => $row->vendor, 'currency' => $row->currency, 'total' => (float) $row->total, 'count' => (int) $row->count])
            ->values();

        $internalTransfers = TransferLine::query()
            ->join('transfers', 'transfers.id', '=', 'transfer_lines.transfer_id')
            ->join('items', 'items.id', '=', 'transfer_lines.item_id')
            ->leftJoin('item_units as base_units', 'base_units.id', '=', 'items.base_unit_id')
            ->join('locations as source_locations', 'source_locations.id', '=', 'transfers.source_id')
            ->join('locations as destination_locations', 'destination_locations.id', '=', 'transfers.destination_id')
            ->whereDate('transfers.transferred_at', '>=', $startDate)
            ->whereDate('transfers.transferred_at', '<=', $endDate)
            ->where('source_locations.name', 'factory')
            ->where('destination_locations.name', 'shop')
            ->where('transfers.status', 'completed')
            ->when(! empty($filters['product']), fn ($query) => $query->where('items.id', $filters['product']))
            ->when(! empty($filters['category']), fn ($query) => $query->where('items.category_id', $filters['category']))
            ->selectRaw('transfers.transferred_at as date, items.name as product, COALESCE(NULLIF(base_units.name, \'\'), items.unit) as unit, SUM(COALESCE(transfer_lines.base_quantity, transfer_lines.quantity)) as quantity, SUM(transfer_lines.quantity * transfer_lines.unit_price) as value')
            ->groupBy('transfers.transferred_at', 'items.id', 'items.name', 'base_units.name', 'items.unit')
            ->orderByDesc('transfers.transferred_at')
            ->when(! $export, fn ($query) => $query->limit(8))
            ->get()
            ->map(fn ($row) => ['date' => $row->date, 'product' => $row->product, 'unit' => $row->unit, 'quantity' => (float) $row->quantity, 'value' => (float) $row->value, 'currency' => 'AFG'])
            ->values();

        $shopInventory = InventoryBalance::query()
            ->join('items', 'items.id', '=', 'inventory_balances.item_id')
            ->leftJoin('item_units as base_units', 'base_units.id', '=', 'items.base_unit_id')
            ->join('locations', 'locations.id', '=', 'inventory_balances.location_id')
            ->where('locations.name', 'shop')
            ->when(! empty($filters['product']), fn ($query) => $query->where('items.id', $filters['product']))
            ->when(! empty($filters['category']), fn ($query) => $query->where('items.category_id', $filters['category']))
            ->selectRaw('items.name as product, COALESCE(NULLIF(base_units.name, \'\'), items.unit) as unit, inventory_balances.quantity_on_hand as quantity, (inventory_balances.quantity_on_hand * COALESCE(base_units.selling_price, items.default_sale_price)) as value')
            ->orderBy('inventory_balances.quantity_on_hand')
            ->when(! $export, fn ($query) => $query->limit(8))
            ->get()
            ->map(fn ($row) => ['product' => $row->product, 'unit' => $row->unit, 'quantity' => (float) $row->quantity, 'value' => (float) $row->value, 'currency' => 'AFG', 'is_low_stock' => $row->quantity < InventoryBalance::LOW_STOCK_THRESHOLD])
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
                'sales' => ['count' => $salesCount],
                'expenses' => ['count' => (int) Expense::query()->whereDate('date', '>=', $startDate)->whereDate('date', '<=', $endDate)->count()],
                'payments' => ['count' => (int) $paymentsQuery->count()],
                'refunds' => ['count' => (int) collect($returnsByCurrency)->sum('count')],
                'attendance' => [
                    'present' => (int) $attendance->get(1, 0),
                    'absent' => (int) $attendance->get(0, 0),
                ],
                'movements' => (int) InventoryMovement::query()
                    ->whereDate('occured_at', '>=', $startDate)
                    ->whereDate('occured_at', '<=', $endDate)
                    ->when(! empty($filters['product']) || ! empty($filters['category']), fn (Builder $query) => $query->whereHas('item', fn (Builder $itemQuery) => $itemQuery
                        ->when(! empty($filters['product']), fn (Builder $itemQuery) => $itemQuery->whereKey($filters['product']))
                        ->when(! empty($filters['category']), fn (Builder $itemQuery) => $itemQuery->where('category_id', $filters['category'])))
                    )
                    ->count(),
                'production' => $productionOrdersCount,
                'activity' => (int) Log::query()->whereDate('activity_date', '>=', $startDate)->whereDate('activity_date', '<=', $endDate)->count(),
                'production_quantity_completed' => $productionOutputQuantity,
                'production_cost_basis' => 'Estimated using base-unit purchase prices or the latest preceding receipt price.',
                'shop_stock_value_afg' => $shopStockValue,
                'factory_stock_value_afg' => $factoryStockValue,
                'low_stock_items_count' => $lowStockItems->count(),
                'low_stock_items' => $lowStockItems->get()->map(function (InventoryBalance $balance) {
                    $baseUnit = $balance->item->baseUnit;
                    $baseUnitSellingPrice = (float) ($baseUnit?->selling_price ?? 0);

                    return [
                        'item' => [
                            'id' => $balance->item_id,
                            'name' => $balance->item->name,
                            'code' => $balance->item->code,
                            'unit' => $baseUnit?->name ?? $balance->item->unit,
                            'price' => $baseUnitSellingPrice,
                            'currency' => 'AFG',
                        ],
                        'quantity' => (float) $balance->available_qty,
                        'total_value' => (float) $balance->available_qty * $baseUnitSellingPrice,
                    ];
                })->values(),
                'internal_transfers_value_afg' => $internalTransferValue,
            ],
            'dailySales' => $dailyRows,
            'expenses' => $expenses,
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
