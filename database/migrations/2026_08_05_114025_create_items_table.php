<?php

use App\Models\Category;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
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
            $table->timestamps();
        });

        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('item_type', ['raw_material', 'product', 'packing']);

            // Base inventory unit: unit, kg, ltr, etc.
            $table->string('unit', 30);

            // Human-readable stable item identifier, for example SP-0001.
            $table->string('code', 20)->nullable()->unique();
            $table->string('sku', 12)->unique();

            // Keep temporarily for backward compatibility.
            $table->decimal('default_sale_price', 15, 2)->default(0);

            $table->foreignId('category_id')
                ->constrained('categories')
                ->cascadeOnUpdate();

            $table->timestamps();
        });

        if (DB::table('categories')->count() === 0) {
            foreach (['soap', 'powder', 'vaseline', 'shampoo', 'packing', 'raw_material', 'acid'] as $categoryName) {
                Category::firstOrCreate(['name' => $categoryName]);
            }
        }
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('items');
        Schema::dropIfExists('categories');
    }
};
