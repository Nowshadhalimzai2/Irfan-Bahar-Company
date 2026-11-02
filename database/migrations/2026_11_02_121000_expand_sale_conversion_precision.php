<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('sale_lines', function (Blueprint $table): void {
                $table->decimal('conversion_factor', 15, 6)->default(1)->change();
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('sale_lines', function (Blueprint $table): void {
                $table->decimal('conversion_factor', 15, 3)->default(1)->change();
            });
        }
    }
};
