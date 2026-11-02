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
        Schema::create('item_units', function (Blueprint $table) {
            $table->id();

            $table->foreignId('item_id')
                ->constrained('items')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            $table->string('name', 50);
            $table->string('symbol', 20)->nullable();

            // Example: piece = 1, carton = 24. The base unit itself is
            // selected by items.base_unit_id and must therefore use 1.
            $table->decimal('conversion_to_base', 15, 6)
                ->unsigned()
                ->default(1);

            $table->string('barcode', 50)
                ->nullable()
                ->unique();
            // A unit code identifies a sellable/receivable unit globally.
            $table->string('code', 50)->unique();

            $table->decimal('selling_price', 15, 2)->unsigned();
            $table->decimal('purchase_price', 15, 2)
                ->unsigned()
                ->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->unique(['item_id', 'name']);
            $table->index(['item_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_units');
    }
};
