<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            Schema::table('inventory_movements', function (Blueprint $table): void {
                $table->decimal('quantity', 15, 3)->change();
            });
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            Schema::table('inventory_movements', function (Blueprint $table): void {
                $table->decimal('quantity', 6, 2)->change();
            });
        }
    }
};
