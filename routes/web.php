<?php

use App\Actions\Fortify\CreateNewUser;
use App\Custome\Log;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\LogController;
use App\Http\Middleware\EnsureUserIsSuperAdmin;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

Route::inertia('/', 'welcome')->name('home');
// Route::inertia('/products',)->name('products.index');
Route::inertia('/contact-us','contact-us')->name('contact-us');
Route::inertia('/about-us','about-us')->name('about-us');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::middleware(['auth', 'can:manage-users'])->group(function () {
    Route::get('/register', function () {
        return Inertia::render('auth/register', [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'roles' => Role::select('id', 'name')->get(),
        ]);
    })->name('register');

    Route::post('/register', function (Request $request, CreateNewUser $creator) {
        DB::beginTransaction();
        try {
            $user = $creator->create($request->all());
            $log = new Log();
            $log->create('insert',' برای '.$user->name.' اکونت ساخته شده توسط '.Auth::user()->name);
            DB::commit();
        } catch (\Throwable $th) {
            DB::rollBack();
            return redirect()->back()->with('error',$th->getMessage());
        }

        return redirect()->route('dashboard')->with('success', 'User created successfully.');
    })->name('register.store');
});

Route::middleware(['auth', 'superadmin'])->group(function(){
    Route::get('/stackholders', [EmployeeController::class,'index']);
    Route::get('/logs',[LogController::class,'index'])->name('logs.index');

});

require __DIR__.'/settings.php';
