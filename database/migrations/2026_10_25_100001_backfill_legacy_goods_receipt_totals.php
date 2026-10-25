<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('goods_receipts')
            ->where('total_amount', 0)
            ->whereExists(function ($query) {
                $query->selectRaw('1')
                    ->from('goods_receipt_lines')
                    ->whereColumn('goods_receipt_lines.receipt_id', 'goods_receipts.id');
            })
            ->update([
                'total_amount' => DB::raw(
                    '(SELECT ROUND(COALESCE(SUM(quantity * unit_cost), 0), 2) FROM goods_receipt_lines WHERE goods_receipt_lines.receipt_id = goods_receipts.id)'
                ),
            ]);
    }

    public function down(): void
    {
    }
};
