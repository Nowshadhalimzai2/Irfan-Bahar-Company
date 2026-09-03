<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryBalance;
use App\Models\Item;
use App\Models\Location;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryBalanceFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_inventory_balance_index_filters_by_item_type_and_category(): void
    {
        $role = Role::create(['name' => 'shop_clerk']);
        $user = User::factory()->create(['role_id' => $role->id]);
        $this->actingAs($user);

        $soapCategory = Category::create(['name' => 'soap']);
        $packingCategory = Category::create(['name' => 'packing']);

        $productItem = Item::create([
            'name' => 'Soap Product',
            'code' => 'PROD001',
            'sku' => 'SKU001',
            'item_type' => 'product',
            'unit' => 'bag',
            'default_sale_price' => 120.00,
            'category_id' => $soapCategory->id,
        ]);

        $rawItem = Item::create([
            'name' => 'Oil Raw',
            'code' => 'RAW001',
            'sku' => 'SKU002',
            'item_type' => 'raw_material',
            'unit' => 'ltr',
            'default_sale_price' => 80.00,
            'category_id' => $packingCategory->id,
        ]);

        $location = Location::create([
            'name' => 'Main Warehouse',
            'address' => 'Kabul',
            'type' => 'warehouse',
            'is_active' => true,
        ]);

        InventoryBalance::create([
            'item_id' => $productItem->id,
            'location_id' => $location->id,
            'quantity_on_hand' => 10,
            'reserved' => 0,
        ]);

        InventoryBalance::create([
            'item_id' => $rawItem->id,
            'location_id' => $location->id,
            'quantity_on_hand' => 15,
            'reserved' => 0,
        ]);

        $response = $this->get('/inventory-balances?item_type=product');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('inventory-balance/index')
            ->where('items.data.0.name', 'Soap Product'))
            ->assertDontSee('Oil Raw');

        $response = $this->get('/inventory-balances?item_type=raw_material&category=packing');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('inventory-balance/index')
            ->where('items.data.0.name', 'Oil Raw'))
            ->assertDontSee('Soap Product');
    }

    public function test_inventory_balance_index_filters_by_location(): void
    {
        $role = Role::create(['name' => 'shop_clerk']);
        $user = User::factory()->create(['role_id' => $role->id]);
        $this->actingAs($user);

        $category = Category::create(['name' => 'soap']);

        $warehouse = Location::create([
            'name' => 'Main Warehouse',
            'address' => 'Kabul',
            'type' => 'warehouse',
            'is_active' => true,
        ]);
        $shop = Location::create([
            'name' => 'Downtown Shop',
            'address' => 'Kabul',
            'type' => 'shop',
            'is_active' => true,
        ]);

        $warehouseItem = Item::create([
            'name' => 'Warehouse Item',
            'code' => 'PROD101',
            'sku' => 'SKU101',
            'item_type' => 'product',
            'unit' => 'bag',
            'default_sale_price' => 120.00,
            'category_id' => $category->id,
        ]);

        $shopItem = Item::create([
            'name' => 'Shop Item',
            'code' => 'PROD102',
            'sku' => 'SKU102',
            'item_type' => 'product',
            'unit' => 'bag',
            'default_sale_price' => 110.00,
            'category_id' => $category->id,
        ]);

        InventoryBalance::create([
            'item_id' => $warehouseItem->id,
            'location_id' => $warehouse->id,
            'quantity_on_hand' => 9,
            'reserved' => 0,
        ]);

        InventoryBalance::create([
            'item_id' => $shopItem->id,
            'location_id' => $shop->id,
            'quantity_on_hand' => 5,
            'reserved' => 0,
        ]);

        $response = $this->get('/inventory-balances?location_id=' . $warehouse->id);

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('inventory-balance/index')
            ->where('items.data.0.name', 'Warehouse Item'))
            ->assertDontSee('Shop Item');
    }
}
