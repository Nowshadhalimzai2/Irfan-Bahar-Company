<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\RegisteredUserController;

Route::middleware(['auth', 'superadmin'])->group(function () {
    Route::post('/users/{user}/role', [RegisteredUserController::class, 'update'])->name('employess.update');
    Route::put('/users/{status}/{user}', [RegisteredUserController::class, 'destroy'])->name('employess.destroy');
});
