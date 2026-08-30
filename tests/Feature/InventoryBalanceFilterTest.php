<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryBalance;
use App\Models\Item;
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

        InventoryBalance::create([
            'item_id' => $productItem->id,
            'location_id' => 1,
            'quantity_on_hand' => 10,
            'reserved' => 0,
        ]);

        InventoryBalance::create([
            'item_id' => $rawItem->id,
            'location_id' => 1,
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
}
