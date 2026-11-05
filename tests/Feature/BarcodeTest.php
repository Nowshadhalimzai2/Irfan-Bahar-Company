<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Item;
use App\Models\ItemUnit;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BarcodeTest extends TestCase
{
    use RefreshDatabase;

    public function test_barcode_page_lists_active_barcodes_for_every_item_unit(): void
    {
        $user = $this->verifiedUser();
        $category = Category::query()->create(['name' => 'raw_material']);
        $item = Item::query()->create([
            'name' => 'Bulk ingredient',
            'code' => 'RM-0001',
            'sku' => 'RM-0001',
            'item_type' => 'raw_material',
            'unit' => 'kg',
            'category_id' => $category->id,
        ]);
        $baseUnit = $item->units()->create([
            'name' => 'kilogram',
            'symbol' => 'kg',
            'conversion_to_base' => 1,
            'code' => 'RM-0001',
            'barcode' => '2000000000017',
            'selling_price' => 10,
            'purchase_price' => 5,
            'is_active' => true,
        ]);
        $item->update(['base_unit_id' => $baseUnit->id]);
        $item->units()->create([
            'name' => 'carton',
            'symbol' => 'ctn',
            'conversion_to_base' => 12,
            'code' => 'RM-0001-U2',
            'barcode' => '2000000000017-U2',
            'selling_price' => 100,
            'purchase_price' => 50,
            'is_active' => true,
        ]);
        $item->units()->create([
            'name' => 'pallet',
            'symbol' => 'plt',
            'conversion_to_base' => 48,
            'code' => 'RM-0001-U3',
            'barcode' => null,
            'selling_price' => 300,
            'purchase_price' => 150,
            'is_active' => true,
        ]);
        $item->units()->create([
            'name' => 'inactive pack',
            'symbol' => 'ip',
            'conversion_to_base' => 24,
            'code' => 'RM-0001-U4',
            'barcode' => 'INACTIVE-BARCODE',
            'selling_price' => 180,
            'purchase_price' => 90,
            'is_active' => false,
        ]);

        $this->actingAs($user)
            ->get(route('barcode.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('barcode')
                ->has('units', 2)
                ->where('units.0.item_name', 'Bulk ingredient')
                ->where('units.0.unit_name', 'kilogram')
                ->where('units.0.base_unit_name', 'kilogram')
                ->where('units.0.conversion_to_base', 1)
                ->where('units.1.unit_name', 'carton')
                ->where('units.1.conversion_to_base', 12)
                ->where('missingBarcodeCount', 1));
    }

    public function test_text_barcode_can_be_rendered_as_an_svg(): void
    {
        $user = $this->verifiedUser();

        $response = $this->actingAs($user)->get(route('barcode.image', ['value' => 'SP-1A']));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'image/svg+xml');
        $this->assertStringContainsString('<svg', $response->getContent());
    }

    public function test_barcode_svg_can_be_downloaded(): void
    {
        $user = $this->verifiedUser();

        $response = $this->actingAs($user)->get(route('barcode.image', [
            'value' => 'SP-1A',
            'download' => 1,
        ]));

        $response->assertOk();
        $response->assertHeader('Content-Disposition', 'attachment; filename="barcode-SP-1A.svg"');
    }

    private function verifiedUser(): User
    {
        $role = Role::create(['name' => 'super_admin']);

        return User::factory()->create(['role_id' => $role->id]);
    }
}
