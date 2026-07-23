<?php

namespace App\Http\Controllers;

use App\Models\Log;
use Inertia\Inertia;

class LogController extends Controller
{
    public function index(){
        $logs=Log::with('user:id,name')->get();
        $newLogs= Log::where('is_seen',false)->count();
        return Inertia::render('log/index',compact('logs','newLogs'));
    }
}
