<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add database indexes that support report range queries for the factory + shop system.
     */
    public function up(): void
    {
        if (Schema::hasTable('sales') && ! Schema::hasIndex('sales', 'sales_sold_at_index')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->index(['sold_at'], 'sales_sold_at_index');
            });
        }

        if (Schema::hasTable('sales') && ! Schema::hasIndex('sales', 'sales_status_sold_at_index')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->index(['status', 'sold_at'], 'sales_status_sold_at_index');
            });
        }

        if (Schema::hasTable('expenses') && ! Schema::hasIndex('expenses', 'expenses_date_index')) {
            Schema::table('expenses', function (Blueprint $table) {
                $table->index(['date'], 'expenses_date_index');
            });
        }

        if (Schema::hasTable('payments') && ! Schema::hasIndex('payments', 'payments_paid_at_index')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->index(['paid_at'], 'payments_paid_at_index');
            });
        }

        if (Schema::hasTable('transfers') && ! Schema::hasIndex('transfers', 'transfers_transferred_at_index')) {
            Schema::table('transfers', function (Blueprint $table) {
                $table->index(['transferred_at'], 'transfers_transferred_at_index');
            });
        }

        if (Schema::hasTable('transfers') && ! Schema::hasIndex('transfers', 'transfers_source_destination_index')) {
            Schema::table('transfers', function (Blueprint $table) {
                $table->index(['source_id', 'destination_id'], 'transfers_source_destination_index');
            });
        }

        if (Schema::hasTable('inventory_movements') && ! Schema::hasIndex('inventory_movements', 'inventory_movements_occured_at_index')) {
            Schema::table('inventory_movements', function (Blueprint $table) {
                $table->index(['occured_at'], 'inventory_movements_occured_at_index');
            });
        }

        if (Schema::hasTable('inventory_movements') && ! Schema::hasIndex('inventory_movements', 'inventory_movements_type_occured_at_index')) {
            Schema::table('inventory_movements', function (Blueprint $table) {
                $table->index(['movement_type', 'occured_at'], 'inventory_movements_type_occured_at_index');
            });
        }

        if (Schema::hasTable('goods_receipts') && ! Schema::hasIndex('goods_receipts', 'goods_receipts_received_at_index')) {
            Schema::table('goods_receipts', function (Blueprint $table) {
                $table->index(['received_at'], 'goods_receipts_received_at_index');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('sales')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->dropIndexIfExists('sales_sold_at_index');
                $table->dropIndexIfExists('sales_status_sold_at_index');
            });
        }

        if (Schema::hasTable('expenses')) {
            Schema::table('expenses', function (Blueprint $table) {
                $table->dropIndexIfExists('expenses_date_index');
            });
        }

        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->dropIndexIfExists('payments_paid_at_index');
            });
        }

        if (Schema::hasTable('transfers')) {
            Schema::table('transfers', function (Blueprint $table) {
                $table->dropIndexIfExists('transfers_transferred_at_index');
                $table->dropIndexIfExists('transfers_source_destination_index');
            });
        }

        if (Schema::hasTable('inventory_movements')) {
            Schema::table('inventory_movements', function (Blueprint $table) {
                $table->dropIndexIfExists('inventory_movements_occured_at_index');
                $table->dropIndexIfExists('inventory_movements_type_occured_at_index');
            });
        }

        if (Schema::hasTable('goods_receipts')) {
            Schema::table('goods_receipts', function (Blueprint $table) {
                $table->dropIndexIfExists('goods_receipts_received_at_index');
            });
        }
    }
};
