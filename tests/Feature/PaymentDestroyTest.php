<?php

namespace Tests\Feature;

use App\Models\Currency;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Role;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\ShopAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentDestroyTest extends TestCase
{
    use RefreshDatabase;

    public function test_destroy_synchronizes_cash_sale_and_return_aware_invoice_totals(): void
    {
        $role = Role::query()->create(['name' => 'shop_clerk']);
        $this->actingAs(User::factory()->create(['role_id' => $role->id]));

        $currency = Currency::query()->create(['name' => 'AFG']);
        $shopAccount = ShopAccount::query()->create([
            'currency_id' => $currency->id,
            'amount' => 200,
        ]);
        $sale = Sale::query()->create([
            'currency_id' => $currency->id,
            'status' => 'partially_returned',
            'total' => 100,
            'discount_total' => 0,
            'after_descount_total' => 100,
            'amount_paid' => 100,
            'sold_at' => now(),
        ]);
        $invoice = Invoice::query()->create([
            'sale_id' => $sale->id,
            'invoice_number' => 'PAYMENT-DESTROY-001',
            'status' => 'partially_refunded',
            'issued_on' => now()->toDateString(),
            'currency' => 'AFG',
            'subtotal' => 100,
            'total' => 100,
        ]);
        $paymentToDelete = Payment::query()->create([
            'invoice_id' => $invoice->id,
            'amount' => 20,
            'method' => 'cash',
            'currency_id' => $currency->id,
            'paid_at' => now()->subDay(),
        ]);
        Payment::query()->create([
            'invoice_id' => $invoice->id,
            'amount' => 80,
            'method' => 'card',
            'currency_id' => $currency->id,
            'paid_at' => now(),
        ]);
        SaleReturn::query()->create([
            'sale_id' => $sale->id,
            'invoice_id' => $invoice->id,
            'return_number' => 'PAYMENT-RETURN-001',
            'status' => 'refunded',
            'currency' => 'AFG',
            'total' => 30,
            'refund_amount' => 10,
            'requested_at' => now(),
            'received_at' => now(),
            'refunded_at' => now(),
        ]);

        $this->delete(route('payments.destroy', $paymentToDelete))
            ->assertRedirect(route('payments.index'));

        $this->assertDatabaseMissing('payments', ['id' => $paymentToDelete->id]);
        $this->assertDatabaseHas('shop_accounts', [
            'id' => $shopAccount->id,
            'amount' => 180,
        ]);
        $this->assertDatabaseHas('sales', [
            'id' => $sale->id,
            'amount_paid' => 80,
        ]);
        $this->assertDatabaseHas('invoices', [
            'id' => $invoice->id,
            'status' => 'paid',
        ]);
        $this->assertNotNull($invoice->fresh()->paid_at);
    }
}
