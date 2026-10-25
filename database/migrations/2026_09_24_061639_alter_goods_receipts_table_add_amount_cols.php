<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $addTotalAmount = ! Schema::hasColumn(
            'goods_receipts',
            'total_amount'
        );

        $addAmountPaid = ! Schema::hasColumn(
            'goods_receipts',
            'amount_paid'
        );

        if ($addTotalAmount || $addAmountPaid) {
            Schema::table('goods_receipts', function (Blueprint $table) use (
                $addTotalAmount,
                $addAmountPaid
            ) {
                if ($addTotalAmount) {
                    $table->decimal('total_amount', 15, 2)
                        ->default(0);
                }

                if ($addAmountPaid) {
                    $table->decimal('amount_paid', 15, 2)
                        ->default(0);
                }
            });
        }

        if (! Schema::hasColumn('suppliers', 'has_account')) {
            Schema::table('suppliers', function (Blueprint $table) {
                $table->boolean('has_account')->default(true);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('goods_receipts', 'total_amount')) {
            Schema::table('goods_receipts', function (Blueprint $table) {
                $table->dropColumn('total_amount');
            });
        }

        if (Schema::hasColumn('goods_receipts', 'amount_paid')) {
            Schema::table('goods_receipts', function (Blueprint $table) {
                $table->dropColumn('amount_paid');
            });
        }

        if (Schema::hasColumn('suppliers', 'has_account')) {
            Schema::table('suppliers', function (Blueprint $table) {
                $table->dropColumn('has_account');
            });
        }
    }
};