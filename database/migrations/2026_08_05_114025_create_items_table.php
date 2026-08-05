<?php

use App\Models\Category;
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
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
        });

        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('code', 12);
            $table->enum('item_type', ['raw_material', 'product', 'packing']);
            $table->enum('unit', ['kg', 'gr', 'ltr']);
            $table->string('sku', 12)->unique();
            $table->decimal('default_sale_price', 6, 2);
            $table->foreignIdFor(Category::class)->constrained('categories')->cascadeOnUpdate();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
        Schema::dropIfExists('items');
    }
};
