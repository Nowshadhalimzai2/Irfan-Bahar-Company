<?php

use App\Models\Currency;
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
        $afgCur = Currency::query()->firstWhere('name', 'AFG');
        Schema::table('payments', function (Blueprint $table) use ($afgCur) {
            $table->foreignIdFor(Currency::class)->default($afgCur->id ?? 1);
            $table->string('payment_number', 50)->nullable()->unique();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS "payments_payment_number_unique"');
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['currency_id']);
            $table->dropColumn('currency_id');
            $table->dropColumn('payment_number');
        });
    }
};
