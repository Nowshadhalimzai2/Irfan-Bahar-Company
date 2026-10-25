<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_payment_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_payment_id')->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignId('goods_receipt_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->decimal('amount', 15, 2);
            $table->timestamps();

            $table->unique(['supplier_payment_id', 'goods_receipt_id']);
            $table->index('goods_receipt_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_payment_allocations');
    }
};
