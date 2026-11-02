<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('sale_lines')
            ->whereNull('base_quantity')
            ->update([
                'base_quantity' => DB::raw('quantity'),
                'conversion_factor' => 1,
            ]);

        DB::statement(<<<'SQL'
            UPDATE sale_lines
            SET item_unit_id = (
                SELECT items.base_unit_id
                FROM items
                WHERE items.id = sale_lines.item_id
            )
            WHERE item_unit_id IS NULL
              AND EXISTS (
                SELECT 1
                FROM items
                WHERE items.id = sale_lines.item_id
                  AND items.base_unit_id IS NOT NULL
              )
        SQL);

        Schema::table('sale_return_lines', function (Blueprint $table) {
            if (! Schema::hasColumn('sale_return_lines', 'item_unit_id')) {
                $table->foreignId('item_unit_id')
                    ->nullable()
                    ->after('item_id')
                    ->constrained('item_units')
                    ->restrictOnDelete()
                    ->cascadeOnUpdate();
            }

            if (! Schema::hasColumn('sale_return_lines', 'conversion_factor')) {
                $table->decimal('conversion_factor', 15, 6)
                    ->default(1)
                    ->after('quantity');
            }

            if (! Schema::hasColumn('sale_return_lines', 'base_quantity')) {
                $table->decimal('base_quantity', 15, 3)
                    ->nullable()
                    ->after('conversion_factor');
            }
        });

        DB::table('sale_return_lines')
            ->whereNull('base_quantity')
            ->update([
                'base_quantity' => DB::raw('quantity'),
                'conversion_factor' => 1,
            ]);
    }

    public function down(): void
    {
        Schema::table('sale_return_lines', function (Blueprint $table) {
            if (Schema::hasColumn('sale_return_lines', 'item_unit_id')) {
                $table->dropForeign(['item_unit_id']);
                $table->dropColumn('item_unit_id');
            }

            if (Schema::hasColumn('sale_return_lines', 'base_quantity')) {
                $table->dropColumn('base_quantity');
            }

            if (Schema::hasColumn('sale_return_lines', 'conversion_factor')) {
                $table->dropColumn('conversion_factor');
            }
        });
    }
};
