<?php

use App\Models\Item;
use App\Models\Location;
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
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Location::class)->constrained('locations')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignIdFor(Item::class)->constrained('items')->cascadeOnUpdate()->cascadeOnDelete();
            $table->enum('movement_type',['receipt','transferred_out','transferred_in','production_consumption','production_output','sale','sale_return','adjustment_in','adjustment_out']);
            $table->decimal('quantity',6,2);
            // $table->decimal('unit_cost')
            $table->string('reference_no',12)->unique('idx_reference_no');
            $table->date('occured_at');
            $table->string('notes',255);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};
