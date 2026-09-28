<?php

use App\Models\Currency;
use App\Models\GoodsReceipt;
use App\Models\Item;
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
        Schema::create('goods_receipt_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(GoodsReceipt::class,'receipt_id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignIdFor(Item::class)->constrained()->cascadeOnUpdate()->noActionOnDelete();
            $table->decimal('quantity',8,2);
            $table->decimal('unit_cost',8,2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('goods_receipt_lines');
    }
};
