<?php

namespace App\Http\Controllers;

use App\Custome\InvMovement;
use App\Custome\Log;
use App\Models\Currency;
use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptLine;
use App\Models\InventoryMovement;
use App\Models\Item;
use App\Models\Location;
use App\Models\Supplier;
use App\Models\Transfer;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GoodsReceiptController extends Controller
{

    function index()
    {
        $transfers = Transfer::with('source:id,name','destination:id,name','transferLines:id,item_id,transfer_id,quantity,unit_price','transferLines.item:id,name,unit,item_type')
            ->select('id','source_id','destination_id','reference_no','notes','transferred_at')
            ->orderBy('id','desc')->paginate(10);
        $goodsReceipts = GoodsReceipt::with('supplier:id,name', 'receiptLines', 'location:id,name')->orderBy('id', 'desc')->paginate(10);
        return Inertia::render('goods-receipt/index', compact('goodsReceipts','transfers'));
    }
    function create()
    {

        $suppliers = Supplier::select('id', 'name')->get();
        $locations = Location::select('id', 'name')->get();
        $currencies = Currency::select('id', 'name')->get();
        $items = Item::with('product')->select('id', 'name', 'unit')->get();

        return Inertia::render('goods-receipt/create', compact('suppliers', 'locations', 'currencies', 'items'));
    }

    public function store(Request $request)
    {
        // ========== VALIDATE DATA ===========
        $data = $request->validate([
            'supplier_id' => 'required|integer|exists:suppliers,id',
            'destination_location_id' => 'required|integer|exists:locations,id',
            'notes' => 'nullable|string|max:255',
            'receiptLines' => 'required|array|min:1',

            // each line validation
            'receiptLines.*.item_id' => 'required|integer|exists:items,id',
            'receiptLines.*.quantity' => 'required|integer|gt:0',
            'receiptLines.*.unit_cost' => 'required|numeric|gt:0',
            'receiptLines.*.currency_id' => 'required|integer|exists:currencies,id',
        ]);
        $log = new Log();
        DB::beginTransaction();
        try {
            // create the goods receipt 
            $receipt = GoodsReceipt::create([
                'supplier_id' => $data['supplier_id'],
                'destination_location_id' => $data['destination_location_id'],
                'notes' => $data['notes'] ?? '',
                'received_at' => Carbon::now(config('app.timezone')),
                'reference_no' => '',
            ]);

            $receipt->reference_no = sprintf('GR-%s-%s', Carbon::now(config('app.timezone'))->year, $receipt->id);
            $receipt->save();

            // ===== CREATE THE GOODS RECEIPE LINES =====
            foreach ($data['receiptLines'] as $line) {
                GoodsReceiptLine::create(array_merge($line, ['receipt_id' => $receipt->id]));

                //  ======== RECORD THE INVENTORY MOVEMENT ===
                $inventory = new InvMovement();
                $inventory->move($data['destination_location_id'], $line['item_id'], $line['quantity'], 'receipt', $data['notes']);
            }

            $log->create('insert', ' جنس نو وارد شد در '.$receipt->location->name);
            DB::commit();

            Inertia::flash('toast', ['type' => 'success', 'message' => 'جنس نو امد به کارخانه .']);
            return redirect()->route('receipts.index');
        } catch (\Throwable $th) {
            $log->create('insert', 'جنس نو وارد نشد ');
            DB::rollBack();
            Inertia::flash('toast', ['type' => 'error', 'message' => 'جنس نو وارد نشد .' . $th->getMessage()]);
            return redirect()->back();
        }
    }

    public function show(GoodsReceipt $receipt)
    {
        $receipt->load('location:id,name', 'receiptLines:id,item_id,quantity,receipt_id,unit_cost, currency_id', 'supplier:id,name');
        $receipt->load('receiptLines.item:id,name,unit,product_id','receiptLines.currency:id,name','receiptLines.item.product:item_id,weight');
        return Inertia::render('goods-receipt/show', compact('receipt'));
    }
}
