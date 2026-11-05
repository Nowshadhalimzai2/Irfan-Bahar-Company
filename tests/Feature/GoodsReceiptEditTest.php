<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Currency;
use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptLine;
use App\Models\InventoryBalance;
use App\Models\InventoryMovement;
use App\Models\Item;
use App\Models\ItemUnit;
use App\Models\Location;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GoodsReceiptEditTest extends TestCase
{
    use RefreshDatabase;

    public function test_receipt_edit_updates_lines_and_reconciles_inventory(): void
    {
        $fixture = $this->createFixture();
        InventoryBalance::query()->create([
            'location_id' => $fixture['location']->id,
            'item_id' => $fixture['item']->id,
            'quantity_on_hand' => 15,
            'reserved' => 2,
        ]);

        $this->actingAs($fixture['user'])
            ->put(route('receipts.update', $fixture['receipt']), $this->receiptData($fixture, [
                'quantity' => 7,
                'unit_cost' => 12,
            ]))
            ->assertRedirect(route('receipts.show', $fixture['receipt']));

        $this->assertSame(17.0, (float) InventoryBalance::query()
            ->where('location_id', $fixture['location']->id)
            ->where('item_id', $fixture['item']->id)
            ->value('quantity_on_hand'));
        $this->assertSame(7.0, (float) $fixture['line']->fresh()->quantity);
        $this->assertSame(84.0, (float) $fixture['receipt']->fresh()->total_amount);
        $this->assertSame(1, InventoryMovement::query()->count());
        $this->assertSame(2.0, (float) InventoryMovement::query()->value('quantity'));
    }

    public function test_receipt_edit_rolls_back_when_reversal_exceeds_available_stock(): void
    {
        $fixture = $this->createFixture();
        InventoryBalance::query()->create([
            'location_id' => $fixture['location']->id,
            'item_id' => $fixture['item']->id,
            'quantity_on_hand' => 5,
            'reserved' => 2,
        ]);

        $this->actingAs($fixture['user'])
            ->from(route('receipts.edit', $fixture['receipt']))
            ->put(route('receipts.update', $fixture['receipt']), $this->receiptData($fixture, [
                'quantity' => 1,
                'unit_cost' => 10,
            ]))
            ->assertRedirect(route('receipts.edit', $fixture['receipt']))
            ->assertSessionHasErrors('receiptLines');

        $this->assertSame(50.0, (float) $fixture['receipt']->fresh()->total_amount);
        $this->assertSame(5.0, (float) $fixture['line']->fresh()->quantity);
        $this->assertSame(5.0, (float) InventoryBalance::query()
            ->where('location_id', $fixture['location']->id)
            ->where('item_id', $fixture['item']->id)
            ->value('quantity_on_hand'));
        $this->assertSame(0, InventoryMovement::query()->count());
    }

    public function test_receipt_edit_moves_inventory_when_destination_changes(): void
    {
        $fixture = $this->createFixture();
        $newLocation = Location::query()->create([
            'name' => 'Second warehouse',
            'type' => 'warehouse',
            'address' => 'Test address',
        ]);
        InventoryBalance::query()->create([
            'location_id' => $fixture['location']->id,
            'item_id' => $fixture['item']->id,
            'quantity_on_hand' => 5,
            'reserved' => 0,
        ]);

        $this->actingAs($fixture['user'])
            ->put(route('receipts.update', $fixture['receipt']), array_merge(
                $this->receiptData($fixture, ['quantity' => 5, 'unit_cost' => 10]),
                ['destination_location_id' => $newLocation->id],
            ))
            ->assertRedirect(route('receipts.show', $fixture['receipt']));

        $this->assertSame(
            0.0,
            (float) InventoryBalance::query()
                ->where('location_id', $fixture['location']->id)
                ->where('item_id', $fixture['item']->id)
                ->value('quantity_on_hand'),
        );
        $this->assertSame(
            5.0,
            (float) InventoryBalance::query()
                ->where('location_id', $newLocation->id)
                ->where('item_id', $fixture['item']->id)
                ->value('quantity_on_hand'),
        );
        $this->assertSame($newLocation->id, $fixture['receipt']->fresh()->destination_location_id);
        $this->assertEqualsCanonicalizing(
            [-5.0, 5.0],
            InventoryMovement::query()->pluck('quantity')->map(fn ($quantity) => (float) $quantity)->all(),
        );
    }

    public function test_admin_can_edit_receipts_across_locations(): void
    {
        $fixture = $this->createFixture();
        $adminRole = Role::query()->create(['name' => 'admin']);
        $admin = User::factory()->create(['role_id' => $adminRole->id]);
        $admin->status = true;
        $admin->save();
        $office = Location::query()->where('type', 'office')->firstOrFail();
        InventoryBalance::query()->create([
            'location_id' => $fixture['location']->id,
            'item_id' => $fixture['item']->id,
            'quantity_on_hand' => 5,
            'reserved' => 0,
        ]);

        $this->actingAs($admin)
            ->get(route('receipts.edit', $fixture['receipt']))
            ->assertOk();

        $this->actingAs($admin)
            ->put(route('receipts.update', $fixture['receipt']), array_merge(
                $this->receiptData($fixture, ['quantity' => 5, 'unit_cost' => 10]),
                ['destination_location_id' => $office->id],
            ))
            ->assertRedirect(route('receipts.show', $fixture['receipt']));

        $this->assertSame($office->id, $fixture['receipt']->fresh()->destination_location_id);
    }

    public function test_receipt_total_cannot_be_reduced_below_amount_paid(): void
    {
        $fixture = $this->createFixture();
        $fixture['receipt']->update(['amount_paid' => 30]);

        $this->actingAs($fixture['user'])
            ->from(route('receipts.edit', $fixture['receipt']))
            ->put(route('receipts.update', $fixture['receipt']), $this->receiptData($fixture, [
                'quantity' => 2,
                'unit_cost' => 10,
            ]))
            ->assertRedirect(route('receipts.edit', $fixture['receipt']))
            ->assertSessionHasErrors('receiptLines');

        $this->assertSame(50.0, (float) $fixture['receipt']->fresh()->total_amount);
        $this->assertSame(5.0, (float) $fixture['line']->fresh()->quantity);
    }

    public function test_supplier_and_currency_cannot_change_after_payment(): void
    {
        $fixture = $this->createFixture();
        $fixture['receipt']->update(['amount_paid' => 10]);
        $otherSupplier = Supplier::query()->create([
            'name' => 'Another supplier',
            'address' => 'Test address',
        ]);
        $otherCurrency = Currency::query()->create(['name' => 'USD']);

        $this->actingAs($fixture['user'])
            ->from(route('receipts.edit', $fixture['receipt']))
            ->put(route('receipts.update', $fixture['receipt']), array_merge(
                $this->receiptData($fixture, ['quantity' => 5, 'unit_cost' => 10]),
                ['supplier_id' => $otherSupplier->id, 'currency_id' => $otherCurrency->id],
            ))
            ->assertRedirect(route('receipts.edit', $fixture['receipt']))
            ->assertSessionHasErrors('supplier_id');

        $this->assertSame($fixture['supplier']->id, $fixture['receipt']->fresh()->supplier_id);
        $this->assertSame($fixture['currency']->id, $fixture['receipt']->fresh()->currency_id);
    }

    /**
     * @return array{user: User, location: Location, currency: Currency, supplier: Supplier, item: Item, unit: ItemUnit, receipt: GoodsReceipt, line: GoodsReceiptLine}
     */
    private function createFixture(): array
    {
        $role = Role::query()->create(['name' => 'factory_clerk']);
        $user = User::factory()->create(['role_id' => $role->id]);
        $user->status = true;
        $user->save();

        $location = Location::query()->where('type', 'warehouse')->firstOrFail();
        $currency = Currency::query()->create(['name' => 'AFG']);
        $supplier = Supplier::query()->create([
            'name' => 'Receipt edit supplier',
            'address' => 'Test address',
        ]);
        $category = Category::query()->create(['name' => 'Receipt edit category']);
        $item = Item::query()->create([
            'name' => 'Receipt edit item',
            'item_type' => 'raw_material',
            'unit' => 'kg',
            'code' => 'EDIT-ITEM',
            'sku' => 'EDIT-ITEM',
            'category_id' => $category->id,
        ]);
        $unit = ItemUnit::query()->create([
            'item_id' => $item->id,
            'name' => 'Kilogram',
            'symbol' => 'kg',
            'conversion_to_base' => 1,
            'code' => 'EDIT-KG',
            'selling_price' => 20,
            'purchase_price' => 10,
            'is_active' => true,
        ]);
        $item->update(['base_unit_id' => $unit->id]);

        $receipt = GoodsReceipt::query()->create([
            'supplier_id' => $supplier->id,
            'destination_location_id' => $location->id,
            'currency_id' => $currency->id,
            'reference_no' => 'GR-EDIT-TEST',
            'received_at' => now()->toDateString(),
            'total_amount' => 50,
            'amount_paid' => 0,
        ]);
        $line = GoodsReceiptLine::query()->create([
            'receipt_id' => $receipt->id,
            'item_id' => $item->id,
            'item_unit_id' => $unit->id,
            'quantity' => 5,
            'conversion_factor' => 1,
            'base_quantity' => 5,
            'unit_cost' => 10,
        ]);

        return compact('user', 'location', 'currency', 'supplier', 'item', 'unit', 'receipt', 'line');
    }

    /**
     * @param array{quantity: int, unit_cost: int} $line
     * @return array<string, mixed>
     */
    private function receiptData(array $fixture, array $line): array
    {
        return [
            'supplier_id' => $fixture['supplier']->id,
            'currency_id' => $fixture['currency']->id,
            'destination_location_id' => $fixture['location']->id,
            'received_at' => now()->toDateString(),
            'notes' => 'Edited receipt',
            'receiptLines' => [[
                'item_id' => $fixture['item']->id,
                'item_unit_id' => $fixture['unit']->id,
                'quantity' => $line['quantity'],
                'unit_cost' => $line['unit_cost'],
            ]],
        ];
    }
}
