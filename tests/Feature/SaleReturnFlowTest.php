<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Currency;
use App\Models\InventoryBalance;
use App\Models\InventoryMovement;
use App\Models\Invoice;
use App\Models\Item;
use App\Models\ItemUnit;
use App\Models\Location;
use App\Models\Payment;
use App\Models\Role;
use App\Models\Sale;
use App\Models\SaleLine;
use App\Models\SaleReturn;
use App\Models\SaleReturnLine;
use App\Models\ShopAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleReturnFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_page_allows_a_completed_sale_and_rejects_cancelled_sales(): void
    {
        $fixture = $this->createFixture();

        $this->actingAs($fixture['user'])
            ->get(route('sales.returns.create', $fixture['sale']))
            ->assertOk();

        $fixture['sale']->update(['status' => 'cancelled']);
        $this->actingAs($fixture['user'])
            ->get(route('sales.returns.create', $fixture['sale']))
            ->assertForbidden();
    }

    public function test_return_uses_sale_unit_snapshot_and_restocks_base_quantity(): void
    {
        $fixture = $this->createFixture();
        InventoryBalance::query()->create([
            'location_id' => $fixture['location']->id,
            'item_id' => $fixture['item']->id,
            'quantity_on_hand' => 0,
            'reserved' => 0,
        ]);

        $this->actingAs($fixture['user'])
            ->post(route('sales.returns.store', $fixture['sale']), $this->returnData($fixture, [
                'quantity' => 1,
            ]))
            ->assertRedirect(route('sales.index'))
            ->assertSessionHasNoErrors();

        $return = SaleReturn::query()->with('lines')->firstOrFail();
        $line = $return->lines->sole();
        $this->assertSame($fixture['location']->id, $return->location_id);
        $this->assertSame($fixture['box']->id, $line->item_unit_id);
        $this->assertSame(6.0, (float) $line->conversion_factor);
        $this->assertSame(6.0, (float) $line->base_quantity);
        $this->assertSame(100.0, (float) $line->unit_price);
        $this->assertSame(90.0, (float) $line->line_total);
        $this->assertSame(6.0, (float) InventoryBalance::query()->value('quantity_on_hand'));
        $this->assertSame(90.0, (float) $return->total);
        $this->assertSame(6.0, (float) InventoryMovement::query()->value('quantity'));
    }

    public function test_cash_refunds_cannot_exceed_paid_value_after_prior_returns(): void
    {
        $fixture = $this->createFixture(withInvoice: true, paidAmount: 100);
        $account = ShopAccount::query()->create([
            'currency_id' => $fixture['currency']->id,
            'amount' => 200,
        ]);
        $this->actingAs($fixture['user'])
            ->post(route('sales.returns.store', $fixture['sale']), $this->returnData($fixture, [
                'quantity' => 1,
                'refund_amount' => 10,
                'refund_method' => 'cash',
            ]))
            ->assertRedirect(route('sales.index'))
            ->assertSessionHasNoErrors();

        $this->actingAs($fixture['user'])
            ->from(route('sales.returns.create', $fixture['sale']))
            ->post(route('sales.returns.store', $fixture['sale']), $this->returnData($fixture, [
                'quantity' => 1,
                'refund_amount' => 91,
                'refund_method' => 'cash',
            ]))
            ->assertRedirect(route('sales.returns.create', $fixture['sale']))
            ->assertSessionHasErrors('refund_amount');

        $this->assertSame(190.0, (float) $account->fresh()->amount);
        $this->assertSame(1, SaleReturn::query()->count());
    }

    public function test_non_cash_refunds_do_not_debit_the_cash_account(): void
    {
        $fixture = $this->createFixture(withInvoice: true, paidAmount: 100);
        $account = ShopAccount::query()->create([
            'currency_id' => $fixture['currency']->id,
            'amount' => 200,
        ]);

        $this->actingAs($fixture['user'])
            ->post(route('sales.returns.store', $fixture['sale']), $this->returnData($fixture, [
                'quantity' => 2,
                'refund_amount' => 100,
                'refund_method' => 'bank_transfer',
            ]))
            ->assertRedirect(route('sales.index'))
            ->assertSessionHasNoErrors();

        $this->assertSame(200.0, (float) $account->fresh()->amount);
        $this->assertSame('bank_transfer', SaleReturn::query()->value('refund_method'));
        $this->assertSame('returned', $fixture['sale']->fresh()->status);
    }

    /**
     * @return array{user: User, currency: Currency, location: Location, item: Item, box: ItemUnit, sale: Sale, saleLine: SaleLine, invoice: Invoice|null}
     */
    private function createFixture(bool $withInvoice = false, float $paidAmount = 0): array
    {
        $role = Role::query()->create(['name' => 'shop_clerk']);
        $user = User::factory()->create(['role_id' => $role->id]);
        $user->status = true;
        $user->save();
        $currency = Currency::query()->create(['name' => 'AFG']);
        $location = Location::query()->create([
            'name' => 'Returns shop',
            'type' => 'shop',
            'address' => 'Test address',
            'is_active' => true,
        ]);
        $category = Category::query()->create(['name' => 'Sale return category']);
        $item = Item::query()->create([
            'name' => 'Sale return item',
            'item_type' => 'product',
            'unit' => 'unit',
            'code' => 'RETURN-ITEM',
            'sku' => 'RETURN-ITEM',
            'category_id' => $category->id,
        ]);
        $box = ItemUnit::query()->create([
            'item_id' => $item->id,
            'name' => 'Box',
            'symbol' => 'bx',
            'conversion_to_base' => 6,
            'code' => 'RETURN-BOX',
            'selling_price' => 100,
            'purchase_price' => 50,
            'is_active' => true,
        ]);
        $sale = Sale::query()->create([
            'currency_id' => $currency->id,
            'location_id' => $location->id,
            'created_by' => $user->id,
            'status' => 'completed',
            'total' => 200,
            'discount_total' => 20,
            'after_descount_total' => 180,
            'amount_paid' => $paidAmount,
            'sold_at' => now(),
        ]);
        $saleLine = SaleLine::query()->create([
            'sale_id' => $sale->id,
            'item_id' => $item->id,
            'item_unit_id' => $box->id,
            'unit' => 'unit',
            'quantity' => 2,
            'conversion_factor' => 6,
            'base_quantity' => 12,
            'unit_cost' => 50,
            'unit_price' => 100,
            'discount' => 10,
            'discount_total' => 20,
            'line_total' => 200,
        ]);
        $invoice = null;
        if ($withInvoice) {
            $invoice = Invoice::query()->create([
                'sale_id' => $sale->id,
                'invoice_number' => 'RETURN-' . $sale->id,
                'status' => 'paid',
                'issued_on' => now()->toDateString(),
                'bill_to_name' => 'Walk-in customer',
                'currency' => $currency->name,
                'subtotal' => 200,
                'discount_total' => 20,
                'total' => 180,
            ]);
            Payment::query()->create([
                'invoice_id' => $invoice->id,
                'amount' => $paidAmount,
                'method' => 'cash',
                'currency_id' => $currency->id,
                'paid_at' => now(),
            ]);
        }

        return compact('user', 'currency', 'location', 'item', 'box', 'sale', 'saleLine', 'invoice');
    }

    /**
     * @param array{quantity: int, refund_amount?: int, refund_method?: string} $overrides
     * @return array<string, mixed>
     */
    private function returnData(array $fixture, array $overrides): array
    {
        return [
            'location_id' => $fixture['location']->id,
            'refund_amount' => $overrides['refund_amount'] ?? 0,
            'refund_method' => $overrides['refund_method'] ?? null,
            'lines' => [[
                'sale_line_id' => $fixture['saleLine']->id,
                'quantity' => $overrides['quantity'],
                'condition' => 'good',
                'restock_action' => 'restock',
            ]],
        ];
    }
}
