<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SalaryController extends Controller
{
    public function salaryRecord(Employee $employee): Response
    {
        $tz = config('app.timezone');
        $now =  Carbon::now($tz);

        $startOfMonth = $now->copy()->startOfMonth()->toDateString();
        $endOfMonth = $now->copy()->endOfMonth()->toDateString();
        $salaryRecords = $employee->salaries()->whereBetween('payment_date', [$startOfMonth, $endOfMonth])
            ->get();
        return Inertia::render('employee/salary-record', compact('salaryRecords', 'employee'));
    }
    public function getSalryBasedOnMonth(Request $request, Employee $employee)
    {

    $tz = config('app.timezone');
        $from = $request->filled('from')
            ? Carbon::parse($request->input('from'), $tz)
            : Carbon::now($tz);
        $to = $request->filled('to')
            ? Carbon::parse($request->input('to'), $tz)
            : Carbon::now($tz);

        // return response()->json([
        //     'date' => $now->toDateTimeString(),
        // ]);

        $salaryRecords = $employee->salaries()->whereBetween('payment_date', [$from, $to])
            ->get();

        return response()->json(['salaries' => $salaryRecords, 'startOfDate' => $from, 'endOfDate' => $from,'employee' => $employee]);
    }
}
