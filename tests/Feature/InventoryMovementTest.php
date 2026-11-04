<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Item;
use App\Models\ItemUnit;
use App\Models\Location;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InventoryMovementTest extends TestCase
{
    use RefreshDatabase;

    public function test_movement_list_includes_item_base_unit_and_numeric_quantity(): void
    {
        $role = Role::query()->create(['name' => 'factory_clerk']);
        $user = User::factory()->create(['role_id' => $role->id, 'status' => true]);
        $category = Category::query()->create(['name' => 'Movement test']);
        $item = Item::query()->create([
            'name' => 'Movement item',
            'item_type' => 'raw_material',
            'unit' => 'kg',
            'code' => 'MOVEMENT-ITEM',
            'sku' => 'MOVEMENT-ITEM',
            'default_sale_price' => 0,
            'category_id' => $category->id,
        ]);
        $baseUnit = ItemUnit::query()->create([
            'item_id' => $item->id,
            'name' => 'kilogram',
            'symbol' => 'kg',
            'conversion_to_base' => 1,
            'code' => 'MOVEMENT-ITEM-KG',
            'selling_price' => 0,
            'is_active' => true,
        ]);
        $item->update(['base_unit_id' => $baseUnit->id]);
        $location = Location::query()->where('type', 'factory')->firstOrFail();
        $movement = InventoryMovement::query()->create([
            'location_id' => $location->id,
            'item_id' => $item->id,
            'movement_type' => 'receipt',
            'quantity' => 12.375,
            'reference_no' => 'MOVEMENT-TEST',
            'occured_at' => now()->toDateString(),
            'notes' => '',
        ]);

        $this->actingAs($user)
            ->get(route('movements.index', ['movement_id' => $movement->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('inventory-movement/index')
                ->where('movements.data.0.item.base_unit.name', 'kilogram')
                ->where('movements.data.0.item.base_unit.symbol', 'kg')
                ->where('movements.data.0.quantity', 12.375));
    }
}
