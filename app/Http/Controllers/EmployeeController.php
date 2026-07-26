<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;

class EmployeeController extends Controller
{


    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {

        return Inertia::render('employee/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'f_name' => 'required|string|max:255',
            // phone: allow numeric string up to 10 characters
            'phone' => 'required|string|max:10|starts_with:07',
            'address' => 'required|string|max:255',
            'position' => 'required|string',
            'salary' => 'required|numeric',
            'shift' => 'required|string',

        ]);
        DB::beginTransaction();
        try {
            $emp = Employee::create([
                ...$validated,
                'recruitment_date' => now(),
            ]);
            $log=new Log();
            $log->create('insert'," کارکن جدید ",$emp->name);
            DB::commit();
            Inertia::flash('toast', ['type' => 'success', 'message' => ' را موفقانه در سیستم اضافه شد '.$emp->name]);
            return redirect()->to(route('employees.index'));
        } catch (\Throwable $th) {
            DB::rollBack();
            Inertia::flash('toast', ['type' => 'error', 'message' => 'کارکن را در سیستم اضافه نشد '.$th->getMessage()]);
            return redirect()->back();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        DB::beginTransaction();
        try {
            $preRole = $user->role->name;
            $data = $request->validate([
                'role' => 'required|string|exists:roles,name',
            ]);
            $role = Role::where('name', $data['role'])->first();
            $user->role_id = $role->id;
            $user->save();
            //          Create new log for role updatation
            $log = new Log();
            $log->create('update',  $request->role . ' به ' . $preRole . ' از ' . ' نقش', $user->name, URL::previous());
            Inertia::flash('toast', ['type' => 'success', 'message' => 'نقش یوزر را موفقانه به روز شد']);
            DB::commit();
            return response()->json(['user' => $user->load('role:id,name'), 'role' => $request->role]);
        } catch (\Throwable $th) {
            DB::rollBack();
            Inertia::flash('toast', ['type' => 'error', 'message' => 'role not  updated']);
            return response()->json(['error' => $th->getMessage()]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(bool $status, User $user)
    {
        DB::beginTransaction();
        try {
            $log = new Log();
            $log->create('delete', '', $user->name);
            $user->status = $status;
            $user->save();
            Inertia::flash('toast', ['type' => 'success', 'message' => ' موفقانه غیر فعال شد ' . $user->name . ' اکونت یوزر']);
            DB::commit();
        } catch (\Throwable $th) {
            Inertia::flash('toast', ['type' => 'error', 'message' => ' غیر فعال نشد ' . $user->name . ' اکونت یوزر' . $th->getMessage()]);
            DB::rollBack();
        }
        return redirect()->back();
    }
}
