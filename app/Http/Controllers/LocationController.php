<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use phpDocumentor\Reflection\Types\Boolean;

class LocationController extends Controller
{
    public function index()
    {
        $locations = Location::all();
        return inertia('location/index', ['locations' => $locations]);
    }

    public function store(Request $request)
    {

        $data = $request->validate([
            'name' => "required|string|max:255",
            'type' => "string|required|exists:locations,type",
            'address' => "required | string|max:255",
        ]);

        DB::beginTransaction();
        try {
            Location::create($data);
            $log = new Log();
            $log->create('insert', 'موقعیت جدید به نام ایجاد شد' . $data['name']);
            Inertia::flash('toast', ['type' => 'success', 'message' => 'موقعیت جدید به نام ایجاد شد' . $data['name']]);
            DB::commit();
        } catch (\Throwable $th) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'موقعیت جدید به نام ایجاد نشد' . $th->getMessage()]);
            DB::rollBack();
        }
        return redirect()->back();
    }
    function update(Location $location, bool $is_active)
    {

        DB::transaction(function () use ($location,$is_active) {
            $log = new Log();
            $log->create('update', 'حالت موقعیت تغیر شد',$location->name);
            $location->is_active = !$is_active;
            $location->save();
            Inertia::flash('toast', ['type' => 'error', 'message' => 'حالت موقعیت تغیر شد']);
            return redirect()->back();
        }, 3);
    }
}
