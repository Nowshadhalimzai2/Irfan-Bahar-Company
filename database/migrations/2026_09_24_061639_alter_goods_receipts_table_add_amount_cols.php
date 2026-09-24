<?php

use App\Models\Currency;
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
        Schema::table('goods_receipts', function (Blueprint $table) {
            $table->decimal('total_amount', 8, 2)->default(0);
            $table->decimal('amount_paid', 8, 2)->default(0);
            $table->foreignIdFor(Currency::class)->default(1)->constrained();
        });

        Schema::table('goods_receipt_lines', function (Blueprint $table) {
            $table->dropForeign(['currency_id']);
            $table->dropColumn('currency_id');
        });
        Schema::table('suppliers', function (Blueprint $table) {
            $table->boolean('has_account')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('goods_receipts', function (Blueprint $table) {
            $table->dropColumn('total_amount');
            $table->dropColumn('amount_paid');
            $table->dropForeign(['currency_id']);
            $table->dropColumn('currency_id');
        });
        Schema::table('goods_receipt_lines', function (Blueprint $table) {
            $table->foreignIdFor(Currency::class)->default(1)->constrained();
        });
        Schema::table('goods_receipt_lines', function (Blueprint $table) {
            $table->dropColumn('has_account');
        });
    }
};
