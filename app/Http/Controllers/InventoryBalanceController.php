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

        $items = $query->paginate(10)->withQueryString();

        return Inertia::render('inventory-balance/index', compact('items'));
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
