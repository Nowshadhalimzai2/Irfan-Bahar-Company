<?php

namespace App\Http\Controllers;

use App\Models\Currency;
use App\Models\GoodsReceipt;
use App\Models\Item;
use App\Models\Location;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GoodsReceiptController extends Controller
{

    function index()
    {
        $goodsReceipts = GoodsReceipt::with('supplier', 'receiptLines')->orderBy('id', 'desc')->paginate(10);
        return Inertia::render('goods-receipt/index', compact('goodsReceipts'));
    }
    function create()
    {

        $suppliers = Supplier::select('id', 'name')->get();
        $locations = Location::select('id', 'name')->get();
        $currencies = Currency::select('id', 'name')->get();
        $items = Item::with('product')->select('id', 'name')->get();

        return Inertia::render('goods-receipt/create', compact('suppliers', 'locations','currencies','items'));
    }

    public function store(Request $request){
        return $request->all();
    }
}
