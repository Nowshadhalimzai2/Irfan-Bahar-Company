<?php

namespace Tests\Feature;

use App\Models\Currency;
use App\Models\Expense;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_update_amount_and_disable_editability(): void
    {
        $role = Role::create(['name' => 'super_admin']);
        $user = User::factory()->create(['role_id' => $role->id]);
        $currency = Currency::create(['name' => 'AFG']);

        $expense = Expense::create([
            'amount' => 100,
            'description' => 'Original expense',
            'date' => now(),
            'currency_id' => $currency->id,
            'is_editable' => true,
        ]);

        $response = $this->actingAs($user)
            ->putJson(route('expenses.update', $expense), [
                'amount' => 250,
            ]);

        $response->assertOk()
            ->assertJsonPath('amount', 250)
            ->assertJsonPath('is_editable', false);

        $this->assertDatabaseHas('expenses', [
            'id' => $expense->id,
            'amount' => 250,
            'is_editable' => false,
        ]);
    }
}
