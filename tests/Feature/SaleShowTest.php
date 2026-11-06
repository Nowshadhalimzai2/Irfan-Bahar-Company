<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Currency;
use App\Models\Invoice;
use App\Models\Item;
use App\Models\ItemUnit;
use App\Models\Location;
use App\Models\Payment;
use App\Models\Role;
use App\Models\Sale;
use App\Models\SaleLine;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SaleShowTest extends TestCase
{
    use RefreshDatabase;

    public function test_sale_details_are_available_without_an_invoice(): void
    {
        $fixture = $this->createSaleFixture();
        $fixture['sale']->update(['amount_paid' => 50]);

        $this->actingAs($fixture['user'])
            ->get(route('sales.show', $fixture['sale']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('sale/show')
                ->where('sale.id', $fixture['sale']->id)
                ->where('sale.invoice', null)
                ->where('sale.lines.0.unit', 'Box')
                ->where('sale.lines.0.base_quantity', 12)
                ->where('sale.lines.0.unit_price', 100)
                ->where('sale.financial_summary.due', 130)
                ->has('sale.payments', 0)
                ->has('sale.returns', 0));
    }

    public function test_sale_details_include_invoice_and_payment_information_when_present(): void
    {
        $fixture = $this->createSaleFixture();
        $invoice = Invoice::query()->create([
            'sale_id' => $fixture['sale']->id,
            'invoice_number' => 'SALE-SHOW-001',
            'status' => 'partially_paid',
            'issued_on' => now()->toDateString(),
            'bill_to_name' => 'Show test customer',
            'currency' => $fixture['currency']->name,
            'subtotal' => 200,
            'discount_total' => 20,
            'total' => 180,
        ]);
        Payment::query()->create([
            'invoice_id' => $invoice->id,
            'amount' => 50,
            'method' => 'cash',
            'currency_id' => $fixture['currency']->id,
            'paid_at' => now(),
            'payment_number' => 'PAY-SHOW-001',
        ]);

        $this->actingAs($fixture['user'])
            ->get(route('sales.show', $fixture['sale']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('sale/show')
                ->where('sale.invoice.number', 'SALE-SHOW-001')
                ->where('sale.payments.0.number', 'PAY-SHOW-001')
                ->where('sale.payments.0.amount', 50)
                ->where('sale.financial_summary.due', 130));
    }

    /**
     * @return array{user: User, currency: Currency, location: Location, sale: Sale}
     */
    private function createSaleFixture(): array
    {
        $role = Role::query()->create(['name' => 'shop_clerk']);
        $user = User::factory()->create(['role_id' => $role->id]);
        $currency = Currency::query()->create(['name' => 'AFG']);
        $location = Location::query()->create([
            'name' => 'Sale details shop',
            'type' => 'shop',
            'address' => 'Test address',
            'is_active' => true,
        ]);
        $category = Category::query()->create(['name' => 'Sale details category']);
        $item = Item::query()->create([
            'name' => 'Sale details item',
            'item_type' => 'product',
            'unit' => 'unit',
            'code' => 'DETAIL-ITEM',
            'sku' => 'DETAIL-ITEM',
            'category_id' => $category->id,
        ]);
        $unit = ItemUnit::query()->create([
            'item_id' => $item->id,
            'name' => 'Box',
            'symbol' => 'bx',
            'conversion_to_base' => 6,
            'code' => 'DETAIL-BOX',
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
            'amount_paid' => 0,
            'sold_at' => now(),
            'notes' => 'Sale detail notes',
        ]);
        SaleLine::query()->create([
            'sale_id' => $sale->id,
            'item_id' => $item->id,
            'item_unit_id' => $unit->id,
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

        return compact('user', 'currency', 'location', 'sale');
    }
}
