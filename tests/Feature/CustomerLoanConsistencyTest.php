<?php

namespace Tests\Feature;

use App\Models\Currency;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Role;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerLoanConsistencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_and_payment_screens_share_the_same_net_invoice_balance(): void
    {
        $role = Role::query()->create(['name' => 'admin']);
        $this->actingAs(User::factory()->create(['role_id' => $role->id]));

        $currency = Currency::query()->create(['name' => 'AFG']);
        $customer = Customer::query()->create([
            'name' => 'Loan Consistency Customer',
            'phone' => '0701234567',
            'is_active' => true,
        ]);
        $sale = Sale::query()->create([
            'customer_id' => $customer->id,
            'customer_name' => $customer->name,
            'currency_id' => $currency->id,
            'status' => 'partially_returned',
            'total' => 100,
            'discount_total' => 0,
            'after_descount_total' => 100,
            'amount_paid' => 40,
            'sold_at' => now(),
        ]);
        $invoice = Invoice::query()->create([
            'sale_id' => $sale->id,
            'invoice_number' => 'LOAN-CONSISTENCY-001',
            'status' => 'partially_paid',
            'issued_on' => now()->toDateString(),
            'currency' => 'AFG',
            'subtotal' => 100,
            'total' => 100,
        ]);
        Payment::query()->create([
            'invoice_id' => $invoice->id,
            'amount' => 50,
            'method' => 'cash',
            'currency_id' => $currency->id,
            'paid_at' => now(),
        ]);
        SaleReturn::query()->create([
            'sale_id' => $sale->id,
            'invoice_id' => $invoice->id,
            'return_number' => 'LOAN-RETURN-001',
            'status' => 'refunded',
            'currency' => 'AFG',
            'total' => 20,
            'refund_amount' => 10,
            'requested_at' => now(),
            'received_at' => now(),
            'refunded_at' => now(),
        ]);

        $this->get("/customers/{$customer->id}")
            ->assertOk()
            ->assertInertia(fn($page) => $page
                ->component('customer/show')
                ->where('invoices.0.total', 80)
                ->where('invoices.0.paid', 40)
                ->where('invoices.0.due', 40));

        $this->get("/customers/{$customer->id}/invoices")
            ->assertOk()
            ->assertInertia(fn($page) => $page
                ->component('customer/invoice')
                ->where('orders.0.invoice.total', 80)
                ->where('orders.0.invoice.paid', 40)
                ->where('orders.0.invoice.due', 40));

        $this->get('/payments')
            ->assertOk()
            ->assertInertia(fn($page) => $page
                ->component('payments/index')
                ->where('invoices.0.total', 80)
                ->where('invoices.0.paid', 40)
                ->where('invoices.0.due', 40));

        $this->get('/payments/all')
            ->assertOk()
            ->assertInertia(fn($page) => $page
                ->component('payments/allPayment')
                ->where('invoices.data.0.total', 80)
                ->where('invoices.data.0.paid', 40)
                ->where('invoices.data.0.due', 40));

        $this->get("/sales/invoice/{$invoice->id}/payments")
            ->assertOk()
            ->assertInertia(fn($page) => $page
                ->component('invoice/index')
                ->where('invoice.total_paid_amount', 40)
                ->where('invoice.total_due', 40));
    }
}
