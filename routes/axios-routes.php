<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\SalaryController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\RegisteredUserController;

Route::middleware(['auth', 'superadmin'])->group(function () {
    Route::put('/users/{user}/role', [RegisteredUserController::class, 'update'])->name('users.update');
    Route::put('/users/{user}/{status}', [RegisteredUserController::class, 'destroy'])->name('employess.destroy');
    Route::post('/employees/{employee}/salary-range', [SalaryController::class, 'getSalryBasedOnMonth'])->name('emplyee-salary-range');
    Route::post('/employees/{employee}/attendance-range', [AttendanceController::class, 'getAttendanceBasedOnDateRange'])->name('emplyee-attendance-range');
});
