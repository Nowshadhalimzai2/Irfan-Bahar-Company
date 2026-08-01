<?php

namespace Tests\Feature;

use App\Models\Currency;
use App\Models\Expense;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_expenses_range_endpoint_returns_json_for_valid_dates(): void
    {
        $role = Role::create(['name' => 'shop_clerk']);
        $user = User::factory()->create(['role_id' => $role->id]);
        $currency = Currency::create(['name' => 'AFG']);

        Expense::create([
            'amount' => 150,
            'description' => 'Test expense',
            'date' => '2025-01-15',
            'currency_id' => $currency->id,
        ]);

        $response = $this->actingAs($user)
            ->getJson(route('expenses.expenses-range', [
                'from' => '2025-01-01',
                'to' => '2025-01-31',
            ]));

        $response->assertOk()
            ->assertJsonStructure([
                'expenses' => [
                    '*' => ['id', 'amount', 'description', 'date', 'currency_id'],
                ],
            ]);
    }
}
