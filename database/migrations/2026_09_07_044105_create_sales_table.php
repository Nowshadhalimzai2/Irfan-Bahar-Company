<?php

use App\Models\Currency;
use App\Models\Customer;
use App\Models\Item;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table): void {
            $table->id();

            // Keep these as nullable IDs so this migration does not assume the
            // names or existence of customer/user tables in the application.
            $table->foreignIdFor(Customer::class)->nullable()->index()->constrained()->nullOnDelete()->cascadeOnUpdate();
            $table->string('customer_name', 50)->nullable()->index('idx_customer_name');
            $table->unsignedBigInteger('created_by')->nullable()->index();

            $table->enum('status', ['draft', 'completed', 'cancelled', 'partially_returned', 'returned'])->default('draft')->index();
            $table->foreignIdFor(Currency::class)->constrained()->noActionOnDelete()->cascadeOnUpdate();

            // Store money as decimal values, never floating point values.
            $table->decimal('total', 15, 2)->default(0);
            $table->decimal('discount_total', 15, 2)->default(0);
            $table->decimal('after_descount_total', 15, 2)->default(0);
            $table->decimal('amount_paid', 15, 2)->default(0);

            $table->timestamp('sold_at')->nullable()->index();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sale_lines', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('sale_id')
                ->constrained('sales')
                ->cascadeOnDelete();

            // Optional reference to products; the snapshot fields below are
            // intentional so historical sales remain correct if a product changes.
            $table->foreignIdFor(Item::class)->index()->constrained()->noActionOnDelete();
            $table->enum('unit', ['kg', 'gr', 'ltr', 'packet', 'carton', 'bundle', 'pair', 'unit', 'bag'])->nullable();
            $table->decimal('quantity', 15, 3);

            // the amount it recieves
            $table->decimal('unit_cost', 15, 2);
            //  the amount sales
            $table->decimal('unit_price', 15, 2);

            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('line_total', 15, 2);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('invoices', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('sale_id')
                ->unique()
                ->constrained('sales')
                ->restrictOnDelete();

            // Generate this in application code, since invoice numbering often
            // needs a business-specific sequence or prefix.
            $table->string('invoice_number', 30)->unique();
            $table->enum('status', ['draft','issued', 'partially_paid', 'paid', 'over_due', 'partially_refunded','refunded'])->default('draft')->index();
            $table->date('issued_on')->nullable();
            $table->date('due_on')->nullable();
            $table->timestamp('paid_at')->nullable();

            // Legal/billing snapshots: do not rely on a mutable customer record.
            $table->string('bill_to_name')->default('unknown');
            $table->string('bill_to_email')->nullable();
            $table->text('bill_to_address')->nullable();

            // Snapshot totals used for the issued document.
            $table->char('currency', 3);
            $table->decimal('subtotal', 15, 2);
            $table->decimal('discount_total', 15, 2)->default(0);
            $table->decimal('total', 15, 2);
            $table->string('pdf_path')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('sale_lines');
        Schema::dropIfExists('sales');
    }
};
