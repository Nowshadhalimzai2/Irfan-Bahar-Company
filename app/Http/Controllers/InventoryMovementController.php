<?php

namespace App\Http\Controllers;

use App\Models\InventoryMovement;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryMovementController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'movement_id' => ['nullable', 'integer', 'exists:inventory_movements,id'],
        ]);
        $query = InventoryMovement::query()
            ->with('location:id,name', 'item:id,name,code')
            ->select('id', 'location_id', 'item_id', 'movement_type', 'quantity', 'occured_at', 'reference_no')
            ->when(
                isset($filters['movement_id']),
                fn ($query) => $query->whereKey($filters['movement_id']),
            )
            ->orderByDesc('occured_at')
            ->orderByDesc('id');

        if ($request->user() instanceof User && $request->user()->hasRole('factory_clerk')) {
            $query->whereHas('location', fn ($location) => $location->whereIn('type', ['factory', 'warehouse']));
        }

        $movements = $query->paginate(20)->withQueryString();

        return Inertia::render('inventory-movement/index', compact('movements'));
    }
}
