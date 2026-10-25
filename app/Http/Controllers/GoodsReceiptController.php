<?php

namespace App\Http\Controllers;

use App\Custome\InvMovement;
use App\Custome\Log;
use App\Models\Currency;
use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptLine;
use App\Models\Item;
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

    function index()
    {
        $user = Auth::user();
        if ($user instanceof User) {
            if ($user->hasRole('factory_clerk')) {
                $goodsReceipts = GoodsReceipt::with('supplier:id,name', 'receiptLines', 'location:id,name')
                    ->whereIn('destination_location_id', function ($query) {
                        $query->select('id')
                            ->from('locations')
                            ->whereIn('type', ['factory', 'warehouse']);
                    })
                    ->orderBy('id', 'desc')
                    ->paginate(10);
            }
            if ($user->hasRole('shop_clerk')) {
                  $goodsReceipts = GoodsReceipt::with('supplier:id,name', 'receiptLines', 'location:id,name')
                    ->whereIn('destination_location_id', function ($query) {
                        $query->select('id')
                            ->from('locations')
                            ->whereIn('type', ['shop']);
                    })
                    ->orderBy('id', 'desc')
                    ->paginate(10);
            } else {
                $goodsReceipts = GoodsReceipt::with('supplier:id,name', 'receiptLines', 'location:id,name')->orderBy('id', 'desc')->paginate(10);
            }
        }
        $transfers = Transfer::with('source:id,name', 'destination:id,name', 'transferLines:id,item_id,transfer_id,quantity,unit_price', 'transferLines.item:id,name,unit,item_type')
            ->select('id', 'source_id', 'destination_id', 'reference_no', 'notes', 'transferred_at')
            ->orderBy('id', 'desc')->paginate(10);
        return Inertia::render('goods-receipt/index', compact('goodsReceipts', 'transfers'));
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
        $items = Item::with('product')->select('id', 'name', 'unit')->get();

        return Inertia::render('goods-receipt/create', compact('suppliers', 'locations', 'currencies', 'items'));
    }

    public function store(Request $request)
    {
        Gate::authorize('reject-admins');

        // ========== VALIDATE DATA ===========
        $data = $request->validate([
            'supplier_id' => 'required|integer|exists:suppliers,id',
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
            'distination_id' => '',
            // each line validation
            'receiptLines.*.item_id' => 'required|integer|exists:items,id|distinct',
            'receiptLines.*.quantity' => 'required|integer|gt:0',
            'receiptLines.*.unit_cost' => 'required|numeric|gt:0',
            'receiptLines.*.currency_id' => 'required|integer|exists:currencies,id',
        ]);

        $currencyIds = collect($data['receiptLines'])->pluck('currency_id')->unique();
        if ($currencyIds->count() !== 1) {
            throw ValidationException::withMessages([
                'receiptLines' => 'تمام اقلام یک رسید باید واحد پول یکسان داشته باشند.',
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
                'notes' => $data['notes'] ?? '',
                'received_at' => $data['received_at'],
                'reference_no' => '',
                'currency_id' => $currencyIds->first(),
                'total_amount' => $totalAmount,
                'amount_paid' => 0,
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

            $log->create('insert', ' جنس نو وارد شد در ' . $receipt->location->name);
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
        $receipt->load('location:id,name', 'receiptLines:id,item_id,quantity,receipt_id,unit_cost', 'supplier:id,name');
        $receipt->load('currency:id,name', 'receiptLines.item:id,name,unit,product_id', 'receiptLines.item.product:item_id,weight');
        return Inertia::render('goods-receipt/show', compact('receipt'));
    }
}
