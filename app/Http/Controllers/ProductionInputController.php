<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\ProductionInput;
use App\Models\ProductionOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProductionInputController extends Controller
{


    public function getInputs(ProductionOrder $production_order)
    {
        // load bomLine 
        $production_order->load('bom:id,formula_name,min_exp_qty,max_exp_qty', 'bom.bomLines:id,item_id,bom_id,required_quantity', 'bom.bomLines.item:id,name,unit');

        //  LOAD PRODUCTION INPUTS 
        $production_order->load('productionInputs:id,production_order_id,item_id,quantity_used', 'productionInputs.item:id,name,unit,');

        $logo = Storage::url('public/logo/nobg.png');

        return Inertia::render('factory/order/ingredients', compact('production_order', 'logo'));
    }

    public function confirmInputs(ProductionOrder $production_order, string $status)
    {

        // if($status !== 'completed')
        //     return redirect()->to(route('orders.index'));

        $production_order->load('productionOutputs:id,product_id,production_order_id', 'productionOutputs.product:item_id,weight');
        $production_order->load('productionOutputs.product.item:id,name,category_id','productionOutputs.product.item.category:id,name');

        $items = Item::with('category:id,name')->whereHas('category', function ($q) use ($production_order) {
            $q->where('id', $production_order->productionOutputs()->first()->product->item->category_id);
        })->get();
        $production_order->load('productionInputs:id,item_id,quantity_used,production_order_id', 'productionInputs.item:id,name,unit');
        return Inertia::render('factory/order/confirm-inputs', compact('production_order','status','items'));
    }

    public function update(Request $request, ProductionOrder $production_order)
    {
        //  if ($status !== 'completed') {
        //         $production_order->status = $status;
        //         $production_order->save();
        //         $log = new Log();
        //         $des = 'حالت سفارش ' . $production_order->reference_no . ' تغیر از ' . $currentStatus . ' به' . $status . 'شد';
        //         $log->create('update', $des, null, route('orders.show', $production_order->id));
        //         DB::commit();
        //         Inertia::flash('toast', ['type' => "success", 'message' => 'حالت سفارش تغیر از ' . $currentStatus . '  به شد' . $status]);
        //         return redirect()->to(route('orders.show', $production_order->id));
        //     }
    }
}
