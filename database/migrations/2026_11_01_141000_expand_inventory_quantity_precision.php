<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('goods_receipt_lines', 'quantity')) {
            Schema::table('goods_receipt_lines', function (Blueprint $table) {
                $table->decimal('quantity', 15, 3)->change();
            });
        }

        if (Schema::hasColumn('inventory_balances', 'quantity_on_hand')) {
            Schema::table('inventory_balances', function (Blueprint $table) {
                $table->decimal('quantity_on_hand', 15, 3)->change();
                $table->decimal('reserved', 15, 3)->default(0)->change();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('goods_receipt_lines', 'quantity')) {
            Schema::table('goods_receipt_lines', function (Blueprint $table) {
                $table->decimal('quantity', 8, 2)->change();
            });
        }

        if (Schema::hasColumn('inventory_balances', 'quantity_on_hand')) {
            Schema::table('inventory_balances', function (Blueprint $table) {
                $table->decimal('quantity_on_hand', 8, 2)->change();
                $table->decimal('reserved', 6, 2)->default(0)->change();
            });
        }
    }
};
