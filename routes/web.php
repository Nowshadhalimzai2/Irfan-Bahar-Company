<?php

use App\Actions\Fortify\CreateNewUser;
use App\Custome\Log;
use App\Http\Controllers\LogController;
use App\Http\Controllers\EmployeeController;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

Route::inertia('/', 'welcome')->name('home');
// Route::inertia('/products',)->name('products.index');
Route::inertia('/contact-us', 'contact-us')->name('contact-us');
Route::inertia('/about-us', 'about-us')->name('about-us');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::get('/register', function () {
    foreach (['super_admin', 'admin', 'shop_clerk', 'factory_clerk'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName]);
    }

    if (User::query()->exists()) {
        Gate::authorize('manage-users');
    }

    return Inertia::render('auth/register', [
        'passwordRules' => Password::defaults()->toPasswordRulesString(),
        'roles' => Role::select('id', 'name')->get(),
    ]);
})->name('register');

Route::post('/register', function (Request $request, CreateNewUser $creator) {
    if (User::query()->exists()) {
        Gate::authorize('manage-users');
    }

    DB::beginTransaction();
    try {
        $user = $creator->create($request->all());

        if (! Auth::check()) {
            Auth::login($user);
        }

        $actorName = Auth::check() ? Auth::user()->name : 'system';
        $log = new Log();
        $log->create('insert', $request->name . ' یوزر ساخته شد برای');
        Inertia::flash('toast', ['type' => 'success', 'message' => ' موفقانه ایجاد شد {$request->name} اکونت یوزر']);
        DB::commit();
    } catch (\Throwable $th) {
        DB::rollBack();
        Inertia::flash('toast', ['type' => 'success', 'message' => ' یک مشکل در وجود امد. ' . $th->getMessage()]);
        return redirect()->back();
    }

    return redirect()->route('dashboard')->with('success', 'User created successfully.');
})->name('register.store');

Route::middleware(['auth', 'can:manage-users'])->group(function () {
    Route::get('/stackholders', [EmployeeController::class, 'index']);
    Route::get('/logs', [LogController::class, 'index'])->name('logs.index');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/axios-routes.php';
