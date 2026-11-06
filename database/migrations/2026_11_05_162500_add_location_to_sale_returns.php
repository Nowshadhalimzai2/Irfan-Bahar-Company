<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('sale_returns', 'location_id')) {
            Schema::table('sale_returns', function (Blueprint $table): void {
                $table->foreignId('location_id')
                    ->nullable()
                    ->after('sale_id')
                    ->constrained('locations')
                    ->restrictOnDelete()
                    ->cascadeOnUpdate();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('sale_returns', 'location_id')) {
            Schema::table('sale_returns', function (Blueprint $table): void {
                $table->dropForeign(['location_id']);
                $table->dropColumn('location_id');
            });
        }
    }
};
