<?php

namespace Tests\Feature;

use App\Models\BOM;
use App\Models\BOMLine;
use App\Models\Category;
use App\Models\InventoryBalance;
use App\Models\InventoryMovement;
use App\Models\Item;
use App\Models\ItemUnit;
use App\Models\Location;
use App\Models\Product;
use App\Models\ProductionInput;
use App\Models\ProductionOrder;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductionOrderCompletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_pending_order_cannot_skip_progress_or_output_confirmation(): void
    {
        $fixture = $this->createFixture();

        $this->actingAs($fixture['user'])
            ->put("/factory/production-orders/{$fixture['order']->id}/change-status/completed")
            ->assertUnprocessable();

        $this->actingAs($fixture['user'])
            ->put(route('order-inputs.update', $fixture['order']), [
                'production_order_id' => $fixture['order']->id,
                'status' => 'completed',
                'doesItHaveWaste' => false,
                'orderInputs' => [
                    ['item_id' => $fixture['ingredient']->id, 'quantity_used' => 1],
                ],
            ])
            ->assertUnprocessable();

        $this->assertSame('pending', $fixture['order']->fresh()->status);
        $this->assertSame(0, InventoryMovement::query()->count());
    }

    public function test_pending_order_requires_available_inputs_before_entering_progress(): void
    {
        $fixture = $this->createFixture();

        $this->actingAs($fixture['user'])
            ->put("/factory/production-orders/{$fixture['order']->id}/change-status/progress")
            ->assertUnprocessable();
        $this->assertSame('pending', $fixture['order']->fresh()->status);

        $factory = Location::query()->where('name', 'factory')->firstOrFail();
        InventoryBalance::query()->create([
            'location_id' => $factory->id,
            'item_id' => $fixture['ingredient']->id,
            'quantity_on_hand' => 20,
            'reserved' => 0,
        ]);

        $this->actingAs($fixture['user'])
            ->put("/factory/production-orders/{$fixture['order']->id}/change-status/progress")
            ->assertRedirect(route('orders.show', $fixture['order']));

        $this->assertSame('progress', $fixture['order']->fresh()->status);
    }

    public function test_confirming_outputs_recalculates_bom_inputs_and_rejects_other_categories(): void
    {
        $fixture = $this->createFixture('progress');

        $this->actingAs($fixture['user'])
            ->put(route('orders.update-outputs', [$fixture['order'], 'completed']), [
                'production_order_id' => $fixture['order']->id,
                'status' => 'completed',
                'outputs' => [
                    ['item_id' => $fixture['otherProduct']->id, 'quantity_produced' => 5],
                ],
            ])
            ->assertUnprocessable();

        $this->assertNull($fixture['order']->fresh()->outputs_confirmed_at);
        $this->assertSame(8.0, (float) $fixture['order']->productionInputs()->value('quantity_used'));

        $this->actingAs($fixture['user'])
            ->put(route('orders.update-outputs', [$fixture['order'], 'completed']), [
                'production_order_id' => $fixture['order']->id,
                'status' => 'completed',
                'outputs' => [
                    ['item_id' => $fixture['product']->id, 'quantity_produced' => 5],
                ],
            ])
            ->assertRedirect(route('orders.confirm-inputs', [$fixture['order']->id, 'completed']));

        $this->assertNotNull($fixture['order']->fresh()->outputs_confirmed_at);
        $this->assertSame(2.0, (float) $fixture['order']->productionInputs()->value('quantity_used'));
    }

    public function test_confirmed_progress_order_consumes_inputs_and_adds_outputs_atomically(): void
    {
        $fixture = $this->createFixture('progress');
        $factory = Location::query()->where('name', 'factory')->firstOrFail();
        InventoryBalance::query()->create([
            'location_id' => $factory->id,
            'item_id' => $fixture['ingredient']->id,
            'quantity_on_hand' => 20,
            'reserved' => 0,
        ]);

        $this->actingAs($fixture['user'])
            ->put(route('orders.update-outputs', [$fixture['order'], 'completed']), [
                'production_order_id' => $fixture['order']->id,
                'status' => 'completed',
                'outputs' => [
                    ['item_id' => $fixture['product']->id, 'quantity_produced' => 5],
                ],
            ])
            ->assertRedirect(route('orders.confirm-inputs', [$fixture['order']->id, 'completed']));

        $this->put(route('order-inputs.update', $fixture['order']), [
            'production_order_id' => $fixture['order']->id,
            'status' => 'completed',
            'doesItHaveWaste' => false,
            'orderInputs' => [
                ['item_id' => $fixture['ingredient']->id, 'quantity_used' => 2],
            ],
        ])->assertRedirect(route('orders.show', $fixture['order']));

        $this->assertSame('completed', $fixture['order']->fresh()->status);
        $this->assertSame(18.0, (float) InventoryBalance::query()
            ->where('location_id', $factory->id)
            ->where('item_id', $fixture['ingredient']->id)
            ->value('quantity_on_hand'));
        $this->assertSame(5.0, (float) InventoryBalance::query()
            ->where('location_id', $factory->id)
            ->where('item_id', $fixture['product']->id)
            ->value('quantity_on_hand'));
        $this->assertSame(2, InventoryMovement::query()->count());
    }

    /**
     * @return array{user: User, order: ProductionOrder, ingredient: Item, product: Item, otherProduct: Item}
     */
    private function createFixture(string $status = 'pending'): array
    {
        $role = Role::query()->create(['name' => 'factory_clerk']);
        $user = User::factory()->create(['role_id' => $role->id]);
        $user->status = true;
        $user->save();
        $category = Category::query()->create(['name' => 'production test']);
        $otherCategory = Category::query()->create(['name' => 'other production test']);
        $bom = BOM::query()->create([
            'formula_name' => 'Test formula',
            'category_id' => $category->id,
            'min_exp_qty' => 1,
            'max_exp_qty' => 10,
            'is_active' => true,
        ]);

        $ingredient = $this->createItem($category, 'raw_material', 'TEST-RAW', 'TEST-RAW');
        $ingredientUnit = ItemUnit::query()->create([
            'item_id' => $ingredient->id,
            'name' => 'bag',
            'symbol' => 'bag',
            'conversion_to_base' => 2,
            'code' => 'TEST-RAW-UNIT',
            'barcode' => 'TEST-RAW-UNIT-BARCODE',
            'selling_price' => 0,
            'purchase_price' => 0,
            'is_active' => true,
        ]);
        BOMLine::query()->create([
            'bom_id' => $bom->id,
            'item_id' => $ingredient->id,
            'item_unit_id' => $ingredientUnit->id,
            'required_quantity' => 2,
        ]);

        $product = $this->createItem($category, 'product', 'TEST-PROD', 'TEST-PROD');
        Product::query()->create(['item_id' => $product->id, 'weight' => 1]);
        $otherProduct = $this->createItem($otherCategory, 'product', 'TEST-OTHER', 'TEST-OTHER');
        Product::query()->create(['item_id' => $otherProduct->id, 'weight' => 1]);

        $order = ProductionOrder::query()->create([
            'ordered_by' => 'Test order',
            'bom_id' => $bom->id,
            'status' => $status,
            'order_date' => now()->toDateString(),
            'reference_no' => 'TEST-ORDER',
        ]);
        $order->productionOutputs()->create([
            'product_id' => $product->id,
            'quantity_produced' => 10,
        ]);
        ProductionInput::query()->create([
            'production_order_id' => $order->id,
            'item_id' => $ingredient->id,
            'quantity_used' => 8,
        ]);

        return compact('user', 'order', 'ingredient', 'product', 'otherProduct');
    }

    private function createItem(Category $category, string $type, string $code, string $sku): Item
    {
        return Item::query()->create([
            'name' => $code,
            'item_type' => $type,
            'unit' => 'kg',
            'code' => $code,
            'sku' => $sku,
            'default_sale_price' => 0,
            'category_id' => $category->id,
        ]);
    }
}
