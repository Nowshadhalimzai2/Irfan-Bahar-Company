<?php

use App\Models\Item;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_returns', function (Blueprint $table): void {
            $table->id();

            $table->foreignId('sale_id')
                ->constrained('sales')
                ->restrictOnDelete();

            // Optional because not every sale must have an invoice.
            $table->foreignId('invoice_id')
                ->nullable()
                ->constrained('invoices')
                ->nullOnDelete();

            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->string('return_number', 50)->unique();
            $table->string('status', 30)->default('draft')->index();
            $table->string('reason', 100)->nullable();
            $table->char('currency', 3)->default('AFG');

            $table->decimal('total', 15, 2)->default(0);
            $table->decimal('refund_amount', 15, 2)->default(0);
            $table->string('refund_method', 30)->nullable();
            $table->string('refund_reference')->nullable();

            $table->timestamp('requested_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('sale_return_lines', function (Blueprint $table): void {
            $table->id();

            $table->foreignId('sale_return_id')
                ->constrained('sale_returns')
                ->cascadeOnDelete();

            // Do not make sale_line_id unique: one sale line may be returned
            // in multiple separate returns.
            $table->foreignId('sale_line_id')
                ->constrained('sale_lines')
                ->restrictOnDelete();

            $table->foreignIdFor(Item::class);
            $table->decimal('quantity', 15, 3);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('line_total', 15, 2);
            $table->string('condition', 30)->nullable();
            $table->string('restock_action', 30)->default('none');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_return_lines');
        Schema::dropIfExists('sale_returns');
    }
};
