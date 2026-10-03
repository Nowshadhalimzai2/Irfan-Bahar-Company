<?php

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
        Schema::table('invoices', function (Blueprint $table) {
            if (Schema::hasColumn('invoices', 'bill_to_email')) {
                $table->dropColumn('bill_to_email');
            }

            if (! Schema::hasColumn('invoices', 'bill_to_phone')) {
                $table->string('bill_to_phone')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            if (! Schema::hasColumn('invoices', 'bill_to_email')) {
                $table->string('bill_to_email')->nullable();
            }

            if (Schema::hasColumn('invoices', 'bill_to_phone')) {
                $table->dropColumn('bill_to_phone');
            }
        });
    }
};
