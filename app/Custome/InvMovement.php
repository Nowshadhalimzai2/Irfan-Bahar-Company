<?php

namespace App\Custome;

use App\Models\InventoryBalance;
use App\Models\InventoryMovement;
use InvalidArgumentException;

class InvMovement
{
    public function move(
        int $locID,
        int $itemID,
        float $quantity,
        string $moveType,
        ?string $notes = '',
        ?string $operation = '+'
    ) {
        if (!in_array($operation, ['+', '-'], true)) {
            throw new InvalidArgumentException(
                'The inventory operation must be + or -.'
            );
        }

        $quantity = abs($quantity) * ($operation === '-' ? -1 : 1);

        if (! $this->updateInventory($locID, $itemID, $quantity)) {
            throw new \RuntimeException('Unable to update inventory.');
        }

        $referencePrefix = collect(explode('_', $moveType))
            ->map(fn($part) => substr($part, 0, 1))
            ->implode('');

        $movement = InventoryMovement::create([
            'location_id' => $locID,
            'item_id' => $itemID,
            'quantity' => $quantity,
            'movement_type' => $moveType,
            'notes' => $notes ?? '',
            'reference_no' => '',
            'occured_at' => now(config('app.timezone')),
        ]);

        $movement->update([
            'reference_no' => sprintf(
                '%s-%s-%s',
                strtoupper($referencePrefix),
                now(config('app.timezone'))->year,
                str_pad($movement->id, 5, '0', STR_PAD_LEFT)
            ),
        ]);

        return true;
    }

    private function updateInventory(int $locID, int $itemID, float $quantity): bool
    {
        $inventory = InventoryBalance::where('location_id', $locID)
            ->where('item_id', $itemID)
            ->lockForUpdate()
            ->first();

        if ($inventory === null) {
            if ($quantity < 0) {
                return false;
            }

            $inventory = new InventoryBalance([
                'item_id' => $itemID,
                'location_id' => $locID,
                'quantity_on_hand' => 0,
                'reserved' => 0,
            ]);
        }

        $availableQuantity = $inventory->quantity_on_hand - $inventory->reserved;
        if ($quantity < 0 && abs($quantity) > $availableQuantity) {
            return false;
        }

        $inventory->quantity_on_hand += $quantity;
        $inventory->save();

        return true;
    }
}
