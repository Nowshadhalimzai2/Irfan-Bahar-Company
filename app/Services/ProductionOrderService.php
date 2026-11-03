<?php

namespace App\Services;

use App\Models\ProductionInput;
use App\Models\ProductionOrder;
use Illuminate\Validation\ValidationException;

class ProductionOrderService
{
    public function syncExpectedInputs(ProductionOrder $order): void
    {
        $order->load([
            'bom:id,min_exp_qty,max_exp_qty',
            'bom.bomLines:id,bom_id,item_id,item_unit_id,required_quantity',
            'bom.bomLines.itemUnit:id,conversion_to_base',
            'productionOutputs:id,production_order_id,product_id,quantity_produced',
            'productionOutputs.product:item_id,weight',
        ]);

        $maxExpectedQuantity = (float) $order->bom->max_exp_qty;
        if ($maxExpectedQuantity <= 0) {
            throw ValidationException::withMessages([
                'bom_id' => 'مقدار تخمینی فورمول معتبر نیست.',
            ]);
        }

        $orderedQuantity = $order->productionOutputs->sum(
            fn ($output) => (float) $output->quantity_produced * (float) $output->product->weight,
        );

        $expectedInputs = [];
        foreach ($order->bom->bomLines as $line) {
            $expectedInputs[$line->item_id] = round(
                (float) $line->required_quantity
                    * (float) ($line->itemUnit?->conversion_to_base ?? 1)
                    * $orderedQuantity
                    / $maxExpectedQuantity,
                3,
            );
        }

        if ($expectedInputs === []) {
            throw ValidationException::withMessages([
                'bom_id' => 'برای این فورمول مواد اولیه تعریف نشده است.',
            ]);
        }

        $order->productionInputs()
            ->whereNotIn('item_id', array_keys($expectedInputs))
            ->delete();

        foreach ($expectedInputs as $itemId => $quantity) {
            ProductionInput::updateOrCreate(
                [
                    'production_order_id' => $order->id,
                    'item_id' => $itemId,
                ],
                ['quantity_used' => $quantity],
            );
        }
    }
}
