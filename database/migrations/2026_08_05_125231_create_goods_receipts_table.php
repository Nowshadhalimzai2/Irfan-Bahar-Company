<?php

use App\Models\Currency;
use App\Models\Location;
use App\Models\Supplier;
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
        Schema::create('goods_receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Supplier::class)->nullable()->constrained('suppliers')->nullOnDelete()->cascadeOnUpdate();
            $table->foreignIdFor(Location::class, 'destination_location_id')->constrained()->noActionOnDelete()->cascadeOnUpdate();
            $table->foreignIdFor(Currency::class)->constrained()->cascadeOnUpdate()->noActionOnDelete();
            $table->string('reference_no')->nullable();
            $table->date('received_at');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('goods_receipts');
    }
};
