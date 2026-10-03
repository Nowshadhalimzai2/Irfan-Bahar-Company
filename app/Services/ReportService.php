<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptLine;
use App\Models\InventoryBalance;
use App\Models\InventoryMovement;
use App\Models\Item;
use App\Models\Log;
use App\Models\Payment;
use App\Models\ProductionOrder;
use App\Models\ProductionOutput;
use App\Models\Sale;
use App\Models\SaleLine;
use App\Models\SaleReturn;
use App\Models\Transfer;
use App\Models\TransferLine;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Consolidated reporting for the factory + shop business.
     *
     * Internal factory-to-shop transfers are visible for operational review but are
     * intentionally excluded from the consolidated external revenue and gross profit
     * metrics used for customer-facing business reporting.
     */
    public function buildForPeriod(string $period, Carbon|string $date, array $filters = []): array
    {
        $selectedDate = $date instanceof Carbon ? $date->copy() : Carbon::parse($date, config('app.timezone'));

        $preset = $filters['preset'] ?? 'custom';
        if ($preset === 'today') {
            $start = $selectedDate->copy()->startOfDay();
            $end = $selectedDate->copy()->endOfDay();
        } elseif ($preset === 'yesterday') {
            $start = $selectedDate->copy()->subDay()->startOfDay();
            $end = $selectedDate->copy()->subDay()->endOfDay();
        } elseif ($preset === 'this_month') {
            $start = $selectedDate->copy()->startOfMonth();
            $end = $selectedDate->copy()->endOfMonth();
        } elseif ($preset === 'last_month') {
            $start = $selectedDate->copy()->subMonth()->startOfMonth();
            $end = $selectedDate->copy()->subMonth()->endOfMonth();
        } elseif ($period === 'monthly') {
            $start = $selectedDate->copy()->startOfMonth();
            $end = $selectedDate->copy()->endOfMonth();
        } else {
            $start = $selectedDate->copy()->startOfDay();
            $end = $selectedDate->copy()->endOfDay();
        }

        $startDate = $start->toDateString();
        $endDate = $end->toDateString();

        $salesQuery = Sale::query()
            ->whereNotIn('status', ['draft', 'cancelled'])
            ->whereBetween('sold_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()]);

        if (! empty($filters['customer'])) {
            $salesQuery->where(function ($query) use ($filters) {
                $query->where('customer_name', 'like', '%'.$filters['customer'].'%')
                    ->orWhere('customer_id', $filters['customer']);
            });
        }

        if (! empty($filters['product'])) {
            $salesQuery->whereHas('saleLines.item', fn ($query) => $query->where('id', $filters['product']));
        }

        $salesTotal = (float) $salesQuery->sum('after_descount_total');
        $salesCount = (int) $salesQuery->count();

        $costOfGoodsSold = (float) SaleLine::query()
            ->join('sales', 'sales.id', '=', 'sale_lines.sale_id')
            ->whereNotIn('sales.status', ['draft', 'cancelled'])
            ->whereBetween('sales.sold_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->when(! empty($filters['product']), fn ($query) => $query->where('sale_lines.item_id', $filters['product']))
            ->sum(DB::raw('sale_lines.quantity * sale_lines.unit_cost'));

        $grossProfit = $salesTotal - $costOfGoodsSold;

        $rawMaterialPurchaseCost = (float) GoodsReceiptLine::query()
            ->join('goods_receipts', 'goods_receipts.id', '=', 'goods_receipt_lines.receipt_id')
            ->whereBetween('goods_receipts.received_at', [$startDate, $endDate])
            ->when(! empty($filters['vendor']), fn ($query) => $query->where('goods_receipts.supplier_id', $filters['vendor']))
            ->sum(DB::raw('goods_receipt_lines.quantity * goods_receipt_lines.unit_cost'));

        $productionOutputQuantity = (float) ProductionOutput::query()
            ->join('production_orders', 'production_orders.id', '=', 'production_outputs.production_order_id')
            ->whereBetween('production_orders.order_date', [$startDate, $endDate])
            ->sum('quantity_produced');

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

        $lowStockItems = (int) InventoryBalance::query()
            ->where('quantity_on_hand', '<', 10)
            ->count();

        $dailyRows = $salesQuery
            ->get(['sold_at', 'after_descount_total'])
            ->groupBy(fn ($sale) => Carbon::parse($sale->sold_at)->toDateString())
            ->map(fn ($rows, $date) => [
                'label' => Carbon::parse($date)->format('M j'),
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

        $attendance = \App\Models\Attendance::query()
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
            ->whereBetween('sales.sold_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->selectRaw('items.name as name, SUM(sale_lines.line_total) as total, SUM(sale_lines.quantity) as quantity')
            ->groupBy('items.id', 'items.name')
            ->orderByDesc('total')
            ->limit(6)
            ->get()
            ->map(fn ($row) => ['name' => $row->name, 'total' => (float) $row->total, 'quantity' => (float) $row->quantity])
            ->values();

        $customerSales = Sale::query()
            ->selectRaw('COALESCE(customer_name, "Walk-in") as customer, SUM(after_descount_total) as total, COUNT(*) as orders')
            ->whereNotIn('status', ['draft', 'cancelled'])
            ->whereBetween('sold_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->groupBy('customer_name')
            ->orderByDesc('total')
            ->limit(8)
            ->get()
            ->map(fn ($row) => ['customer' => $row->customer, 'total' => (float) $row->total, 'orders' => (int) $row->orders])
            ->values();

        $vendorPurchases = GoodsReceiptLine::query()
            ->join('goods_receipts', 'goods_receipts.id', '=', 'goods_receipt_lines.receipt_id')
            ->join('suppliers', 'suppliers.id', '=', 'goods_receipts.supplier_id')
            ->whereBetween('goods_receipts.received_at', [$startDate, $endDate])
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
            ->map(fn ($row) => ['product' => $row->product, 'quantity' => (float) $row->quantity, 'value' => (float) $row->value])
            ->values();

        return [
            'filters' => [
                'period' => $period,
                'preset' => $preset,
                'date' => $selectedDate->toDateString(),
                'business_unit' => $filters['business_unit'] ?? 'consolidated',
                'product' => $filters['product'] ?? null,
                'category' => $filters['category'] ?? null,
                'vendor' => $filters['vendor'] ?? null,
                'customer' => $filters['customer'] ?? null,
            ],
            'range' => [
                'start' => $startDate,
                'end' => $endDate,
                'label' => $period === 'monthly' ? $start->format('F Y') : $start->format('F j, Y'),
            ],
            'summary' => [
                'sales' => ['total' => $salesTotal, 'count' => $salesCount],
                'expenses' => ['total' => (float) Expense::query()->whereBetween('date', [$startDate, $endDate])->sum('amount'), 'count' => (int) Expense::query()->whereBetween('date', [$startDate, $endDate])->count()],
                'payments' => ['total' => (float) Payment::query()->whereBetween('paid_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])->sum('amount')],
                'refunds' => ['total' => (float) SaleReturn::query()->whereBetween('requested_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])->sum('refund_amount')],
                'attendance' => [
                    'present' => (int) $attendance->get(1, 0),
                    'absent' => (int) $attendance->get(0, 0),
                ],
                'movements' => (int) InventoryMovement::query()->whereBetween('occured_at', [$startDate, $endDate])->count(),
                'production' => $productionOrdersCount,
                'activity' => (int) Log::query()->whereBetween('activity_date', [$startDate, $endDate])->count(),
                'cost_of_goods_sold' => $costOfGoodsSold,
                'gross_profit' => $grossProfit,
                'raw_material_purchase_cost' => $rawMaterialPurchaseCost,
                'production_quantity_completed' => $productionOutputQuantity,
                'production_cost' => $rawMaterialPurchaseCost,
                'shop_stock_value' => $shopStockValue,
                'factory_stock_value' => $factoryStockValue,
                'low_stock_items' => $lowStockItems,
                'internal_transfers' => $internalTransferValue,
            ],
            'dailySales' => $dailyRows,
            'expenseByCurrency' => $expenseByCurrency,
            'movementSummary' => $movementSummary,
            'productionSummary' => $productionSummary,
            'topProducts' => $topProducts,
            'customerSales' => $customerSales,
            'vendorPurchases' => $vendorPurchases,
            'internalTransfers' => $internalTransfers,
            'shopInventory' => $shopInventory,
        ];
    }
}
