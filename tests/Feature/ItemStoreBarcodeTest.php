<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Item;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ItemStoreBarcodeTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_and_update_generate_distinct_barcodes_for_units_without_one(): void
    {
        $role = Role::create(['name' => 'admin']);
        $user = User::factory()->create(['role_id' => $role->id]);
        $user->status = true;
        $user->save();
        $category = Category::create(['name' => 'test category']);

        $response = $this->actingAs($user)->post(route('items.store'), [
            'name' => 'Test item',
            'item_type' => 'raw_material',
            'category_id' => $category->id,
            'base_unit' => [
                'name' => 'piece',
                'symbol' => 'pc',
                'conversion_to_base' => 1,
                'selling_price' => 10,
                'purchase_price' => 5,
            ],
            'additional_units' => [
                [
                    'name' => 'box',
                    'symbol' => 'bx',
                    'conversion_to_base' => 12,
                    'selling_price' => 100,
                    'purchase_price' => 50,
                ],
                [
                    'name' => 'carton',
                    'symbol' => 'ctn',
                    'conversion_to_base' => 24,
                    'selling_price' => 180,
                    'purchase_price' => 90,
                ],
            ],
        ]);

        $response->assertRedirect(route('items.index'));
        $response->assertSessionHasNoErrors();

        $item = Item::query()->with('units')->firstOrFail();
        $barcodes = $item->units->pluck('barcode');

        $this->assertCount(3, $barcodes);
        $this->assertTrue($barcodes->every(fn (?string $barcode): bool => filled($barcode)));
        $this->assertCount($barcodes->count(), $barcodes->unique());
        $this->assertSame('200' . str_pad((string) $item->id, 9, '0', STR_PAD_LEFT), substr($barcodes[0], 0, 12));
        $this->assertStringContainsString('-U2', $barcodes[1]);
        $this->assertStringContainsString('-U3', $barcodes[2]);

        // Legacy items can have unit rows without barcodes after migration.
        $item->units()->update(['barcode' => null]);
        $item->load('units');
        $baseUnit = $item->units->firstWhere('id', $item->base_unit_id);
        $additionalUnits = $item->units
            ->where('id', '!=', $baseUnit->id)
            ->map(fn ($unit): array => [
                'id' => $unit->id,
                'name' => $unit->name,
                'symbol' => $unit->symbol,
                'conversion_to_base' => (float) $unit->conversion_to_base,
                'barcode' => $unit->barcode,
                'selling_price' => (float) $unit->selling_price,
                'purchase_price' => (float) $unit->purchase_price,
                'is_active' => $unit->is_active,
            ])
            ->values()
            ->all();
        $additionalUnits[] = [
            'name' => 'pallet',
            'symbol' => 'plt',
            'conversion_to_base' => 48,
            'selling_price' => 300,
            'purchase_price' => 150,
            'is_active' => true,
        ];

        $updateResponse = $this->actingAs($user)->put(route('items.update', $item), [
            'name' => $item->name,
            'item_type' => $item->item_type,
            'category_id' => $item->category_id,
            'base_unit' => [
                'id' => $baseUnit->id,
                'name' => $baseUnit->name,
                'symbol' => $baseUnit->symbol,
                'conversion_to_base' => 1,
                'barcode' => null,
                'selling_price' => (float) $baseUnit->selling_price,
                'purchase_price' => (float) $baseUnit->purchase_price,
            ],
            'additional_units' => $additionalUnits,
        ]);

        $updateResponse->assertRedirect(route('items.index'));
        $updateResponse->assertSessionHasNoErrors();

        $updatedBarcodes = $item->fresh('units')->units->pluck('barcode');
        $this->assertCount(4, $updatedBarcodes);
        $this->assertTrue($updatedBarcodes->every(fn (?string $barcode): bool => filled($barcode)));
        $this->assertCount($updatedBarcodes->count(), $updatedBarcodes->unique());
    }
}
