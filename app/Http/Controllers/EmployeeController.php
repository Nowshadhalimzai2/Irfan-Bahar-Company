<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $users = User::with('role:id,name')->select(['id', 'name', 'email', 'role_id','status'])->get();
        $roles = Role::select('id', 'name')->get();
        return Inertia::render('stackholder/index', compact('users', 'roles'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
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
            $data = $request->validate([
                'role' => 'required|string|exists:roles,name',
            ]);
            $role = Role::where('name', $data['role'])->first();
            $user->role_id = $role->id;
            $user->save();
            //          Create new log for role updatation
            $log = new Log();
            $log->create('update', 'نقش', null, URL::previous());
            Inertia::flash('toast', ['type' => 'success', 'message' => 'role updated']);
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
    public function destroy(bool $status,User $user)
    {
        DB::beginTransaction();
        try {
            $log = new Log();
            $log->create('delete','',$user);
            $user->status = $status;
            $user->save();
            Inertia::flash('toast', ['type' => 'success', 'message' => ' موفقانه غیر فعال شد ' . $user->name . ' اکونت یوزر']);
            DB::commit();
        } catch (\Throwable $th) {
            Inertia::flash('toast', ['type' => 'error', 'message' => ' غیر فعال نشد '.$user->name.' اکونت یوزر' . $th->getMessage()]);
            DB::rollBack();
        }
        return redirect()->back();
    }
}
