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
        Schema::create('wastes', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(ProductionOrder::class)->constrained('production_orders')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignIdFor(Item::class)->nullable('Item Deleted')->constrained('items')->cascadeOnUpdate()->nullOnDelete();
            $table->decimal('wasted_quantity',6,2)->default(0);
            $table->text('reason')->min(10)->max(300);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wastes');
    }
};
