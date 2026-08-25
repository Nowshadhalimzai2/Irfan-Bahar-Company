<?php

namespace App\Custome;

use App\Models\InventoryBalance;
use App\Models\InventoryMovement;
use Carbon\Carbon;
use Error;

class InvMovement
{

    public function move(int $locID, int $itemID, int $quantity, string $moveType, ?string $notes = '',  ?string $operation = '+')
    {
        if($operation === '-')
            $quantity= -$quantity;
        $referencePrefix = collect(explode('_', $moveType))
            ->map(fn($part) => substr($part, 0, 1))
            ->implode('');

        $movement = InventoryMovement::create([
            'location_id' => $locID,
            'item_id' => $itemID,
            'quantity' => $quantity,
            'movement_type' => $moveType,
            'notes' => $notes,
            'reference_no' => '',
            'occured_at' => now(config('app.timezone')),
        ]);

        $movement->reference_no = sprintf('%s-%s-%s', strtoupper($referencePrefix), Carbon::now(config('app.timezone'))->year, str_pad($movement->id,5,'0',STR_PAD_LEFT));
        $movement->save();
        return $this->updateInventory($locID,$itemID,$quantity);
    }

    private function updateInventory(int $locID, int $itemID, int $quantity)
    {
        $is_quantity_being_reduced = $quantity<0;

        if($is_quantity_being_reduced){
            $balance = InventoryBalance::with('location:id,name','item:id,name')
            ->select('id','location_id','item_id','quantity_on_hand','reserved')
            ->where('location_id',$locID)
            ->where('item_id',$itemID)
            ->first();
            $quantity_in_stock = ($balance->quantity_on_hand ?? 0)- ($balance->quantity_reserved ?? 0);
            if($quantity>$quantity_in_stock){
                return false;
            }
        }
        $inventory = InventoryBalance::firstOrNew(
            ['item_id' => $itemID, 'location_id' => $locID],
            ['quantity_on_hand' => 0, 'reserved' => 0]
        );

        $inventory->quantity_on_hand += $quantity;
        $inventory->save();

        return true;
    }
}
