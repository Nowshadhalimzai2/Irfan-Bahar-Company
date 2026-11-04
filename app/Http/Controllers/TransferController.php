<?php

namespace App\Http\Controllers;

use App\Custome\InvMovement;
use App\Custome\Log;
use App\Models\Item;
use App\Models\ItemUnit;
use App\Models\Location;
use App\Models\Transfer;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log as ApplicationLog;
use Illuminate\Validation\ValidationException;
use App\Models\InventoryBalance;
use App\Models\TransferLine;
use App\Models\User;
use App\Notifications\TransferCreated;
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
                $items = Item::with([
                    'units' => fn ($query) => $query
                        ->select('id', 'item_id', 'name', 'symbol', 'conversion_to_base', 'code', 'selling_price', 'is_active')
                        ->where('is_active', true)
                        ->orderBy('id'),
                    'baseUnit:id,item_id,name,symbol,conversion_to_base,code,selling_price,is_active',
                    'inventoryBalances:id,location_id,item_id,quantity_on_hand,reserved',
                ])
                    ->whereHas(
                        'inventoryBalances',
                        fn($query) =>
                        $query->where('location_id', $location->id)
                    )->get();
                return response()->json($items);
            }
        }

        $items = Item::query()
            ->with([
                'units' => fn ($query) => $query
                    ->select('id', 'item_id', 'name', 'symbol', 'conversion_to_base', 'code', 'selling_price', 'is_active')
                    ->where('is_active', true)
                    ->orderBy('id'),
                'baseUnit:id,item_id,name,symbol,conversion_to_base,code,selling_price,is_active',
                'inventoryBalances:id,item_id,location_id,quantity_on_hand,reserved',
            ])
            ->whereHas('inventoryBalances', fn ($query) => $query->where('quantity_on_hand', '>', 0))
            ->select('id', 'name', 'unit', 'default_sale_price', 'item_type', 'code', 'sku', 'base_unit_id')
            ->orderBy('name')
            ->get();

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
            'transferLines.*.item_id' => 'required|integer|exists:items,id',
            'transferLines.*.item_unit_id' => 'required|integer|exists:item_units,id|distinct',
            'transferLines.*.quantity' => 'required|numeric|gt:0',
        ]);

        $log = new Log();

        if ((int) $data['source_id'] === (int) $data['destination_id']) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'موقیعت ها ممکن نیست که بک جای باشد.']);
            return redirect()->back()->withInput();
        }

        $units = ItemUnit::query()
            ->whereIn('id', collect($data['transferLines'])->pluck('item_unit_id'))
            ->where('is_active', true)
            ->get(['id', 'item_id', 'conversion_to_base', 'selling_price'])
            ->keyBy('id');

        foreach ($data['transferLines'] as $index => $line) {
            $unit = $units->get((int) $line['item_unit_id']);

            if (! $unit || (int) $unit->item_id !== (int) $line['item_id']) {
                throw ValidationException::withMessages([
                    "transferLines.{$index}.item_unit_id" => 'واحد انتخاب‌شده به این جنس مربوط نیست.',
                ]);
            }
        }

        $transfer = null;
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

            $transfer->reference_no = sprintf('TR-%s-%s', Carbon::now(config('app.timezone'))->year, str_pad($transfer->id, 4, '0', STR_PAD_LEFT));
            $transfer->save();

            $requiredBaseQuantities = collect($data['transferLines'])
                ->groupBy('item_id')
                ->map(function ($lines) use ($units): float {
                    return round($lines->sum(function (array $line) use ($units): float {
                        $unit = $units->get((int) $line['item_unit_id']);

                        return (float) $line['quantity'] * (float) $unit->conversion_to_base;
                    }), 3);
                });

            foreach ($requiredBaseQuantities as $itemId => $requiredBaseQuantity) {
                $balance = InventoryBalance::where('location_id', $data['source_id'])
                    ->where('item_id', $itemId)
                    ->lockForUpdate()
                    ->first();
                $available = ($balance?->quantity_on_hand ?? 0) - ($balance?->reserved ?? 0);

                if ($available < $requiredBaseQuantity) {
                    throw new \RuntimeException('مقدار قابل انتقال برای این جنس کافی نیست.');
                }
            }

            // ===== CREATE THE TRANSFER LINES =====
            foreach ($data['transferLines'] as $line) {

                $unit = $units->get((int) $line['item_unit_id']);
                $conversionFactor = (float) $unit->conversion_to_base;
                $baseQuantity = round((float) $line['quantity'] * $conversionFactor, 3);

                $transfer->transferLines()->create([
                    'item_id' => $line['item_id'],
                    'item_unit_id' => $line['item_unit_id'],
                    'quantity' => $line['quantity'],
                    'conversion_factor' => $conversionFactor,
                    'base_quantity' => $baseQuantity,
                    'unit_price' => $unit->selling_price,
                ]);
            }
            $des = 'اجناس از ' . $transfer->source->name . ' به ' . $transfer->destination->name . ' پیشنهاد شد';
            $log->create('insert', $des);
            DB::commit();
            ApplicationLog::info('Inventory transfer requested.', [
                'user_id' => auth()->id(),
                'transfer_id' => $transfer->id,
                'reference_no' => $transfer->reference_no,
                'source_location_id' => $transfer->source_id,
                'destination_location_id' => $transfer->destination_id,
                'line_count' => count($data['transferLines']),
                'status' => $transfer->status,
            ]);
        } catch (\Throwable $th) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
            if ($th instanceof ValidationException) {
                throw $th;
            }
            ApplicationLog::error('Inventory transfer request failed.', [
                'user_id' => auth()->id(),
                'transfer_id' => $transfer->id ?? null,
                'reference_no' => $transfer->reference_no ?? null,
                'source_location_id' => $data['source_id'],
                'destination_location_id' => $data['destination_id'],
                'status' => 'failed',
                'exception' => $th,
            ]);
            Inertia::flash('toast', ['type' => 'error', 'message' => 'ثبت انتقال اجناس ناموفق بود. لطفاً دوباره تلاش کنید.']);
            return redirect()->back()->withInput();
        }

        $transfer->load('source:id,name', 'destination:id,name');
        $shopUsers = User::query()->with('role:id,name')->whereHas('role', fn($q) => $q->where('name', 'shop_clerk'))->get();
        foreach ($shopUsers as $user) {
            $user->notify(new TransferCreated($transfer, 'اجناس نو یشنهاد شد'));
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $des]);

        // BOTH RECEIPTS AND TRANSFERS ARE IN SINGLE TABL
        return redirect()->route('receipts.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Transfer $transfer)
    {
        if ($request->user() instanceof User && $request->user()->hasRole('factory_clerk')) {
            $hasAuthorizedLocation = Location::query()
                ->whereIn('type', ['factory', 'warehouse'])
                ->whereIn('id', [$transfer->source_id, $transfer->destination_id])
                ->exists();
            abort_unless($hasAuthorizedLocation, 403);
        }

        $transfer->load(
            'source:id,name',
            'destination:id,name',
            'transferLines:id,transfer_id,item_id,item_unit_id,quantity,conversion_factor,base_quantity,unit_price',
            'transferLines.item:id,name,unit,default_sale_price,code,sku',
            'transferLines.item.baseUnit:id,name,symbol',
            'transferLines.itemUnit:id,item_id,name,symbol,conversion_to_base,code,selling_price',
        );
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
                    'itemCode' => $line->item->code,
                    'itemUnit' => $line->itemUnit?->name ?? $line->item->baseUnit?->name ?? $line->item->unit,
                    'quantity' => $line->quantity,
                    'baseQuantity' => $line->base_quantity ?? $line->quantity,
                    'unitPrice' => $line->unit_price,

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

        if (! in_array($status, ['completed', 'cancelled'], true)) {
            throw ValidationException::withMessages(['status' => 'وضعیت انتقال معتبر نیست.']);
        }

        DB::beginTransaction();
        try {

            $transfer = Transfer::query()->lockForUpdate()->findOrFail($transfer->id);

            if ($transfer->status !== 'suggested') {
                throw new \RuntimeException('این انتقال قبلاً نهایی یا لغو شده است.');
            }

            $transfer->status = $status;
            $transfer->save();

            if ($status === 'completed') {
                //  ======== UPDATE INVENTORY ==========
                foreach ($transfer->transferLines as $line) {
                    $inventory = new InvMovement();
                    $baseQuantity = (float) ($line->base_quantity ?? $line->quantity);
                    // // -------- if the quantity while being reduced not enough in location that will throw an error
                    if (! $inventory->move($transfer->source_id, $line->item_id, $baseQuantity, 'transferred_out', '', '-')) {
                        throw new \RuntimeException('در مرجع مقدار کافی نداریم.');
                    }

                    if (! $inventory->move($transfer->destination_id, $line->item_id, $baseQuantity, 'transferred_in')) {
                        throw new \RuntimeException('ثبت موجودی مقصد ناموفق بود.');
                    }
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
            ApplicationLog::info('Inventory transfer status updated.', [
                'user_id' => auth()->id(),
                'transfer_id' => $transfer->id,
                'reference_no' => $transfer->reference_no,
                'source_location_id' => $transfer->source_id,
                'destination_location_id' => $transfer->destination_id,
                'status' => $status,
            ]);
            return redirect()->back();
        } catch (\Throwable $th) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
            ApplicationLog::error('Inventory transfer status update failed.', [
                'user_id' => auth()->id(),
                'transfer_id' => $transfer->id,
                'reference_no' => $transfer->reference_no,
                'status' => $status,
                'exception' => $th,
            ]);
            Inertia::flash('toast', ['type' => 'error', 'message' => 'تغییر وضعیت انتقال ناموفق بود. لطفاً دوباره تلاش کنید.']);
            return redirect()->back();
        }
    }
}
