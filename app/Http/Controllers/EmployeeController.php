<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $users=User::with('role:id,name')->select(['id','name','email','role_id'])->get();
        $roles=Role::select('id','name')->get();
        return Inertia::render('stackholder/index',compact('users','roles'));
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
        $data = $request->validate([
            'role' => 'required|string|exists:roles,name',
            ]);
            
            $role = Role::where('name', $data['role'])->first();
            $user->role_id = $role->id;
            $user->save();
            return response()->json(['user' => $user->load('role:id,name'),'role' => $request->role]);

    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        
    }
}
