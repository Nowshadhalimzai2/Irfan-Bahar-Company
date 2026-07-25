<?php

namespace App\Custome;

use App\Models\Log as ModelsLog;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class Log
{
    public function create(string $actType, string $desc, ?User $targetedUser = null,?string $link=null)
    {
        $user = Auth::user();
        $username = $user ? $user->name : 'سیستم';
        

        // Create meaningful Dari templates for each activity
        switch ($actType) {
            case 'insert':
                $template = "{$desc} رکورد جدید را ایجاد کرد. توضیحات: {$username}";
                break;
            case 'update':
                $template = "{$desc} رکورد را به‌روز کرد. {$targetedUser->name} توضیحات: {$username}";
                break;
            case 'delete':
                $template = "{$desc}در سیستم به روز کرد. توضیحات {$targetedUser->name} حالت {$username}";
                break;
            default:
                $template = "{$desc} فعالیتی انجام داد: {$actType}. توضیحات: {$username}";
                break;
        }

        ModelsLog::create([
            'user_id' => Auth::id(),
            'activity_type' => $actType,
            'description' => $template,
            'activity_date' => now(),
            'link' => $link,
        ]);
    }
}
