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
        Schema::create('supplier_payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('supplier_id')
                ->constrained('suppliers')
                ->restrictOnDelete()
                ->cascadeOnUpdate();

            // Nullable because a payment may be an advance or general supplier payment.
            $table->foreignId('goods_receipt_id')
                ->nullable()
                ->constrained('goods_receipts')
                ->restrictOnDelete()
                ->cascadeOnUpdate();

            $table->foreignId('currency_id')
                ->constrained('currencies')
                ->restrictOnDelete()
                ->cascadeOnUpdate();

            $table->string('payment_no')->unique();

            $table->decimal('amount', 15, 2);

            $table->enum('payment_method', [
                'cash',
                'bank_transfer',
                'card',
                'other',
            ]);

            $table->date('paid_at');

            $table->enum('status', [
                'completed',
                'cancelled',
            ])->default('completed');

            $table->string('reference_no')->nullable();
            $table->text('notes')->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            $table->timestamps();

            $table->index(['supplier_id', 'paid_at']);
            $table->index(['goods_receipt_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_payments');
    }
};
