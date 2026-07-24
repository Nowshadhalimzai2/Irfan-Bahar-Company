<?php

use App\Http\Controllers\EmployeeController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'superadmin'])->group(function () {
    Route::post('/users/{user}/role', [EmployeeController::class, 'update'])->name('employess.update');
    Route::delete('/users/{user}', [EmployeeController::class, 'destroy'])->name('employess.destroy');
});
