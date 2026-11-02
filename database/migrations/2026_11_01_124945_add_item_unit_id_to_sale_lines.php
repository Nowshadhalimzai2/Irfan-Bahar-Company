<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sale_lines', function (Blueprint $table) {
            $table->foreignId('item_unit_id')
                ->nullable()
                ->after('item_id')
                ->constrained('item_units')
                ->restrictOnDelete();

            $table->decimal('conversion_factor', 15, 3)
                ->default(1)
                ->after('quantity');

            $table->decimal('base_quantity', 15, 3)
                ->nullable()
                ->after('conversion_factor');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_lines', function (Blueprint $table) {
            $table->dropForeign(['item_unit_id']);
            $table->dropColumn('item_unit_id');
            $table->dropColumn('conversion_factor');
            $table->dropColumn('base_quantity');
        });
    }
};
