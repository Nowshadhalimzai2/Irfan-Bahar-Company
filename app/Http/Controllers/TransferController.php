<?php

namespace App\Http\Controllers;

use App\Custome\InvMovement;
use App\Custome\Log;
use App\Models\Item;
use App\Models\Location;
use App\Models\Transfer;
use App\Models\TransferLine;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Models\InventoryBalance;
use Error;
use Inertia\Inertia;
use Monolog\Processor\LoadAverageProcessor;

class TransferController extends Controller
{
   

// the INDEX METHOD OF TRANSFERCONTROLLER IS IN THE GOODS-RECEIPT CONTROLLER



    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request, ?Location $location)
    {

        $locations = Location::select('id', 'name')->get();
        if ($location instanceof Location) {
            if ($request->expectsJson()) {
                $items = Item::with('inventoryBalances:id,location_id,item_id,quanity_on_hand,reserved')
                    ->whereHas(
                        'inventoryBalances',
                        fn($query) =>
                        $query->where('location_id', $location->id)
                    )->get();
                return response()->json($items);
            }
        }

        $items = Item::with(['product', 'inventoryBalances' => function ($query) {
            $query->select('id', 'item_id', 'quantity_on_hand')->where('quantity_on_hand', '>', 0);
        }])->whereHas('inventoryBalances', function ($query) {
            $query->where('quantity_on_hand', '>', 0);
        })->select('id', 'name', 'unit','default_sale_price')->get();

        return Inertia::render('transfer/create', compact('locations', 'items'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'source_id' => 'required|integer|exists:locations,id',
            'destination_id' => 'required|integer|exists:locations,id',
            'notes' => 'string|nullable|max:255',
            'transferLines' => 'required|array|min:1',

            // each line validation
            'transferLines.*.item_id' => 'required|integer|exists:items,id',
            'transferLines.*.quantity' => 'required|integer|gt:0',
            'transferLines.*.unit_price' => 'required|numeric|gt:0',
        ]);

        $log = new Log();

        if ($data['source_id'] === $data['destination_id']) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'موقیعت ها ممکن نیست که بک جای باشد.']);
            return redirect()->back()->withInput();
        }
        DB::beginTransaction();
        try {
            // create the goods receipt 
            $transfer = Transfer::create([
                'source_id' => $data['source_id'],
                'destination_id' => $data['destination_id'],
                'notes' => $data['notes'] ?? '',
                'transferred_at' => Carbon::now(config('app.timezone')),
                'reference_no' => '',
            ]);

            $transfer->reference_no = sprintf('TR-%s-%s', Carbon::now(config('app.timezone'))->year, str_pad($transfer->id, 5, '0', STR_PAD_LEFT));
            $transfer->save();

            // ===== CREATE THE GOODS RECEIPE LINES =====
            foreach ($data['transferLines'] as $line) {

                $transfer->transferLines()->create($line);
                //  ======== RECORD THE INVENTORY MOVEMENT ===
                $inventory = new InvMovement();
                // -------- if the quantity while being reduced not enough in location that will throw an error
                if (!$inventory->move($data['source_id'], $line['item_id'], $line['quantity'], 'transferred_out', $data['notes'], '-')) {
                    throw new Error("در مرجع" . ' کافی مقدار نداریم');
                }
                $inventory->move($data['destination_id'], $line['item_id'], $line['quantity'], 'transferred_in', $data['notes']);
                // ======== UPDATE INVENTORY BALANCE =======
            }
            $des = 'اجناس از {$transfer->source->name} به ${$transfer->destination->name} انتقال شد';
            $log->create('insert', $des);
            DB::commit();
            Inertia::flash('toast', ['type' => 'success', 'message' => 'جنس نو امد به کارخانه .']);

            // BOTH RECEIPTS AND TRANSFERS ARE IN SINGLE TABL       
            return redirect()->route('receipts.index');
        } catch (\Throwable $th) {
            // Let validation exceptions bubble so Inertia/Laravel can return proper validation responses
            if ($th instanceof ValidationException) {
                throw $th;
            }
            $des = 'اجناس از {$transfer->source->name} به ${$transfer->destination->name} انتقال نشد';
            $log->create('insert', $des);
            DB::rollBack();
            Inertia::flash('toast', ['type' => 'error', 'message' => 'جنس نو وارد نشد .' . $th->getMessage()]);
            return redirect()->back();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Transfer $transfer)
    {
        $transfer->load('source:id,name', 'destination:id,name', 'transferLines:id,transfer_id,quantity,item_id', 'transferLines.item:id,name,unit,default_sale_price,code,sku');
        $transfer->load('transferLines.item.product:item_id,weight,per_pack,barcode');
        return Inertia::render('transfer/show', compact('transfer'));
    }


    public function getItemBalance(Location $location, Item $item)
    {
        $balance = InventoryBalance::with('item:id,name,unit')->where('location_id', $location->id)->where('item_id', $item->id)->first();
        return response()->json($balance);
    }
}
