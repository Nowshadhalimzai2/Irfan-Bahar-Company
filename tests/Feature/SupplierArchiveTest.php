<?php

namespace Tests\Feature;

use App\Models\Currency;
use App\Models\GoodsReceipt;
use App\Models\Location;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplierArchiveTest extends TestCase
{
    use RefreshDatabase;

    public function test_deleting_a_supplier_deactivates_it_without_breaking_receipt_history(): void
    {
        $user = $this->createAdmin();
        $supplier = Supplier::query()->create([
            'name' => 'Archived supplier',
            'address' => 'Test address',
        ]);
        $receipt = $this->createReceipt($supplier);

        $this->actingAs($user)
            ->delete(route('suppliers.destroy', $supplier))
            ->assertRedirect('/stackholders');

        $this->assertDatabaseHas('suppliers', [
            'id' => $supplier->id,
            'status' => false,
        ]);
        $this->assertDatabaseHas('goods_receipts', [
            'id' => $receipt->id,
            'supplier_id' => $supplier->id,
        ]);
        $this->assertDatabaseCount('suppliers', 1);
    }

    public function test_receipt_pages_handle_legacy_receipts_without_a_supplier(): void
    {
        $user = $this->createAdmin();
        $receipt = $this->createReceipt(null);

        $this->actingAs($user)
            ->get(route('receipts.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('goods-receipt/index')
                ->where('goodsReceipts.data.0.supplier', null));

        $this->actingAs($user)
            ->get(route('receipts.show', $receipt))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('goods-receipt/show')
                ->where('receipt.supplier', null));
    }

    public function test_inactive_suppliers_cannot_be_used_for_new_goods_receipts(): void
    {
        $role = Role::query()->create(['name' => 'shop_clerk']);
        $user = User::factory()->create(['role_id' => $role->id]);
        $user->status = true;
        $user->save();
        $supplier = Supplier::query()->create([
            'name' => 'Inactive supplier',
            'address' => 'Test address',
            'status' => false,
        ]);

        $this->actingAs($user)
            ->from(route('receipts.create'))
            ->post(route('receipts.store'), ['supplier_id' => $supplier->id])
            ->assertRedirect(route('receipts.create'))
            ->assertSessionHasErrors('supplier_id');

        $this->assertDatabaseCount('goods_receipts', 0);
    }

    private function createAdmin(): User
    {
        $role = Role::query()->create(['name' => 'admin']);
        $user = User::factory()->create(['role_id' => $role->id]);
        $user->status = true;
        $user->save();

        return $user;
    }

    private function createReceipt(?Supplier $supplier): GoodsReceipt
    {
        $location = Location::query()->where('type', 'warehouse')->firstOrFail();
        $currency = Currency::query()->create(['name' => 'AFG']);

        return GoodsReceipt::query()->create([
            'supplier_id' => $supplier?->id,
            'destination_location_id' => $location->id,
            'currency_id' => $currency->id,
            'reference_no' => 'GR-TEST-'.$currency->id,
            'received_at' => now()->toDateString(),
            'total_amount' => 100,
            'amount_paid' => 0,
        ]);
    }
}
