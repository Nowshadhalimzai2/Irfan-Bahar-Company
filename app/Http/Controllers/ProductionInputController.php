<?php

namespace App\Http\Controllers;

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

        return Inertia::render('factory/order/ingredients', compact('production_order','logo'));
    }
}
