<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalaryController extends Controller
{
    public function salaryRecord(Employee $employee)
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
        $now = $request->filled('date')
            ? Carbon::parse($request->input('date'), $tz)
            : Carbon::now($tz);

        // return response()->json([
        //     'date' => $now->toDateTimeString(),
        // ]);

        $startOfMonth = $now->copy()->startOfMonth()->toDateString();
        $endOfMonth = $now->copy()->endOfMonth()->toDateString();
        $salaryRecords = $employee->salaries()->whereBetween('payment_date', [$startOfMonth, $endOfMonth])
            ->get();

        return response()->json(['salaries' => $salaryRecords, 'startOfMonth' => $startOfMonth, 'endOfMonth' => $endOfMonth]);
    }
}
