<?php

namespace App\Http\Controllers;

use App\Models\InventoryBalance;
use App\Models\Item;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryBalanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $items = Item::with('inventoryBalances','inventoryBalances.location:id,name')->paginate(10);

        return Inertia::render('inventory-balance/index',compact('items'));
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
    public function show(InventoryBalance $inventoryBalance)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(InventoryBalance $inventoryBalance)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, InventoryBalance $inventoryBalance)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(InventoryBalance $inventoryBalance)
    {
        //
    }
}
