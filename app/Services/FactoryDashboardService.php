<?php

namespace App\Services;

use App\Models\GoodsReceipt;
use App\Models\InventoryBalance;
use App\Models\InventoryMovement;
use App\Models\ProductionOrder;
use App\Models\Transfer;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class FactoryDashboardService
{
    public const MAX_DATE_RANGE_DAYS = 30;

    private const AUTHORIZED_LOCATION_TYPES = ['factory', 'warehouse'];

    private const TREND_TYPES = [
        'production_consumption' => 'issues',
        'production_output' => 'production',
    ];

    public function dashboard(User $user, CarbonImmutable $startDate, CarbonImmutable $endDate): array
    {
        abort_unless($user->hasAnyRole(['factory_clerk','super_admin','admin']) && $user->status, 403);

        $movements = $this->movementQuery()
            ->whereBetween('occured_at', [$startDate->toDateString(), $endDate->endOfDay()]);
        $movementCounts = (clone $movements)
            ->whereIn('movement_type', array_keys(self::TREND_TYPES))
            ->selectRaw('movement_type, COUNT(*) as movement_count')
            ->groupBy('movement_type')
            ->pluck('movement_count', 'movement_type');

        $pendingTransfers = $this->transferQuery()
            ->where('status', 'suggested');
        $openProductionOrders = ProductionOrder::query()
            ->whereIn('status', ['pending', 'progress']);

        return [
            'filters' => [
                'startDate' => $startDate->toDateString(),
                'endDate' => $endDate->toDateString(),
            ],
            'summary' => [
                'receipts' => $this->receiptQuery()
                    ->whereBetween('received_at', [$startDate->toDateString(), $endDate->toDateString()])
                    ->count(),
                'materialIssues' => (int) ($movementCounts['production_consumption'] ?? 0),
                'transfers' => $this->transferOutQuery()
                    ->whereBetween('transferred_at', [$startDate->toDateString(), $endDate->toDateString()])
                    ->count(),
                'productionOutputs' => (int) ($movementCounts['production_output'] ?? 0),
                'pendingTransfers' => (clone $pendingTransfers)->count(),
                'pendingProductionOrders' => (clone $openProductionOrders)->where('status', 'pending')->count(),
                'inProgressProductionOrders' => (clone $openProductionOrders)->where('status', 'progress')->count(),
                'lowStockItems' => $this->lowStockQuery()->count(),
                'stockedItems' => InventoryBalance::query()
                    ->where('quantity_on_hand', '>', 0)
                    ->whereHas('location', fn (Builder $query) => $query->whereIn('type', self::AUTHORIZED_LOCATION_TYPES))
                    ->distinct('item_id')
                    ->count('item_id'),
            ],
            'activityTrend' => $this->activityTrend($startDate, $endDate),
            'lowStockItems' => $this->lowStockQuery()
                ->with(['item:id,name,unit,code', 'location:id,name'])
                ->orderByRaw('(quantity_on_hand - reserved) ASC')
                ->limit(6)
                ->get(['id', 'item_id', 'location_id', 'quantity_on_hand', 'reserved'])
                ->map(fn (InventoryBalance $balance): array => [
                    'itemId' => $balance->item_id,
                    'itemName' => $balance->item->name,
                    'itemCode' => $balance->item?->code,
                    'unit' => $balance->item?->unit,
                    'locationId' => $balance->location_id,
                    'locationName' => $balance->location->name,
                    'available' => (float) $balance->quantity_on_hand - (float) $balance->reserved,
                    'reserved' => (float) $balance->reserved,
                ])
                ->values(),
            'attention' => [
                'transfers' => (clone $pendingTransfers)
                    ->with(['source:id,name', 'destination:id,name'])
                    ->latest('id')
                    ->limit(5)
                    ->get(['id', 'source_id', 'destination_id', 'reference_no', 'transferred_at', 'status'])
                    ->map(fn (Transfer $transfer): array => [
                        'id' => $transfer->id,
                        'reference' => $transfer->reference_no,
                        'source' => $transfer->source?->name,
                        'destination' => $transfer->destination?->name,
                        'date' => $transfer->transferred_at,
                    ])
                    ->values(),
                'productionOrders' => (clone $openProductionOrders)
                    ->with('bom.category:id,name')
                    ->latest('updated_at')
                    ->limit(6)
                    ->get(['id', 'bom_id', 'reference_no', 'status', 'ordered_by', 'order_date', 'outputs_confirmed_at', 'updated_at'])
                    ->map(fn (ProductionOrder $order): array => [
                        'id' => $order->id,
                        'reference' => $order->reference_no,
                        'category' => $order->bom?->category?->name,
                        'status' => $order->status,
                        'orderedBy' => $order->ordered_by,
                        'date' => $order->updated_at?->toDateString() ?? $order->order_date,
                        'needsOutputConfirmation' => $order->status === 'progress' && $order->outputs_confirmed_at === null,
                    ])
                    ->values(),
            ],
            'recentTransactions' => $this->recentTransactions($startDate, $endDate),
        ];
    }

    private function activityTrend(CarbonImmutable $startDate, CarbonImmutable $endDate): array
    {
        $dailyReceiptCounts = $this->receiptQuery()
            ->whereBetween('received_at', [$startDate->toDateString(), $endDate->toDateString()])
            ->selectRaw('received_at as activity_date, COUNT(*) as receipt_count')
            ->groupBy('received_at')
            ->get()
            ->keyBy('activity_date');
        $dailyMovementCounts = $this->movementQuery()
            ->whereBetween('occured_at', [$startDate->toDateString(), $endDate->endOfDay()])
            ->whereIn('movement_type', array_keys(self::TREND_TYPES))
            ->selectRaw('DATE(occured_at) as activity_date, movement_type, COUNT(*) as movement_count')
            ->groupByRaw('DATE(occured_at), movement_type')
            ->get()
            ->groupBy(fn (object $row): string => substr((string) $row->activity_date, 0, 10));
        $dailyTransfers = $this->transferOutQuery()
            ->whereBetween('transferred_at', [$startDate->toDateString(), $endDate->toDateString()])
            ->selectRaw('transferred_at as activity_date, COUNT(*) as transfer_count')
            ->groupBy('transferred_at')
            ->get()
            ->keyBy('activity_date');

        return collect(range(0, (int) $startDate->diffInDays($endDate)))
            ->map(function (int $offset) use ($startDate, $dailyReceiptCounts, $dailyMovementCounts, $dailyTransfers): array {
                $date = $startDate->addDays($offset);
                $dayMovements = $dailyMovementCounts->get($date->toDateString(), collect())->keyBy('movement_type');
                $activityDate = $date->toDateString();
                $result = [
                    'date' => $activityDate,
                    'receipts' => (int) ($dailyReceiptCounts->get($activityDate)->receipt_count ?? 0),
                ];

                foreach (self::TREND_TYPES as $movementType => $key) {
                    $result[$key] = (int) ($dayMovements->get($movementType)->movement_count ?? 0);
                }

                $result['transfers'] = (int) ($dailyTransfers->get($date->toDateString())->transfer_count ?? 0);

                return $result;
            })
            ->all();
    }

    private function recentTransactions(CarbonImmutable $startDate, CarbonImmutable $endDate): Collection
    {
        $receipts = $this->receiptQuery()
            ->with('location:id,name')
            ->whereBetween('received_at', [$startDate->toDateString(), $endDate->toDateString()])
            ->latest('received_at')
            ->limit(8)
            ->get(['id', 'destination_location_id', 'reference_no', 'received_at', 'created_at'])
            ->map(fn (GoodsReceipt $receipt): array => [ 
                'id' => 'receipt-'.$receipt->id,
                'reference' => $receipt->reference_no,
                'type' => 'receipt',
                'description' => $receipt->location?->name,
                'date' => $receipt->received_at?->toDateString(),
                'sortAt' => $receipt->created_at?->toIso8601String() ?? $receipt->received_at?->toDateString(),
                'href' => route('receipts.show', $receipt->id),
            ]);

        $transfers = $this->transferQuery()
            ->with(['source:id,name', 'destination:id,name'])
            ->whereBetween('transferred_at', [$startDate->toDateString(), $endDate->toDateString()])
            ->latest('transferred_at')
            ->limit(8)
            ->get(['id', 'source_id', 'destination_id', 'reference_no', 'transferred_at', 'status', 'created_at'])
            ->map(fn (Transfer $transfer): array => [
                'id' => 'transfer-'.$transfer->id,
                'reference' => $transfer->reference_no,
                'type' => 'transfer',
                'description' => ($transfer->source?->name ?? '').' → '.($transfer->destination?->name ?? ''),
                'date' => $transfer->transferred_at,
                'sortAt' => $transfer->created_at?->toIso8601String() ?? $transfer->transferred_at,
                'status' => $transfer->status,
                'href' => route('transfers.show', $transfer->id),
            ]);

        $orders = ProductionOrder::query()
            ->with('bom.category:id,name')
            ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->whereNotIn('status', ['drafted', 'cancelled'])
            ->latest('created_at')
            ->limit(8)
            ->get(['id', 'bom_id', 'reference_no', 'status', 'ordered_by', 'created_at'])
            ->map(fn (ProductionOrder $order): array => [
                'id' => 'production-'.$order->id,
                'reference' => $order->reference_no,
                'type' => 'production',
                'description' => $order->bom?->category?->name ?? $order->ordered_by,
                'date' => $order->created_at?->toDateString(),
                'sortAt' => $order->created_at?->toIso8601String(),
                'status' => $order->status,
                'href' => route('orders.show', $order->id),
            ]);

        $movementRows = $this->movementQuery()
            ->with(['item:id,name,unit', 'location:id,name'])
            ->whereBetween('occured_at', [$startDate->toDateString(), $endDate->endOfDay()])
            ->latest('occured_at')
            ->latest('id')
            ->limit(12)
            ->get(['id', 'location_id', 'item_id', 'movement_type', 'quantity', 'occured_at', 'reference_no', 'created_at'])
            ->map(fn (InventoryMovement $movement): array => [
                'id' => 'movement-'.$movement->id,
                'reference' => $movement->reference_no,
                'type' => $movement->movement_type,
                'description' => $movement->item?->name.' · '.($movement->location?->name ?? ''),
                'quantity' => abs((float) $movement->quantity),
                'unit' => $movement->item?->unit,
                'date' => $movement->occured_at,
                'sortAt' => $movement->created_at?->toIso8601String() ?? $movement->occured_at,
                'href' => route('movements.index', ['movement_id' => $movement->id]),
            ]);

        return $receipts
            ->concat($transfers)
            ->concat($orders)
            ->concat($movementRows)
            ->sortByDesc('sortAt')
            ->take(10)
            ->map(function (array $transaction): array {
                unset($transaction['sortAt']);

                return $transaction;
            })
            ->values();
    }

    private function lowStockQuery(): Builder
    {
        return InventoryBalance::query()
            ->whereRaw('(quantity_on_hand - reserved) <= ?', [InventoryBalance::LOW_STOCK_THRESHOLD])
            ->whereHas('location', fn (Builder $query) => $query->whereIn('type', self::AUTHORIZED_LOCATION_TYPES));
    }

    private function receiptQuery(): Builder
    {
        return GoodsReceipt::query()
            ->whereHas('location', fn (Builder $query) => $query->whereIn('type', self::AUTHORIZED_LOCATION_TYPES));
    }

    private function transferQuery(): Builder
    {
        return Transfer::query()
            ->where(function (Builder $query): void {
                $query->whereHas('source', fn (Builder $location) => $location->whereIn('type', self::AUTHORIZED_LOCATION_TYPES))
                    ->orWhereHas('destination', fn (Builder $location) => $location->whereIn('type', self::AUTHORIZED_LOCATION_TYPES));
            });
    }

    private function transferOutQuery(): Builder
    {
        return Transfer::query()
            ->where('status', 'completed')
            ->whereHas('source', fn (Builder $query) => $query->whereIn('type', self::AUTHORIZED_LOCATION_TYPES));
    }

    private function movementQuery(): Builder
    {
        return InventoryMovement::query()
            ->whereHas('location', fn (Builder $query) => $query->whereIn('type', self::AUTHORIZED_LOCATION_TYPES));
    }
}
