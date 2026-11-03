<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bom_lines', function (Blueprint $table): void {
            $table->foreignId('item_unit_id')
                ->nullable()
                ->after('item_id')
                ->constrained('item_units')
                ->restrictOnDelete()
                ->cascadeOnUpdate();
            $table->decimal('required_quantity', 15, 3)->change();
        });

        Schema::table('production_inputs', function (Blueprint $table): void {
            $table->decimal('quantity_used', 15, 3)->change();
        });

        DB::statement(<<<'SQL'
            UPDATE bom_lines
            SET item_unit_id = (
                SELECT items.base_unit_id
                FROM items
                WHERE items.id = bom_lines.item_id
            )
            WHERE EXISTS (
                SELECT 1
                FROM items
                WHERE items.id = bom_lines.item_id
                  AND items.base_unit_id IS NOT NULL
            )
        SQL);
    }

    public function down(): void
    {
        Schema::table('production_inputs', function (Blueprint $table): void {
            $table->decimal('quantity_used', 5, 2)->change();
        });

        Schema::table('bom_lines', function (Blueprint $table): void {
            $table->dropForeign(['item_unit_id']);
            $table->dropColumn('item_unit_id');
            $table->decimal('required_quantity', 4, 2)->change();
        });
    }
};
