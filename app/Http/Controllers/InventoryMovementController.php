<?php

namespace App\Http\Controllers;

use App\Models\InventoryMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryMovementController extends Controller
{
    public function index () : Response {

            $movements = InventoryMovement::with('location:id,name','item:id,name')->select('id','location_id','item_id','movement_type','quantity','occured_at','reference_no')->orderBy('id','desc')->paginate();

        return Inertia::render('inventory-movement/index',compact('movements'));
    }
}
