<?php

use App\Models\Item;
use App\Models\ProductionOrder;
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
        Schema::create('production_inputs', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(ProductionOrder::class)->constrained('production_orders')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignIdFor(Item::class)->constrained('items')->noActionOnDelete()->cascadeOnUpdate();
            $table->decimal('quantity_used',5,2);
            $table->unique(['production_order_id','item_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_inputs');
    }
};
