<?php

namespace Tests\Feature;

use App\Models\Currency;
use App\Models\Customer;
use App\Models\Role;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerBalanceIgnoresCancelledSalesTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_balance_ignores_cancelled_sales(): void
    {
        $role = Role::create(['name' => 'admin']);
        $user = User::factory()->create(['role_id' => $role->id]);
        $this->actingAs($user);

        $currency = Currency::create(['name' => 'AFG']);
        $customer = Customer::create([
            'name' => 'Test Customer',
            'phone' => '0701234567',
            'is_active' => true,
        ]);

        Sale::create([
            'customer_id' => $customer->id,
            'currency_id' => $currency->id,
            'status' => 'completed',
            'total' => 150.00,
            'discount_total' => 0,
            'after_descount_total' => 150.00,
            'amount_paid' => 50.00,
            'sold_at' => now(),
        ]);

        Sale::create([
            'customer_id' => $customer->id,
            'currency_id' => $currency->id,
            'status' => 'cancelled',
            'total' => 1000.00,
            'discount_total' => 0,
            'after_descount_total' => 1000.00,
            'amount_paid' => 0,
            'sold_at' => now(),
        ]);

        $response = $this->get('/stackholders');

        $response->assertOk();
        $response->assertInertia(fn($page) => $page
            ->component('stackholder/index')
            ->where('stackholders.0.customers.0.balances.AFG', 100));
    }
}
