<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Currency;
use App\Models\GoodsReceipt;
use App\Models\InventoryBalance;
use App\Models\InventoryMovement;
use App\Models\Item;
use App\Models\Location;
use App\Models\Role;
use App\Models\Transfer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FactoryDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_displays_scoped_stock_and_real_activity(): void
    {
        $role = Role::query()->create(['name' => 'factory_clerk']);
        $user = User::factory()->create(['role_id' => $role->id]);
        $user->status = true;
        $user->save();
        $category = Category::query()->create(['name' => 'Dashboard test']);
        $factory = Location::query()->where('type', 'factory')->firstOrFail();
        $warehouse = Location::query()->where('type', 'warehouse')->firstOrFail();

        $factoryItem = $this->createItem($category, 'DASHBOARD-FACTORY');
        $lowStockItem = $this->createItem($category, 'DASHBOARD-LOW');
        $warehouseOnlyItem = $this->createItem($category, 'DASHBOARD-WAREHOUSE');
        $shopOnlyItem = $this->createItem($category, 'DASHBOARD-SHOP');

        InventoryBalance::query()->create([
            'location_id' => $factory->id,
            'item_id' => $factoryItem->id,
            'quantity_on_hand' => 15,
            'reserved' => 2,
        ]);
        InventoryBalance::query()->create([
            'location_id' => $factory->id,
            'item_id' => $lowStockItem->id,
            'quantity_on_hand' => 5,
            'reserved' => 0,
        ]);
        InventoryBalance::query()->create([
            'location_id' => $warehouse->id,
            'item_id' => $warehouseOnlyItem->id,
            'quantity_on_hand' => 100,
            'reserved' => 0,
        ]);
        InventoryBalance::query()->create([
            'location_id' => $this->location('shop')->id,
            'item_id' => $shopOnlyItem->id,
            'quantity_on_hand' => 30,
            'reserved' => 0,
        ]);

        $today = now(config('app.timezone'))->toDateString();
        $currency = Currency::query()->create(['name' => 'AFG']);
        GoodsReceipt::query()->create([
            'destination_location_id' => $factory->id,
            'currency_id' => $currency->id,
            'reference_no' => 'GR-DASHBOARD',
            'received_at' => $today,
            'total_amount' => 0,
            'amount_paid' => 0,
        ]);
        $this->createMovement($factory, $factoryItem, 'production_consumption', -2, 'ISSUE-TODAY', $today.' 12:46:45');
        $this->createMovement($factory, $factoryItem, 'production_consumption', -1, 'ISSUE-TODAY-SECOND', $today.' 12:47:13');
        $this->createMovement($factory, $factoryItem, 'production_output', 3, 'OUTPUT-TODAY', $today.' 12:46:45');
        $this->createMovement($warehouse, $lowStockItem, 'receipt', 5, 'RECEIPT-TODAY', $today);
        $this->createMovement($warehouse, $lowStockItem, 'receipt', 2, 'RECEIPT-LINE-TODAY', $today);
        $this->createMovement($this->location('shop'), $warehouseOnlyItem, 'production_consumption', -4, 'ISSUE-SHOP', $today);
        $this->createMovement($factory, $factoryItem, 'production_consumption', -1, 'ISSUE-YESTERDAY', now()->subDay()->toDateString());
        Transfer::query()->create([
            'source_id' => $factory->id,
            'destination_id' => $warehouse->id,
            'reference_no' => 'TR-DASHBOARD',
            'transferred_at' => $today,
            'status' => 'completed',
        ]);

        $yesterday = now(config('app.timezone'))->subDay()->toDateString();
        $this->actingAs($user)
            ->get(route('factory', [
                'start_date' => $yesterday,
                'end_date' => $today,
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('factory/home')
                ->where('summary.stockedItems', 3)
                ->where('summary.lowStockItems', 1)
                ->where('summary.receipts', 1)
                ->where('summary.materialIssues', 3)
                ->where('summary.transfers', 1)
                ->where('summary.productionOutputs', 1)
                ->has('activityTrend', 2)
                ->where('activityTrend.0.date', $yesterday)
                ->where('activityTrend.0.issues', 1)
                ->where('activityTrend.1.date', $today)
                ->where('activityTrend.1.receipts', 1)
                ->where('activityTrend.1.issues', 2)
                ->where('activityTrend.1.transfers', 1)
                ->where('activityTrend.1.production', 1)
                ->has('recentTransactions', 8));

        $this->get(route('inventory-balances.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('inventory-balance/index')
                ->has('items.data', 3));

        $shopMovement = InventoryMovement::query()->where('reference_no', 'ISSUE-SHOP')->firstOrFail();
        $this->get(route('movements.index', ['movement_id' => $shopMovement->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('inventory-movement/index')
                ->has('movements.data', 0));

        $shopReceipt = GoodsReceipt::query()->create([
            'destination_location_id' => $this->location('shop')->id,
            'currency_id' => $currency->id,
            'reference_no' => 'GR-SHOP-PRIVATE',
            'received_at' => $today,
            'total_amount' => 0,
            'amount_paid' => 0,
        ]);
        $this->get(route('receipts.show', $shopReceipt->id))->assertForbidden();

        $privateTransfer = Transfer::query()->create([
            'source_id' => $this->location('office')->id,
            'destination_id' => $this->location('shop')->id,
            'reference_no' => 'TR-PRIVATE',
            'transferred_at' => $today,
            'status' => 'suggested',
        ]);
        $this->get(route('transfers.show', $privateTransfer->id))->assertForbidden();

        Transfer::query()->create([
            'source_id' => $warehouse->id,
            'destination_id' => $factory->id,
            'reference_no' => 'TR-IN-SCOPE',
            'transferred_at' => $today,
            'status' => 'suggested',
        ]);
        $this->get(route('receipts.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('goods-receipt/index')
                ->has('transfers.data', 2));
    }

    public function test_dashboard_is_restricted_to_factory_clerks(): void
    {
        $shopRole = Role::query()->create(['name' => 'shop_clerk']);
        $shopClerk = User::factory()->create(['role_id' => $shopRole->id]);

        $this->actingAs($shopClerk)
            ->get(route('factory'))
            ->assertForbidden();
    }

    public function test_activity_trend_counts_only_completed_outgoing_transfers(): void
    {
        $role = Role::query()->create(['name' => 'factory_clerk']);
        $user = User::factory()->create(['role_id' => $role->id]);
        $user->status = true;
        $user->save();
        $factory = Location::query()->where('type', 'factory')->firstOrFail();
        $warehouse = Location::query()->where('type', 'warehouse')->firstOrFail();
        $office = Location::query()->where('type', 'office')->firstOrFail();
        $today = now(config('app.timezone'))->toDateString();

        Transfer::query()->create([
            'source_id' => $factory->id,
            'destination_id' => $office->id,
            'reference_no' => 'TR-COMPLETED-OUT',
            'transferred_at' => $today,
            'status' => 'completed',
        ]);
        Transfer::query()->create([
            'source_id' => $factory->id,
            'destination_id' => $warehouse->id,
            'reference_no' => 'TR-PENDING-OUT',
            'transferred_at' => $today,
            'status' => 'suggested',
        ]);
        Transfer::query()->create([
            'source_id' => $office->id,
            'destination_id' => $factory->id,
            'reference_no' => 'TR-COMPLETED-IN',
            'transferred_at' => $today,
            'status' => 'completed',
        ]);

        $this->actingAs($user)
            ->get(route('factory', [
                'start_date' => $today,
                'end_date' => $today,
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('summary.transfers', 1)
                ->where('activityTrend.0.transfers', 1));
    }

    public function test_dashboard_rejects_date_ranges_longer_than_31_days(): void
    {
        $role = Role::query()->create(['name' => 'factory_clerk']);
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->actingAs($user)
            ->get(route('factory', [
                'start_date' => '2026-01-01',
                'end_date' => '2026-02-02',
            ]))
            ->assertSessionHasErrors('start_date');
    }

    private function createItem(Category $category, string $code): Item
    {
        return Item::query()->create([
            'name' => $code,
            'item_type' => 'raw_material',
            'unit' => 'kg',
            'code' => $code,
            'sku' => $code,
            'default_sale_price' => 0,
            'category_id' => $category->id,
        ]);
    }

    private function createMovement(
        Location $location,
        Item $item,
        string $type,
        float $quantity,
        string $reference,
        string $date,
    ): InventoryMovement {
        return InventoryMovement::query()->create([
            'location_id' => $location->id,
            'item_id' => $item->id,
            'movement_type' => $type,
            'quantity' => $quantity,
            'reference_no' => $reference,
            'occured_at' => $date,
            'notes' => '',
        ]);
    }

    private function location(string $type): Location
    {
        return Location::query()->where('type', $type)->firstOrFail();
    }
}
