<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
    }

    public function down(): void
    {
        if (Schema::hasIndex('item_units', 'item_units_item_id_is_active_index')) {
            Schema::table('item_units', function (Blueprint $table): void {
                $table->dropIndex('item_units_item_id_is_active_index');
            });
        }
    }
};
