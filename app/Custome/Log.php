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

        $suffixMap = [
            'insert' => 'در سیستم اضافه شد',
            'update' => 'به‌روزرسانی شد',
            'delete' => 'از سیستم حذف شد',
        ];
        $suffix = $suffixMap[$actType] ?? "";

        if ($desc !== '') {
            $template = $targetedUser ? "{$desc} {$suffix} - {$targetedUser}" : "{$desc} {$suffix}";
        } elseif ($targetedUser) {
            $template = "{$targetedUser} {$suffix}";
        } else {
            $template = $suffix;
        }
        $now = Carbond::now(config('app.timezone'));

        ModelsLog::create([
            'user_id' => Auth::id(),
            'activity_type' => $actType,
            'description' => $template,
            'activity_date' => $now,
            'link' => $link,
        ]);
    }
}