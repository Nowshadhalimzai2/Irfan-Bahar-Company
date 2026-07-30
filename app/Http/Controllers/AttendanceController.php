<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Inertia\Ssr\Response as SsrResponse;

class AttendanceController extends Controller
{

    public function attendanceRecord(Employee $employee): Response
    {
        $tz = config('app.timezone');
        $now =  Carbon::now($tz);

        $startOfMonth = $now->copy()->startOfMonth()->toDateString();
        $endOfMonth = $now->copy()->endOfMonth()->toDateString();
        $totalAbsentDays = $employee->attendances()->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->where('is_present', false)
            ->get();
        return Inertia::render('employee/attendance-record', compact('totalAbsentDays', 'employee'));
    }

    public function getAttendanceBasedOnDateRange(Request $request, Employee $employee)
    {


        $tz = config('app.timezone');
        $from = $request->filled('from')
            ? Carbon::parse($request->input('from'), $tz)
            : Carbon::now($tz);
        $to = $request->filled('to')
            ? Carbon::parse($request->input('to'), $tz)
            : Carbon::now($tz);
        $attendances = $employee->attendances()->whereBetween('date', [$from, $to])->get();

        $absentDays = $employee->attendances()->whereBetween('date', [$from, $to])->where('is_present',false)->get()->count();
        $presentDays = $employee->attendances()->whereBetween('date', [$from, $to])->where('is_present',true)->get()->count();

        return response()->json(['attendances' => $attendances,'presentDays' => $presentDays,'absentDays' => $absentDays]);
    }
}
