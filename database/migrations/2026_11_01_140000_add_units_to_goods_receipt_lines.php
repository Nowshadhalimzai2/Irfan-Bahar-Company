<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('goods_receipt_lines', function (Blueprint $table) {
            if (! Schema::hasColumn('goods_receipt_lines', 'item_unit_id')) {
                $table->foreignId('item_unit_id')
                    ->nullable()
                    ->after('item_id')
                    ->constrained('item_units')
                    ->restrictOnDelete()
                    ->cascadeOnUpdate();
            }

            if (! Schema::hasColumn('goods_receipt_lines', 'conversion_factor')) {
                $table->decimal('conversion_factor', 15, 6)
                    ->default(1)
                    ->after('quantity');
            }

            if (! Schema::hasColumn('goods_receipt_lines', 'base_quantity')) {
                $table->decimal('base_quantity', 15, 3)
                    ->nullable()
                    ->after('conversion_factor');
            }
        });

        DB::table('goods_receipt_lines')
            ->whereNull('base_quantity')
            ->update([
                'base_quantity' => DB::raw('quantity'),
                'conversion_factor' => 1,
            ]);

        DB::statement(<<<'SQL'
            UPDATE goods_receipt_lines
            SET item_unit_id = (
                SELECT items.base_unit_id
                FROM items
                WHERE items.id = goods_receipt_lines.item_id
            )
            WHERE item_unit_id IS NULL
              AND EXISTS (
                SELECT 1
                FROM items
                WHERE items.id = goods_receipt_lines.item_id
                  AND items.base_unit_id IS NOT NULL
              )
        SQL);
    }

    public function down(): void
    {
        Schema::table('goods_receipt_lines', function (Blueprint $table) {
            if (Schema::hasColumn('goods_receipt_lines', 'item_unit_id')) {
                $table->dropForeign(['item_unit_id']);
                $table->dropColumn('item_unit_id');
            }

            if (Schema::hasColumn('goods_receipt_lines', 'base_quantity')) {
                $table->dropColumn('base_quantity');
            }

            if (Schema::hasColumn('goods_receipt_lines', 'conversion_factor')) {
                $table->dropColumn('conversion_factor');
            }
        });
    }
};
