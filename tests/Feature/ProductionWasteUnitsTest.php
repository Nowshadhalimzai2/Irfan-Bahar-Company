<?php

namespace Tests\Feature;

use App\Models\BOM;
use App\Models\Category;
use App\Models\InventoryBalance;
use App\Models\InventoryMovement;
use App\Models\Item;
use App\Models\ItemUnit;
use App\Models\Location;
use App\Models\ProductionInput;
use App\Models\ProductionOrder;
use App\Models\Role;
use App\Models\User;
use App\Models\Waste;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductionWasteUnitsTest extends TestCase
{
    use RefreshDatabase;

    public function test_waste_can_be_entered_in_an_alternate_unit_and_is_saved_in_base_quantity(): void
    {
        $fixture = $this->createFixture();

        $this->actingAs($fixture['user'])
            ->get(route('wastes.create', $fixture['order']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('factory/waste/create')
                ->where('items.0.units.1.conversion_to_base', '12.000000'));

        $this->actingAs($fixture['user'])
            ->post(route('wastes.store', $fixture['order']), [
                'reason' => 'Spillage during factory processing',
                'wastes' => [
                    [
                        'production_order_id' => $fixture['order']->id,
                        'item_id' => $fixture['item']->id,
                        'item_unit_id' => $fixture['box']->id,
                        'wasted_quantity' => 2,
                    ],
                ],
            ])
            ->assertRedirect(route('orders.show', $fixture['order']));

        $this->assertSame(24.0, (float) Waste::query()->value('wasted_quantity'));
        $this->assertSame(-24.0, (float) InventoryMovement::query()->value('quantity'));
        $this->assertSame(6.0, (float) InventoryBalance::query()
            ->where('item_id', $fixture['item']->id)
            ->where('location_id', $fixture['factory']->id)
            ->value('quantity_on_hand'));
    }

    public function test_waste_rejects_units_from_another_item_and_rolls_back_insufficient_stock(): void
    {
        $fixture = $this->createFixture(10);

        $this->actingAs($fixture['user'])
            ->from(route('wastes.create', $fixture['order']))
            ->post(route('wastes.store', $fixture['order']), [
                'reason' => 'Spillage during factory processing',
                'wastes' => [
                    [
                        'production_order_id' => $fixture['order']->id,
                        'item_id' => $fixture['item']->id,
                        'item_unit_id' => $fixture['otherUnit']->id,
                        'wasted_quantity' => 1,
                    ],
                ],
            ])
            ->assertRedirect(route('wastes.create', $fixture['order']))
            ->assertSessionHasErrors('wastes.0.item_unit_id');

        $this->actingAs($fixture['user'])
            ->from(route('wastes.create', $fixture['order']))
            ->post(route('wastes.store', $fixture['order']), [
                'reason' => 'Spillage during factory processing',
                'wastes' => [
                    [
                        'production_order_id' => $fixture['order']->id,
                        'item_id' => $fixture['item']->id,
                        'item_unit_id' => $fixture['box']->id,
                        'wasted_quantity' => 1,
                    ],
                ],
            ])
            ->assertRedirect(route('wastes.create', $fixture['order']));

        $this->assertDatabaseCount('wastes', 0);
        $this->assertDatabaseCount('inventory_movements', 0);
        $this->assertSame(10.0, (float) InventoryBalance::query()
            ->where('item_id', $fixture['item']->id)
            ->where('location_id', $fixture['factory']->id)
            ->value('quantity_on_hand'));
    }

    private function createFixture(float $stock = 30): array
    {
        $role = Role::query()->create(['name' => 'factory_clerk']);
        $user = User::factory()->create(['role_id' => $role->id]);
        $user->status = true;
        $user->save();
        $category = Category::query()->create(['name' => 'waste test']);
        $bom = BOM::query()->create([
            'formula_name' => 'Waste test formula',
            'category_id' => $category->id,
            'min_exp_qty' => 1,
            'max_exp_qty' => 10,
            'is_active' => true,
        ]);
        $item = Item::query()->create([
            'name' => 'Waste test material',
            'item_type' => 'raw_material',
            'unit' => 'kg',
            'code' => 'WASTE-ITEM',
            'sku' => 'WST001',
            'default_sale_price' => 0,
            'category_id' => $category->id,
        ]);
        $baseUnit = ItemUnit::query()->create([
            'item_id' => $item->id,
            'name' => 'kilogram',
            'symbol' => 'kg',
            'conversion_to_base' => 1,
            'code' => 'WASTE-BASE',
            'barcode' => 'WASTE-BASE-BARCODE',
            'selling_price' => 0,
            'purchase_price' => 0,
            'is_active' => true,
        ]);
        $box = ItemUnit::query()->create([
            'item_id' => $item->id,
            'name' => 'box',
            'symbol' => 'box',
            'conversion_to_base' => 12,
            'code' => 'WASTE-BOX',
            'barcode' => 'WASTE-BOX-BARCODE',
            'selling_price' => 0,
            'purchase_price' => 0,
            'is_active' => true,
        ]);
        $item->update(['base_unit_id' => $baseUnit->id]);

        $otherItem = Item::query()->create([
            'name' => 'Other material',
            'item_type' => 'raw_material',
            'unit' => 'kg',
            'code' => 'OTHER-ITEM',
            'sku' => 'OTHER01',
            'default_sale_price' => 0,
            'category_id' => $category->id,
        ]);
        $otherUnit = ItemUnit::query()->create([
            'item_id' => $otherItem->id,
            'name' => 'kilogram',
            'symbol' => 'kg',
            'conversion_to_base' => 1,
            'code' => 'OTHER-BASE',
            'barcode' => 'OTHER-BASE-BARCODE',
            'selling_price' => 0,
            'purchase_price' => 0,
            'is_active' => true,
        ]);

        $order = ProductionOrder::query()->create([
            'ordered_by' => 'Waste test',
            'bom_id' => $bom->id,
            'status' => 'completed',
            'order_date' => now()->toDateString(),
            'reference_no' => 'WASTE-TEST',
        ]);
        ProductionInput::query()->create([
            'production_order_id' => $order->id,
            'item_id' => $item->id,
            'quantity_used' => 20,
        ]);

        $factory = Location::query()->where('name', 'factory')->firstOrFail();
        InventoryBalance::query()->create([
            'location_id' => $factory->id,
            'item_id' => $item->id,
            'quantity_on_hand' => $stock,
            'reserved' => 0,
        ]);

        return compact('user', 'item', 'box', 'otherUnit', 'order', 'factory');
    }
}
