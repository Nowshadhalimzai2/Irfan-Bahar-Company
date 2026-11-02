<?php

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
        Schema::table('boms', function (Blueprint $table) {
            $table->string('code', 20)->nullable()->unique();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS "boms_code_unique"');
        Schema::table('boms', function (Blueprint $table) {
            if (Schema::hasColumn('boms', 'code'))
                $table->dropColumn('code');
        });
    }
};
