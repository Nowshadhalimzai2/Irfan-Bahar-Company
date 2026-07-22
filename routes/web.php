<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
// Route::inertia('/products',)->name('products.index');
Route::inertia('/contact-us','contact-us')->name('contact-us');
Route::inertia('/about-us','about-us')->name('about-us');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
