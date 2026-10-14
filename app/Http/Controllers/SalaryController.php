<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Services\PersianDateConverter;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Morilog\Jalali\Jalalian;

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
    public function getSalryBasedOnMonth(Request $request, Employee $employee, PersianDateConverter $dateConverter)
    {
        $persianDate = $request->string('persianDate')->toString();
        $persianDate = $persianDate !== '' ? $persianDate : Jalalian::now()->format('Y/m');
        try {
            ['start' => $start, 'end' => $end] = $dateConverter->toGregorianRange($persianDate, 'month');
        } catch (\InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
       

        $salaryRecords = $employee->salaries()
            ->whereDate('payment_date', '>=', $start)
            ->whereDate('payment_date', '<=', $end)
            ->get();

        return response()->json(['salaries' => $salaryRecords, 'startOfDate' => $start, 'endOfDate' => $start, 'employee' => $employee]);
    }
}
