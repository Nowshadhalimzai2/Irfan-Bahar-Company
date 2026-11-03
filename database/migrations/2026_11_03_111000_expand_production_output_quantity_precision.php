<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('production_outputs', function (Blueprint $table): void {
            $table->decimal('quantity_produced', 15, 3)->change();
        });
    }

    public function down(): void
    {
        Schema::table('production_outputs', function (Blueprint $table): void {
            $table->decimal('quantity_produced', 6, 2)->change();
        });
    }
};
