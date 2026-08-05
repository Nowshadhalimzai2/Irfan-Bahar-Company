<?php

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
        Schema::create('products', function (Blueprint $table) {
            $table->foreignIdFor(Item::class)->primary(true)->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            $table->decimal('weight', 3, 3);
            $table->integer('per_pack')->default(1);
            $table->text('description');
            $table->string('barcode', 50)->unique()->nullable();
            $table->timestamps();
            $table->unique(['item_id', 'weight', 'per_pack']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {

        Schema::dropIfExists('products');
    }
};
