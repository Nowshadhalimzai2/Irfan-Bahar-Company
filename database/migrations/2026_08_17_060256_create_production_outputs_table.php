<?php

use App\Models\Product;
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
        Schema::create('production_outputs', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(ProductionOrder::class)->constrained('production_orders')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignIdFor(Product::class,'item_id')->constrained('products')->noActionOnDelete()->cascadeOnUpdate();
            $table->decimal('quantity_produced',6,2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_outputs');
    }
};
