<?php

namespace App\Custome;

use App\Models\Currency;
use App\Models\ShopAccount;
use Inertia\Inertia;

class SHA
{

      public function credit(int $amount, ?int $currency = 1)
    {
        $account = ShopAccount::firstWhere('currency_id', $currency);
        $account->amount += $amount;
        $account->save();
    }
    public function debit(int $amount, ?int $currency = 1)
    {
        $account = ShopAccount::firstWhere('currency_id', $currency);
        if ($account->amount < $amount) {
            return false;
        }
        $account->amount -= $amount;
        $account->save();
        return true;
    }
}
