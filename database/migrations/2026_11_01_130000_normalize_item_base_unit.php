<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            // SQLite can safely add a nullable REFERENCES column directly;
            // using Blueprint->constrained() here would rebuild the table.
            DB::statement(
                'alter table "items" add column "base_unit_id" integer references "item_units"("id") on delete restrict on update cascade'
            );
        } else {
            Schema::table('items', function (Blueprint $table): void {
                $table->foreignId('base_unit_id')
                    ->nullable()
                    ->after('category_id')
                    ->constrained('item_units')
                    ->restrictOnDelete()
                    ->cascadeOnUpdate();
            });
        }

        // Existing databases may have unit codes created before the global
        // uniqueness rule was introduced. Normalize only blank/duplicate
        // values before adding the unique index.
        $usedCodes = [];
        DB::table('item_units')->orderBy('id')->get()->each(function (object $unit) use (&$usedCodes): void {
            $code = trim((string) $unit->code);
            if ($code !== '' && ! isset($usedCodes[$code])) {
                $usedCodes[$code] = true;
                return;
            }

            $candidate = sprintf('ITEM-%d-UNIT-%d', $unit->item_id, $unit->id);
            $suffix = 1;
            while (isset($usedCodes[$candidate])) {
                $candidate = sprintf('ITEM-%d-UNIT-%d-%d', $unit->item_id, $unit->id, $suffix++);
            }

            DB::table('item_units')->where('id', $unit->id)->update(['code' => $candidate]);
            $usedCodes[$candidate] = true;
        });

        if (! Schema::hasIndex('item_units', 'item_units_code_unique')) {
            Schema::table('item_units', function (Blueprint $table): void {
                $table->unique('code', 'item_units_code_unique');
            });
        }

        if (! Schema::hasIndex('item_units', 'item_units_item_id_is_active_index')) {
            Schema::table('item_units', function (Blueprint $table): void {
                $table->index(['item_id', 'is_active'], 'item_units_item_id_is_active_index');
            });
        }

        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('item_units', function (Blueprint $table): void {
                $table->string('code', 50)->change();
                $table->decimal('conversion_to_base', 15, 6)->unsigned()->default(1)->change();
                $table->decimal('selling_price', 15, 2)->unsigned()->change();
                $table->decimal('purchase_price', 15, 2)->unsigned()->nullable()->change();
            });
        }

        // Normalize invalid legacy numeric values before tightening their
        // definitions. Prices and conversion factors cannot be negative.
        DB::table('item_units')->where('conversion_to_base', '<=', 0)->update(['conversion_to_base' => 1]);
        DB::table('item_units')->where('selling_price', '<', 0)->update(['selling_price' => 0]);
        DB::table('item_units')->where('purchase_price', '<', 0)->update(['purchase_price' => null]);

        $hasLegacyBaseFlag = Schema::hasColumn('item_units', 'is_base_unit');

        DB::table('items')->orderBy('id')->get()->each(function (object $item) use ($hasLegacyBaseFlag): void {
            $unitQuery = DB::table('item_units')->where('item_id', $item->id);

            if ($hasLegacyBaseFlag) {
                $unit = (clone $unitQuery)->where('is_base_unit', true)->orderBy('id')->first();
            } else {
                $unit = null;
            }

            $unit ??= (clone $unitQuery)->where('conversion_to_base', 1)->orderBy('id')->first();

            if (! $unit) {
                $name = trim((string) ($item->unit ?: 'unit'));
                $code = trim((string) $item->sku) . '-BASE';
                $code = $code !== '-BASE' ? $code : sprintf('ITEM-%d-BASE', $item->id);

                $suffix = 1;
                while (DB::table('item_units')->where('code', $code)->exists()) {
                    $code = sprintf('ITEM-%d-BASE-%d', $item->id, $suffix++);
                }

                $unitId = DB::table('item_units')->insertGetId([
                    'item_id' => $item->id,
                    'name' => $name,
                    'symbol' => null,
                    'conversion_to_base' => 1,
                    'barcode' => null,
                    'code' => $code,
                    'selling_price' => max(0, (float) $item->default_sale_price),
                    'purchase_price' => null,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $unitId = $unit->id;
                DB::table('item_units')->where('id', $unitId)->update([
                    'conversion_to_base' => 1,
                    'updated_at' => now(),
                ]);
            }

            DB::table('items')->where('id', $item->id)->update(['base_unit_id' => $unitId]);
        });

        // The foreign key above is now the single source of truth for the
        // base unit. Remove the old flag if this database still has it.
        if ($hasLegacyBaseFlag) {
            Schema::table('item_units', function (Blueprint $table): void {
                $table->dropColumn('is_base_unit');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('item_units', 'is_base_unit')) {
            Schema::table('item_units', function (Blueprint $table): void {
                $table->boolean('is_base_unit')->default(false);
            });
        }

        DB::table('item_units')->update(['is_base_unit' => false]);
        DB::table('items')->whereNotNull('base_unit_id')->get(['base_unit_id'])->each(function (object $item): void {
            DB::table('item_units')->where('id', $item->base_unit_id)->update(['is_base_unit' => true]);
        });

        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('items', function (Blueprint $table): void {
                $table->dropForeign(['base_unit_id']);
            });
        }

        Schema::table('items', function (Blueprint $table): void {
            $table->dropColumn('base_unit_id');
        });

        if (Schema::hasIndex('item_units', 'item_units_code_unique')) {
            Schema::table('item_units', function (Blueprint $table): void {
                $table->dropUnique('item_units_code_unique');
            });
        }
    }
};
