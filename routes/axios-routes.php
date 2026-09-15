<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\SaleController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\RegisteredUserController;

Route::middleware(['auth', 'superadmin'])->group(function () {
    Route::put('/users/{user}/role', [RegisteredUserController::class, 'update'])->name('users.update');
    Route::put('/users/{user}/{status}', [RegisteredUserController::class, 'destroy'])->name('employess.destroy');
    Route::post('/employees/{employee}/salary-range', [SalaryController::class, 'getSalryBasedOnMonth'])->name('emplyee-salary-range');
    Route::post('/employees/{employee}/attendance-range', [AttendanceController::class, 'getAttendanceBasedOnDateRange'])->name('emplyee-attendance-range');
});


Route::middleware(['auth', 'allowOnlyShopClerk'])->group(function (){
    
    Route::put('/expenses/{expense}/toggle-editable', [ExpenseController::class, 'toggleEditable'])->name('expenses.toggle-editable');
});

Route::get('/sales/getTrend/{period}',[SaleController::class,'index'])->middleware('auth')->name('sales.period');
