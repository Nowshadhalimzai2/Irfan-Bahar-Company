<?php

namespace App\Custome;

use App\Models\InventoryBalance;
use App\Models\InventoryMovement;
use Carbon\Carbon;

class InvMovement
{

    public function move(?int $fromID = null, ?int $toID = null, int $itemID, int $quantity, string $moveType, ?string $notes = '', string $ref)
    {
        $referencePrefix = $ref ?: collect(explode('_', $moveType))
            ->map(fn($part) => substr($part, 0, 1))
            ->implode('');

        $movement = InventoryMovement::create([
            'location_id' => $fromID ?: $toID,
            'item_id' => $itemID,
            'quantity' => $fromID != null ? -$quantity : $quantity,
            'movement_type' => $moveType,
            'notes' => $notes,
            'reference_no' => '',
            'occured_at' => now(config('app.timezone')),
        ]);

        $movement->reference_no = sprintf('%s-%s-%s', strtoupper($referencePrefix), Carbon::now(config('app.timezone'))->year, $movement->id);
        $movement->save();
    }

    public function updateInventory(int $locID, int $itemID, int $quantity, ?string $operator = 'increase')
    {
        if ($operator === 'decrease') {
            $quantity = -$quantity;
        }

        $inventory = InventoryBalance::firstOrNew(
            ['item_id' => $itemID, 'location_id' => $locID],
            ['quantity_on_hand' => 0, 'reserved' => 0]
        );

        $inventory->quantity_on_hand += $quantity;
        $inventory->save();

        return $inventory;
    }
}
