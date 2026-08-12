<?php

namespace App\Http\Controllers;

use App\Models\BOM;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BOMController extends Controller
{
    public function index() : Response {

        $boms = BOM::with('product:item_id,weight,per_pack','product.item:id,name,unit,item_type,category_id','product.item.category:id,name')->get();
        return Inertia::render('bom/index',compact('boms'));
        
    }
}
