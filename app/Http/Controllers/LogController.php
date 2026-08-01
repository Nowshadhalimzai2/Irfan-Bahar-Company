<?php

namespace App\Http\Controllers;

use App\Models\Log;
use Inertia\Inertia;

class LogController extends Controller
{
    public function index(){
        $logs=Log::with('user:id,name')->orderBy('id','desc')->paginate(15);
        // dd($logs);
        $newLogs= Log::where('is_seen',false)->count();
        return Inertia::render('log/index',compact('logs','newLogs'));
    }
}
