<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Services\PersianDateConverter;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Morilog\Jalali\Jalalian;

class AttendanceController extends Controller
{
    public function attendanceRecord(Employee $employee): Response
    {

        $tz = config('app.timezone');
        $now = Carbon::now($tz);

        $startOfMonth = $now->copy()->startOfMonth()->toDateString();
        $endOfMonth = $now->copy()->endOfMonth()->toDateString();
        $totalAbsentDays = $employee->attendances()->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->where('is_present', false)
            ->get();

        return Inertia::render('employee/attendance-record', compact('totalAbsentDays', 'employee'));
    }

    public function getAttendanceBasedOnDateRange(Request $request, Employee $employee, PersianDateConverter $dateConverter)
    {
        $persianDate = $request->string('persianDate')->toString();
        $persianDate = $persianDate !== '' ? $persianDate : Jalalian::now()->format('Y/m');

        try {
            ['start' => $start, 'end' => $end] = $dateConverter->toGregorianRange($persianDate, 'month');
        } catch (\InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $attendances = $employee->attendances()
            ->whereDate('date', '>=', $start)
            ->whereDate('date', '<=', $end)->orderBy('date')
            ->get();

        return response()->json([
            'attendances' => $attendances,
            'presentDays' => $attendances->where('is_present', true)->count(),
            'absentDays' => $attendances->where('is_present', false)->count(),
            'startDate' => $start->toDateString(),
            'endDate' => $end->toDateString(),
        ]);
    }
}
