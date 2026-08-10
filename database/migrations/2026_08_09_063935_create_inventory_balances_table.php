<?php

use App\Models\Item;
use App\Models\Location;
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
        Schema::create('inventory_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Location::class)->constrained('locations')->cascadeOnUpdate()->noActionOnDelete();
            $table->foreignIdFor(Item::class)->constrained('items')->cascadeOnUpdate()->cascadeOnDelete();
            $table->decimal('quantity_on_hand',8,2);
            $table->decimal('reserved',6,2)->default(0,0);
            $table->timestamps();
            $table->unique(['location_id','item_id']);
        });

        // if (DB::table('inventory_balances')->count() === 0) {
        //     foreach (Location::all() as $location) {
        //         // Role::firstOrCreate(['name' => $roleName]);
        //         foreach (Item)
        //     }
        // }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_balances');
    }
};
