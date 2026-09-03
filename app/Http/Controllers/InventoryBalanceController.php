<?php

namespace App\Http\Controllers;

use App\Models\InventoryBalance;
use App\Models\Item;
use App\Models\Location;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryBalanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Item::with('inventoryBalances', 'inventoryBalances.location:id,name', 'product:item_id,per_pack,weight', 'category:id,name')
            ->whereHas('inventoryBalances', function ($balanceQuery) {
                $balanceQuery->whereNot('quantity_on_hand', 0);
            });

        $itemType = $request->query('item_type');
        if ($itemType) {
            $itemTypes = is_array($itemType)
                ? $itemType
                : explode(',', (string) $itemType);

            $itemTypes = array_values(array_filter(array_map('trim', $itemTypes)));
            if ($itemTypes !== []) {
                $query->whereIn('item_type', $itemTypes);
            }
        }

        $category = $request->query('category');
        if ($category && $category !== 'all') {
            $query->whereHas('category', function ($categoryQuery) use ($category) {
                $categoryQuery->where('name', $category);
            });
        }

        $locationId = $request->query('location_id');
        if ($locationId !== null && $locationId !== '' && $locationId !== 'all') {
            $query->whereHas('inventoryBalances', function ($balanceQuery) use ($locationId) {
                $balanceQuery->where('location_id', (int) $locationId);
            });
        }

        $items = $query->paginate(10)->withQueryString();
        $locations = Location::select('id', 'name')->whereNot('name','other')->orderBy('name')->get();

        return Inertia::render('inventory-balance/index', compact('items', 'locations'));
    }

    public function filterItems($filterData)
    {
        return response()->json($filterData);
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
