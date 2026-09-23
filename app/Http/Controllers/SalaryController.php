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

        $selectedDate = $request->date('date') ?? Carbon::today(config('app.timezone'));

        $start = $selectedDate->copy()->startOfMonth();
        $end = $selectedDate->copy()->endOfMonth();

        $salaryRecords = $employee->salaries()->whereBetween('payment_date', [$start, $end])
            ->get();

        return response()->json(['salaries' => $salaryRecords, 'startOfDate' => $start, 'endOfDate' => $start, 'employee' => $employee]);
    }
}
