<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Currency;
use App\Models\InventoryBalance;
use App\Models\Invoice;
use App\Models\Item;
use App\Models\ItemUnit;
use App\Models\Location;
use App\Models\Role;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleMultipleUnitsTest extends TestCase
{
    use RefreshDatabase;

    public function test_sale_converts_each_selected_unit_to_base_stock_and_restores_it_to_the_same_location_when_cancelled(): void
    {
        $fixture = $this->createSaleFixture();
        $response = $this->actingAs($fixture['user'])->post(route('sales.store'), [
            'location_id' => $fixture['location']->id,
            'customer_id' => null,
            'currency_id' => $fixture['currency']->id,
            'sold_at' => now()->toDateTimeString(),
            'discount_total' => 10,
            'amount_paid' => 90,
            'saleLines' => [
                [
                    'item_id' => $fixture['item']->id,
                    'item_unit_id' => $fixture['piece']->id,
                    'quantity' => 2,
                ],
                [
                    'item_id' => $fixture['item']->id,
                    'item_unit_id' => $fixture['box']->id,
                    'quantity' => 1,
                ],
            ],
        ]);

        $response->assertRedirect(route('sales.create'));
        $response->assertSessionHasNoErrors();

        $sale = Sale::query()->with('saleLines')->firstOrFail();
        $this->assertSame($fixture['location']->id, $sale->location_id);
        $this->assertSame(100.0, (float) $sale->total);
        $this->assertSame(90.0, (float) $sale->after_descount_total);
        $this->assertSame(10.0, round((float) $sale->saleLines->sum('discount_total'), 2));
        $pieceLine = $sale->saleLines->firstWhere('item_unit_id', $fixture['piece']->id);
        $boxLine = $sale->saleLines->firstWhere('item_unit_id', $fixture['box']->id);
        $this->assertSame(10.0, (float) $pieceLine->discount);
        $this->assertSame(4.0, (float) $pieceLine->unit_cost);
        $this->assertSame(30.0, (float) $boxLine->unit_cost);
        $this->assertSame(6.0, (float) $boxLine->base_quantity);
        $this->assertSame(8.0, round((float) $sale->saleLines->sum('base_quantity'), 3));
        $this->assertSame(2.0, (float) InventoryBalance::query()
            ->where('item_id', $fixture['item']->id)
            ->where('location_id', $fixture['location']->id)
            ->value('quantity_on_hand'));

        $this->actingAs($fixture['user'])
            ->put(route('sales.cancel', $sale))
            ->assertRedirect();

        $this->assertSame('cancelled', $sale->fresh()->status);
        $this->assertSame(10.0, (float) InventoryBalance::query()
            ->where('item_id', $fixture['item']->id)
            ->where('location_id', $fixture['location']->id)
            ->value('quantity_on_hand'));
    }

    public function test_discount_cannot_exceed_the_sale_subtotal(): void
    {
        $fixture = $this->createSaleFixture();

        $response = $this->actingAs($fixture['user'])->from(route('sales.create'))->post(route('sales.store'), [
            'location_id' => $fixture['location']->id,
            'customer_id' => null,
            'currency_id' => $fixture['currency']->id,
            'sold_at' => now()->toDateTimeString(),
            'discount_total' => 11,
            'amount_paid' => 0,
            'saleLines' => [
                [
                    'item_id' => $fixture['item']->id,
                    'item_unit_id' => $fixture['piece']->id,
                    'quantity' => 1,
                ],
            ],
        ]);

        $response->assertRedirect(route('sales.create'));
        $response->assertSessionHasErrors('discount_total');
        $this->assertDatabaseCount('sales', 0);
    }

    public function test_combined_quantities_in_different_units_cannot_oversell_stock(): void
    {
        $fixture = $this->createSaleFixture();

        $response = $this->actingAs($fixture['user'])->from(route('sales.create'))->post(route('sales.store'), [
            'location_id' => $fixture['location']->id,
            'customer_id' => null,
            'currency_id' => $fixture['currency']->id,
            'sold_at' => now()->toDateTimeString(),
            'discount_total' => 0,
            'amount_paid' => 0,
            'saleLines' => [
                [
                    'item_id' => $fixture['item']->id,
                    'item_unit_id' => $fixture['piece']->id,
                    'quantity' => 5,
                ],
                [
                    'item_id' => $fixture['item']->id,
                    'item_unit_id' => $fixture['box']->id,
                    'quantity' => 1,
                ],
            ],
        ]);

        $response->assertRedirect(route('sales.create'));
        $response->assertSessionHasErrors('saleLines');
        $this->assertDatabaseCount('sales', 0);
        $this->assertSame(10.0, (float) InventoryBalance::query()
            ->where('item_id', $fixture['item']->id)
            ->where('location_id', $fixture['location']->id)
            ->value('quantity_on_hand'));
    }

    public function test_invoices_use_sequential_numbers_and_keep_zero_discounted_totals(): void
    {
        $fixture = $this->createSaleFixture();

        foreach ([10, 0] as $index => $discount) {
            $amountPaid = 10 - $discount;
            $response = $this->actingAs($fixture['user'])->post(route('sales.store'), [
                'location_id' => $fixture['location']->id,
                'customer_id' => null,
                'currency_id' => $fixture['currency']->id,
                'sold_at' => now()->toDateTimeString(),
                'discount_total' => $discount,
                'amount_paid' => $amountPaid,
                'create_invoice' => true,
                'saleLines' => [
                    [
                        'item_id' => $fixture['item']->id,
                        'item_unit_id' => $fixture['piece']->id,
                        'quantity' => 1,
                    ],
                ],
            ]);

            $sale = Sale::query()->latest('id')->firstOrFail();
            $response->assertRedirect(route('sales.invoice.print', $sale));

            $invoice = Invoice::query()->where('sale_id', $sale->id)->firstOrFail();
            $this->assertSame(
                'INV-'.now()->format('Y').'-'.str_pad((string) ($index + 1), 6, '0', STR_PAD_LEFT),
                $invoice->invoice_number,
            );
            $this->assertSame((float) $amountPaid, (float) $invoice->total);
        }
    }

    /**
     * @return array{user: User, currency: Currency, location: Location, item: Item, piece: ItemUnit, box: ItemUnit}
     */
    private function createSaleFixture(): array
    {
        $role = Role::query()->create(['name' => 'shop_clerk']);
        $user = User::factory()->create(['role_id' => $role->id]);
        $currency = Currency::query()->create(['name' => 'AFG']);
        $location = Location::query()->create([
            'name' => 'second shop',
            'address' => 'Second shop',
            'type' => 'shop',
            'is_active' => true,
        ]);
        $category = Category::query()->create(['name' => 'sale test']);
        $item = Item::query()->create([
            'name' => 'Test item',
            'item_type' => 'product',
            'unit' => 'unit',
            'code' => 'SALE-ITEM',
            'sku' => 'SALE-ITEM',
            'default_sale_price' => 10,
            'category_id' => $category->id,
        ]);
        $piece = ItemUnit::query()->create([
            'item_id' => $item->id,
            'name' => 'piece',
            'symbol' => 'pc',
            'conversion_to_base' => 1,
            'code' => 'SALE-PIECE',
            'barcode' => 'SALE-PIECE-BARCODE',
            'selling_price' => 10,
            'purchase_price' => 4,
            'is_active' => true,
        ]);
        $box = ItemUnit::query()->create([
            'item_id' => $item->id,
            'name' => 'box',
            'symbol' => 'bx',
            'conversion_to_base' => 6,
            'code' => 'SALE-BOX',
            'barcode' => 'SALE-BOX-BARCODE',
            'selling_price' => 80,
            'purchase_price' => 30,
            'is_active' => true,
        ]);
        $item->update(['base_unit_id' => $piece->id]);
        InventoryBalance::query()->create([
            'location_id' => $location->id,
            'item_id' => $item->id,
            'quantity_on_hand' => 10,
            'reserved' => 0,
        ]);

        return compact('user', 'currency', 'location', 'item', 'piece', 'box');
    }
}
