<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('currencies')->count() === 0) {
            $currencyIds = [];

            foreach (['AFG', 'USD', 'PKR'] as $name) {
                $id = DB::table('currencies')->insertGetId([
                    'name' => $name,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $currencyIds[] = $id;
            }
        } else {
            $currencyIds = DB::table('currencies')->pluck('id');
        }

        if (DB::table('shop_accounts')->count() === 0) {
            foreach ($currencyIds as $currencyId) {
                DB::table('shop_accounts')->insert([
                    'amount' => 0,
                    'currency_id' => $currencyId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
};