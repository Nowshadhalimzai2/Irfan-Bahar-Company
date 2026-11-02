<?php

namespace App\Http\Controllers;

use App\Custome\InvMovement;
use App\Custome\Log;
use App\Models\Currency;
use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptLine;
use App\Models\Item;
use App\Models\ItemUnit;
use App\Models\Location;
use App\Models\Supplier;
use App\Models\Transfer;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class GoodsReceiptController extends Controller
{

    function index(Request $request)
    {
        $filters = $request->validate([
            'received_date' => ['nullable', 'date_format:Y-m-d'],
            'transfer_date' => ['nullable', 'date_format:Y-m-d'],
        ]);
        $today = Carbon::today(config('app.timezone'))->toDateString();
        $receivedDate = $filters['received_date'] ?? $today;
        $transferDate = $filters['transfer_date'] ?? $today;
        $user = Auth::user();
        if ($user instanceof User) {
            if ($user->hasRole('factory_clerk')) {
                $goodsReceipts = GoodsReceipt::with('supplier:id,name', 'receiptLines', 'location:id,name')
                    ->whereIn('destination_location_id', function ($query) {
                        $query->select('id')
                            ->from('locations')
                            ->whereIn('type', ['factory', 'warehouse']);
                    })
                    ->when($receivedDate, fn ($query) => $query->whereDate('received_at', $receivedDate))
                    ->orderBy('id', 'desc')
                    ->paginate(10)
                    ->withQueryString();
            }
            elseif ($user->hasRole('shop_clerk')) {
                $goodsReceipts = GoodsReceipt::with('supplier:id,name', 'receiptLines', 'location:id,name', 'currency:id,name')
                    ->whereIn('destination_location_id', function ($query) {
                        $query->select('id')
                            ->from('locations')
                            ->whereIn('type', ['shop']);
                    })
                    ->when($receivedDate, fn ($query) => $query->whereDate('received_at', $receivedDate))
                    ->orderBy('id', 'desc')
                    ->paginate(10)
                    ->withQueryString();
            } else {
                $goodsReceipts = GoodsReceipt::with('supplier:id,name', 'receiptLines', 'location:id,name')
                    ->when($receivedDate, fn ($query) => $query->whereDate('received_at', $receivedDate))
                    ->orderBy('id', 'desc')
                    ->paginate(10)
                    ->withQueryString();
            }
        }
        $transfers = Transfer::with(
            'source:id,name',
            'destination:id,name',
            'transferLines:id,item_id,item_unit_id,transfer_id,quantity,base_quantity,unit_price',
            'transferLines.item:id,name,unit,item_type,default_sale_price',
            'transferLines.itemUnit:id,item_id,name,symbol,conversion_to_base,selling_price'
        )
            ->select('id', 'source_id', 'destination_id', 'reference_no', 'notes', 'transferred_at', 'status')
            ->when($transferDate, fn ($query) => $query->whereDate('transferred_at', $transferDate))
            ->orderBy('id', 'desc')
            ->paginate(10)
            ->withQueryString();
        return Inertia::render('goods-receipt/index', compact('goodsReceipts', 'transfers', 'receivedDate', 'transferDate'));
    }
    function create()
    {
        Gate::authorize('reject-admins');


        $suppliers = Supplier::select('id', 'name')->get();

        $user = Auth::user();
        if ($user instanceof User && $user->hasRole('factory_clerk')) {
            $locations = Location::select('id', 'name')
                ->whereIn('type', ['warehouse', 'factory'])
                ->get();
        } else if ($user instanceof User && $user->hasRole('shop_clerk')) {
            $locations = Location::select('id', 'name')
                ->whereIn('type', ['shop'])
                ->get();
        }

        $currencies = Currency::select('id', 'name')->get();
        $items = Item::query()
            ->with([
                'product:item_id,weight',
                'units' => fn ($query) => $query
                    ->select('id', 'item_id', 'name', 'symbol', 'conversion_to_base', 'code', 'barcode', 'selling_price', 'purchase_price', 'is_active')
                    ->where('is_active', true)
                    ->orderBy('id'),
                'baseUnit:id,item_id,name,symbol,conversion_to_base,code,barcode,selling_price,purchase_price,is_active',
            ])
            ->select('id', 'name', 'unit', 'default_sale_price', 'item_type', 'code', 'sku', 'base_unit_id')
            ->orderBy('name')
            ->get();

        return Inertia::render('goods-receipt/create', compact('suppliers', 'locations', 'currencies', 'items'));
    }

    public function store(Request $request)
    {
        Gate::authorize('reject-admins');

        // ========== VALIDATE DATA ===========
        $data = $request->validate([
            'supplier_id' => 'required|integer|exists:suppliers,id',
            'currency_id' => 'required|integer|exists:currencies,id',
            'destination_location_id' => [
                'required',
                'integer',
                Rule::exists('locations', 'id')->where(function ($query) {
                    $query->whereIn('type', ['warehouse', 'factory', 'shop']);
                }),
            ],
            'received_at' => 'required|date',
            'notes' => 'nullable|string|max:255',
            'receiptLines' => 'required|array|min:1',
            'receiptLines.*.item_id' => 'required|integer|exists:items,id',
            'receiptLines.*.item_unit_id' => 'required|integer|exists:item_units,id|distinct',
            'receiptLines.*.quantity' => 'required|numeric|gt:0',
            'receiptLines.*.unit_cost' => 'required|numeric|gt:0',
        ]);

        $units = ItemUnit::query()
            ->whereIn('id', collect($data['receiptLines'])->pluck('item_unit_id'))
            ->where('is_active', true)
            ->get(['id', 'item_id', 'conversion_to_base'])
            ->keyBy('id');

        foreach ($data['receiptLines'] as $index => $line) {
            $unit = $units->get((int) $line['item_unit_id']);

            if (! $unit || (int) $unit->item_id !== (int) $line['item_id']) {
                throw ValidationException::withMessages([
                    "receiptLines.{$index}.item_unit_id" => 'واحد انتخاب‌شده به این جنس مربوط نیست.',
                ]);
            }
        }

        if (! $data['currency_id']) {
            throw ValidationException::withMessages([
                'currency_id' => 'واحد پول رسید را انتخاب کنید.',
            ]);
        }

        $log = new Log();
        DB::beginTransaction();
        try {
            $totalAmount = collect($data['receiptLines'])->sum(
                fn (array $line) => round((float) $line['quantity'] * (float) $line['unit_cost'], 2)
            );

            // create the goods receipt 
            $receipt = GoodsReceipt::create([
                'supplier_id' => $data['supplier_id'],
                'destination_location_id' => $data['destination_location_id'],
                'currency_id' => $data['currency_id'],
                'notes' => $data['notes'] ?? '',
                'received_at' => $data['received_at'],
                'reference_no' => '',
                'total_amount' => $totalAmount,
                'amount_paid' => 0,
            ]);

            $receipt->reference_no = sprintf('GR-%s-%s', Carbon::now(config('app.timezone'))->year, $receipt->id);
            $receipt->save();

            // ===== CREATE THE GOODS RECEIPE LINES =====
            foreach ($data['receiptLines'] as $line) {
                $unit = $units->get((int) $line['item_unit_id']);
                $conversionFactor = (float) $unit->conversion_to_base;
                $baseQuantity = round((float) $line['quantity'] * $conversionFactor, 3);

                GoodsReceiptLine::create([
                    'receipt_id' => $receipt->id,
                    'item_id' => $line['item_id'],
                    'item_unit_id' => $line['item_unit_id'],
                    'quantity' => $line['quantity'],
                    'conversion_factor' => $conversionFactor,
                    'base_quantity' => $baseQuantity,
                    'unit_cost' => $line['unit_cost'],
                ]);

                //  ======== RECORD THE INVENTORY MOVEMENT ===
                $inventory = new InvMovement();
                $inventory->move($data['destination_location_id'], $line['item_id'], $baseQuantity, 'receipt', $data['notes']);
            }

            $log->create('insert', ' جنس نو وارد شد در ' . $receipt->location->name);
            DB::commit();

            Inertia::flash('toast', ['type' => 'success', 'message' => "جنس نو امد به {$receipt->location->name}"]);
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
        $receipt->load(
            'location:id,name',
            'currency:id,name',
            'receiptLines:id,item_id,item_unit_id,quantity,conversion_factor,base_quantity,receipt_id,unit_cost',
            'supplier:id,name'
        );
        $receipt->load(
            'receiptLines.item:id,name,unit,default_sale_price,code',
            'receiptLines.item.baseUnit:id,name,symbol',
            'receiptLines.itemUnit:id,item_id,name,symbol,conversion_to_base,code,barcode,selling_price',
            'receiptLines.item.product:item_id,weight'
        );
        return Inertia::render('goods-receipt/show', compact('receipt'));
    }
}
