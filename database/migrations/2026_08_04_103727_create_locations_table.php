<?php

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
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['warehouse', 'shop', 'office', 'factory', 'other']);
            $table->string('address');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Scaffold the locations table with default data 
        if (DB::table('locations')->count() === 0) {
            foreach (['warehouse', 'shop', 'office', 'factory', 'other'] as $location) {
                Location::firstOrCreate(
                    [
                        'name' => $location,
                        'type' => $location,
                        'address' => 'Default Address',
                        'is_active' => true,

                    ]
                );
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};
