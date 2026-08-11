<?php
namespace App\Custome;

use App\Models\Log as ModelsLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class Log
{
    public function create(string $actType, string $desc, ?string $targetedUser = null, ?string $link = null)
    {
        $desc = trim((string)$desc);
        $targetedUser = $targetedUser ? trim($targetedUser) : null;

       
        if ($desc !== '') {
            $template = $targetedUser ? "{$desc} - {$targetedUser}" : "{$desc}";
        } elseif ($targetedUser) {
            $template = "{$targetedUser}";
        } else {
            $template = 'معلومات مشخص نشد';
        }
        $now = Carbon::now(config('app.timezone'));

        ModelsLog::create([
            'user_id' => Auth::id(),
            'activity_type' => $actType,
            'description' => $template,
            'activity_date' => $now,
            'link' => $link,
        ]);
    }
}