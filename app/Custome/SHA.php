<?php

namespace App\Custome;

use App\Models\Currency;
use App\Models\ShopAccount;
use Inertia\Inertia;

class SHA
{

    public function credit(float $amount, ?int $currency = 1)
    {
        $account = ShopAccount::firstWhere('currency_id', $currency);
        if (! $account) {
            return false;
        }
        $account->amount += $amount;
        $account->save();
        return true;
    }
    public function debit(float $amount, ?int $currency = 1)
    {
        $account = ShopAccount::firstWhere('currency_id', $currency);
        if (! $account || $account->amount < $amount) {
            return false;
        }
        $account->amount -= $amount;
        $account->save();
        return true;
    }
}
