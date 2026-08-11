<?php

use App\Models\Item;
use App\Models\Transfer;
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
        Schema::create('transfer_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Transfer::class)->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignIdFor(Item::class)->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            $table->decimal('quantity',6,2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transfer_lines');
    }
};
