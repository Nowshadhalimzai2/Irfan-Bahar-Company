<?php

namespace App\Http\Controllers;

use App\Custome\InvMovement;
use App\Custome\Log;
use App\Models\Item;
use App\Models\Location;
use App\Models\Transfer;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Models\InventoryBalance;
use App\Models\TransferLine;
use App\Models\User;
use App\Notifications\TransferCreated;
use Error;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Throwable;

class TransferController extends Controller
{
   

// the INDEX METHOD OF TRANSFERCONTROLLER IS IN THE GOODS-RECEIPT CONTROLLER



    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request, ?Location $location)
    {
        Gate::authorize('allow-factory_clerk');

        $locations = Location::select('id', 'name')->whereNotIn('type', ['other'])->get();
        $sourceLocations = Location::query()->select('id', 'name', 'type')->whereNotIn('type', ['shop', 'other', 'office'])->get();
        // dd($sourceLocations);
        if ($location instanceof Location) {
            if ($request->expectsJson()) {
                $items = Item::with('inventoryBalances:id,location_id,item_id,quantity_on_hand,reserved')
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
        })->select('id', 'name', 'unit', 'default_sale_price')->get();

        return Inertia::render('transfer/create', compact('locations', 'items', 'sourceLocations'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Gate::authorize('allow-factory_clerk');

        $data = $request->validate([
            'source_id' => 'required|integer|exists:locations,id',
            'destination_id' => 'required|integer|exists:locations,id',
            'transferred_at' => 'required|date',
            'notes' => 'string|nullable|max:255',
            'transferLines' => 'required|array|min:1',

            // each line validation
            'transferLines.*.item_id' => 'required|integer|exists:items,id|distinct',
            'transferLines.*.quantity' => 'required|integer|gt:0',
            'transferLines.*.itemPrice' => 'required|numeric|gt:0',
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
                'transferred_at' => $data['transferred_at'],
                'reference_no' => '',
                'status' => 'suggested',
            ]);

            $transfer->reference_no = sprintf('TR-%s-%s', Carbon::now(config('app.timezone'))->year, str_pad($transfer->id, 5, '0', STR_PAD_LEFT));
            $transfer->save();
            // ===== CREATE THE TRANSFER LINES =====
            foreach ($data['transferLines'] as $line) {

                $balance = InventoryBalance::where('location_id', $data['source_id'])
                    ->where('item_id', $line['item_id'])
                    ->lockForUpdate()
                    ->first();
                $available = ($balance?->quantity_on_hand ?? 0) - ($balance?->reserved ?? 0);
                if ($available < $line['quantity']) {
                    throw new Error('مقدار قابل انتقال برای این جنس کافی نیست.');
                }

                $transfer->transferLines()->create([
                    'item_id' => $line['item_id'],
                    'quantity' => $line['quantity'],
                    'unit_price' => Item::findOrFail($line['item_id'])->default_sale_price,
                ]);
            }
            $des = 'اجناس از ' . $transfer->source->name . ' به ' . $transfer->destination->name . ' پیشنهاد شد';
            $log->create('insert', $des);
            DB::commit();
            $transfer->load('source:id,name', 'destination:id,name');
            $shopUsers = User::query()->with('role:id,name')->whereHas('role', fn($q) => $q->where('name', 'shop_clerk'))->get();
            foreach ($shopUsers as $user) {
                $user->notify(new TransferCreated($transfer, 'اجناس نو یشنهاد شد'));
            }

            Inertia::flash('toast', ['type' => 'success', 'message' => $des]);

            // BOTH RECEIPTS AND TRANSFERS ARE IN SINGLE TABL       
            return redirect()->route('receipts.index');
        } catch (\Throwable $th) {
            // Let validation exceptions bubble so Inertia/Laravel can return proper validation responses
            if ($th instanceof ValidationException) {
                throw $th;
            }
            $des = 'اجناس از ' . $transfer->source->name . ' به ' . $transfer->destination->name . ' پیشنهاد نشد';
            $log->create('insert', $des);
            DB::rollBack();
            Inertia::flash('toast', ['type' => 'error', 'message' => $des . $th->getMessage()]);
            return redirect()->back();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Transfer $transfer)
    {
        // TransferData = {id:number,source:string,destination:string,reference_no:string,transfered_at:Date,lines:TransferLine[]}
        // TransferLine = {id:number,itemName:string,quantity:number;unit_price:number};
        $transfer->load('source:id,name', 'destination:id,name', 'transferLines:id,transfer_id,quantity,item_id', 'transferLines.item:id,name,unit,default_sale_price,code,sku');
        $transfer->load('transferLines.item.product:item_id,weight,per_pack,barcode');
        return Inertia::render('transfer/show', [
            'transfer' => [
                'id' => $transfer->id,
                'source' => $transfer->source->name,
                'destination' => $transfer->destination->name,
                'reference_no' => $transfer->reference_no,
                'transfered_at' => $transfer->transferred_at,
                'status' => $transfer->status,
                'notes' => $transfer->notes,
                'lines' => $transfer->transferLines->map(fn(TransferLine $line) => [
                    'id' => $line->id,
                    'itemName' => $line->item->name,
                    'itemUnit' => $line->item->unit,
                    'itemWeight' => $line->item?->product->weight ?? '_',
                    'itemPerPack' => $line->item?->product->per_pack ?? '_',
                    'quantity' => $line->quantity,
                    'unit_price' => $line->item->default_sale_price,

                ])->values(),
            ]
        ]);
    }


    public function getItemBalance(Location $location, Item $item)
    {
        $balance = InventoryBalance::with('item:id,name,unit')->where('location_id', $location->id)->where('item_id', $item->id)->first();
        return response()->json($balance);
    }
    public function changeStatus(Transfer $transfer, string $status)
    {
        Gate::authorize('allow-factory_clerk');

        DB::beginTransaction();
        try {

            $transfer->status = $status;
            $transfer->save();

            if ($status === 'completed') {
                //  ======== UPDATE INVENTORY ==========
                foreach ($transfer->transferLines as $line) {
                    $inventory = new InvMovement();
                    // // -------- if the quantity while being reduced not enough in location that will throw an error
                    if (!$inventory->move($transfer->source_id, $line->item_id, $line->quantity, 'transferred_out', '', '-')) {
                        throw new Error("در مرجع" . ' کافی مقدار نداریم');
                    }

                    $inventory->move($transfer->destination_id, $line->item_id, $line->quantity, 'transferred_in');
                }
                $users = User::query()->with('role')->whereHas('role', function ($q) {
                    $q->whereIn('name', ['admin', 'super_admin', 'shop_clerk']);
                })->get();

                foreach ($users as $user) {
                    $user->notify(new TransferCreated($transfer, 'انتقال جنس تکمیل شد'));
                }
                // dd($status);
                $log = new Log();
                $des = 'اجناس از ' . $transfer->source->name . ' به ' . $transfer->destination->name . ' تکمیل شد';
                $log->create('insert', $des);
                Inertia::flash('toast', ['type' => 'success', 'message' => $des]);
            }
            DB::commit();
            return redirect()->back();
        } catch (\Throwable $th) {
            DB::rollBack();
            Inertia::flash('toast', ['type' => 'success', 'message' => 'انتقال اجناس تکمل نشد ' . $th->getMessage()]);
            return redirect()->back();
        }
    }
}
