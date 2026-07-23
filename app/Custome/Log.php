<?php

namespace App\Custome;

use App\Models\Log as ModelsLog;
use Illuminate\Support\Facades\Auth;

class Log
{
    public function create(string $actType,string $desc) {
        ModelsLog::create([
            'user_id' =>Auth::id(),
            'activity_type' => $actType,
            'description' => $desc,
            'activity_date' => now(),
        ]);
    }
}
