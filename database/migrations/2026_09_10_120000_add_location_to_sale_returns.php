<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_returns', function (Blueprint $table): void {
            $table->foreignId('location_id')->nullable()->after('sale_id')->constrained('locations')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sale_returns', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('location_id');
        });
    }
};
