<?php

namespace App\Http\Controllers;

use App\Models\InventoryBalance;
use App\Models\Item;
use App\Models\Location;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryBalanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $allowedLocationTypes = $request->user() instanceof User
            && $request->user()->hasRole('factory_clerk')
            ? ['factory', 'warehouse']
            : ['factory', 'warehouse', 'shop'];

        $query = Item::query()
            ->with([
                'inventoryBalances' => fn ($balanceQuery) => $balanceQuery
                    ->whereHas('location', fn ($locationQuery) => $locationQuery->whereIn('type', $allowedLocationTypes))
                    ->with('location:id,name'),
                'units' => fn ($unitQuery) => $unitQuery
                    ->select('id', 'item_id', 'name', 'symbol', 'conversion_to_base', 'code', 'barcode', 'selling_price', 'purchase_price', 'is_active')
                    ->where('is_active', true)
                    ->orderBy('conversion_to_base'),
                'baseUnit:id,item_id,name,symbol,conversion_to_base,code,barcode,selling_price,purchase_price,is_active',
                'product:item_id,per_pack,weight,barcode,description',
                'category:id,name',
            ])
            ->whereHas('inventoryBalances', function ($balanceQuery) use ($allowedLocationTypes) {
                $balanceQuery
                    ->where(function ($quantityQuery) {
                        $quantityQuery->whereNot('quantity_on_hand', 0)
                            ->orWhereNot('reserved', 0);
                    })
                    ->whereHas('location', fn ($locationQuery) => $locationQuery->whereIn('type', $allowedLocationTypes));
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
        $query->whereHas('inventoryBalances', function ($balanceQuery) use ($locationId, $allowedLocationTypes) {
            $balanceQuery->where('location_id', (int) $locationId)
                ->whereHas('location', fn ($locationQuery) => $locationQuery->whereIn('type', $allowedLocationTypes));
        });
        }

        $items = $query->paginate(10)->withQueryString();
        $locations = Location::query()
            ->select('id', 'name')
            ->whereIn('type', $allowedLocationTypes)
            ->orderBy('name')->get();

        return Inertia::render('inventory-balance/index', compact('items', 'locations'));
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
