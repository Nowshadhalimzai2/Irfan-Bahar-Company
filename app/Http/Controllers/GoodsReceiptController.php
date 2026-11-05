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
use Illuminate\Support\Facades\Log as ApplicationLog;
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
                $goodsReceipts = GoodsReceipt::with('supplier:id,name', 'receiptLines', 'location:id,name,type')
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
                $goodsReceipts = GoodsReceipt::with('supplier:id,name', 'receiptLines', 'location:id,name,type', 'currency:id,name')
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
                $goodsReceipts = GoodsReceipt::with('supplier:id,name', 'receiptLines', 'location:id,name,type')
                    ->when($receivedDate, fn ($query) => $query->whereDate('received_at', $receivedDate))
                    ->orderBy('id', 'desc')
                    ->paginate(10)
                    ->withQueryString();
            }
        }
        $transferQuery = Transfer::with(
            'source:id,name',
            'destination:id,name',
            'transferLines:id,item_id,item_unit_id,transfer_id,quantity,base_quantity,unit_price',
            'transferLines.item:id,name,unit,item_type,default_sale_price',
            'transferLines.itemUnit:id,item_id,name,symbol,conversion_to_base,selling_price'
        );
        if ($user instanceof User && $user->hasRole('factory_clerk')) {
            $transferQuery->where(function ($query) {
                $query->whereHas('source', fn ($locationQuery) => $locationQuery->whereIn('type', ['factory', 'warehouse']))
                    ->orWhereHas('destination', fn ($locationQuery) => $locationQuery->whereIn('type', ['factory', 'warehouse']));
            });
        }

        $transfers = $transferQuery
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


        $suppliers = Supplier::query()
            ->where('status', true)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

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

    public function edit(Request $request, GoodsReceipt $receipt)
    {
        $this->authorizeReceiptEdit($request, $receipt);

        $receipt->load([
            'supplier:id,name',
            'location:id,name,type',
            'currency:id,name',
            'receiptLines:id,receipt_id,item_id,item_unit_id,quantity,conversion_factor,base_quantity,unit_cost',
        ]);

        $suppliers = Supplier::query()
            ->where(fn ($query) => $query
                ->where('status', true)
                ->orWhere('id', $receipt->supplier_id))
            ->select('id', 'name')
            ->orderBy('name')
            ->get();
        $locations = $this->receiptLocations($request);
        $currencies = Currency::query()->select('id', 'name')->get();
        $items = Item::query()
            ->with([
                'product:item_id,weight',
                'units' => fn ($query) => $query
                    ->select('id', 'item_id', 'name', 'symbol', 'conversion_to_base', 'code', 'barcode', 'selling_price', 'purchase_price', 'is_active')
                    ->orderBy('id'),
                'baseUnit:id,item_id,name,symbol,conversion_to_base,code,barcode,selling_price,purchase_price,is_active',
            ])
            ->select('id', 'name', 'unit', 'default_sale_price', 'item_type', 'code', 'sku', 'base_unit_id')
            ->orderBy('name')
            ->get();
        $canChangeSupplierCurrency = (float) $receipt->amount_paid <= 0
            && ! $receipt->payments()->exists()
            && ! $receipt->paymentAllocations()->exists();

        return Inertia::render('goods-receipt/create', compact(
            'suppliers',
            'locations',
            'currencies',
            'items',
            'receipt',
            'canChangeSupplierCurrency',
        ));
    }

    public function store(Request $request)
    {
        Gate::authorize('reject-admins');

        // ========== VALIDATE DATA ===========
        $data = $request->validate([
            'supplier_id' => [
                'required',
                'integer',
                Rule::exists('suppliers', 'id')->where(fn ($query) => $query->where('status', true)),
            ],
            'currency_id' => 'required|integer|exists:currencies,id',
            'destination_location_id' => [
                'required',
                'integer',
                Rule::exists('locations', 'id')->where(fn ($query) => $query->whereIn('type', $this->allowedLocationTypes($request))),
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
        $receipt = null;
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
            ApplicationLog::info('Goods receipt recorded.', [
                'user_id' => Auth::id(),
                'receipt_id' => $receipt->id,
                'reference_no' => $receipt->reference_no,
                'destination_location_id' => $receipt->destination_location_id,
                'line_count' => count($data['receiptLines']),
                'status' => 'received',
            ]);

            Inertia::flash('toast', ['type' => 'success', 'message' => "جنس نو امد به {$receipt->location->name}"]);
            return redirect()->route('receipts.index');
        } catch (\Throwable $th) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
            ApplicationLog::error('Goods receipt transaction failed.', [
                'user_id' => Auth::id(),
                'receipt_id' => $receipt->id ?? null,
                'reference_no' => $receipt->reference_no ?? null,
                'destination_location_id' => $data['destination_location_id'],
                'status' => 'failed',
                'exception' => $th,
            ]);
            Inertia::flash('toast', ['type' => 'error', 'message' => 'ثبت رسید اجناس ناموفق بود. لطفاً دوباره تلاش کنید.']);
            return redirect()->back();
        }
    }

    public function update(Request $request, GoodsReceipt $receipt)
    {
        $this->authorizeReceiptEdit($request, $receipt);

        $data = $request->validate([
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'currency_id' => ['required', 'integer', 'exists:currencies,id'],
            'destination_location_id' => [
                'required',
                'integer',
                Rule::exists('locations', 'id')->where(
                    fn ($query) => $query->whereIn('type', $this->allowedLocationTypes($request))
                ),
            ],
            'received_at' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:255'],
            'receiptLines' => ['required', 'array', 'min:1'],
            'receiptLines.*.item_id' => ['required', 'integer', 'exists:items,id'],
            'receiptLines.*.item_unit_id' => ['required', 'integer', 'exists:item_units,id', 'distinct'],
            'receiptLines.*.quantity' => ['required', 'numeric', 'gt:0', 'max:99999999.999'],
            'receiptLines.*.unit_cost' => ['required', 'numeric', 'gt:0', 'max:999999.99'],
        ]);

        $totalAmount = collect($data['receiptLines'])->sum(
            fn (array $line) => round(
                (float) $line['quantity'] * (float) $line['unit_cost'],
                2,
            )
        );

        try {
            DB::transaction(function () use ($data, $receipt, $totalAmount): void {
                $lockedReceipt = GoodsReceipt::query()
                    ->lockForUpdate()
                    ->findOrFail($receipt->id);
                $supplier = Supplier::query()
                    ->lockForUpdate()
                    ->findOrFail($data['supplier_id']);

                if (! $supplier->status && (int) $supplier->id !== (int) $lockedReceipt->supplier_id) {
                    throw ValidationException::withMessages([
                        'supplier_id' => 'تأمین‌کننده جدید باید فعال باشد.',
                    ]);
                }

                $allocatedAmount = (float) $lockedReceipt->paymentAllocations()->sum('amount');
                $amountPaid = (float) $lockedReceipt->amount_paid;
                $hasPaymentAllocations = $lockedReceipt->paymentAllocations()->exists();
                if ($totalAmount + 0.00001 < max($allocatedAmount, $amountPaid)) {
                    throw ValidationException::withMessages([
                        'receiptLines' => 'مجموع رسید نمی‌تواند کمتر از مبلغ پرداخت‌شده یا تخصیص‌یافته باشد.',
                    ]);
                }

                if (
                    (int) $data['supplier_id'] !== (int) $lockedReceipt->supplier_id
                    || (int) $data['currency_id'] !== (int) $lockedReceipt->currency_id
                ) {
                    if ($amountPaid > 0 || $hasPaymentAllocations || $lockedReceipt->payments()->exists()) {
                        throw ValidationException::withMessages([
                            'supplier_id' => 'تأمین‌کننده یا واحد پول رسیدی که پرداخت دارد قابل تغییر نیست.',
                        ]);
                    }
                }

                $units = ItemUnit::query()
                    ->whereIn('id', collect($data['receiptLines'])->pluck('item_unit_id'))
                    ->lockForUpdate()
                    ->get(['id', 'item_id', 'conversion_to_base', 'is_active'])
                    ->keyBy('id');

                foreach ($data['receiptLines'] as $index => $line) {
                    $unit = $units->get((int) $line['item_unit_id']);
                    $isExistingLine = $lockedReceipt->receiptLines()
                        ->where('item_id', $line['item_id'])
                        ->where('item_unit_id', $line['item_unit_id'])
                        ->exists();

                    if (
                        ! $unit
                        || (int) $unit->item_id !== (int) $line['item_id']
                        || (! $unit->is_active && ! $isExistingLine)
                    ) {
                        throw ValidationException::withMessages([
                            "receiptLines.{$index}.item_unit_id" => 'واحد انتخاب‌شده برای این جنس قابل استفاده نیست.',
                        ]);
                    }
                }

                $oldLocationId = (int) $lockedReceipt->destination_location_id;
                $newLocationId = (int) $data['destination_location_id'];
                $oldQuantities = $lockedReceipt->receiptLines()
                    ->selectRaw('item_id, SUM(COALESCE(base_quantity, quantity * COALESCE(conversion_factor, 1))) as quantity')
                    ->groupBy('item_id')
                    ->get()
                    ->mapWithKeys(fn ($line) => [
                        "{$oldLocationId}:{$line->item_id}" => (float) $line->quantity,
                    ]);
                $newQuantities = collect($data['receiptLines'])
                    ->groupBy(fn (array $line) => "{$newLocationId}:{$line['item_id']}")
                    ->map(fn ($lines) => $lines->sum(function (array $line) use ($units): float {
                        $unit = $units->get((int) $line['item_unit_id']);

                        return round(
                            (float) $line['quantity'] * (float) $unit->conversion_to_base,
                            3,
                        );
                    }));

                foreach ($oldQuantities->keys()->merge($newQuantities->keys())->unique() as $key) {
                    $delta = round((float) $newQuantities->get($key, 0) - (float) $oldQuantities->get($key, 0), 3);
                    if (abs($delta) < 0.0005) {
                        continue;
                    }

                    [$locationId, $itemId] = array_map('intval', explode(':', $key));
                    $movement = new InvMovement();
                    try {
                        $movement->move(
                            $locationId,
                            $itemId,
                            abs($delta),
                            'receipt',
                            $data['notes'] ?? '',
                            $delta < 0 ? '-' : '+',
                        );
                    } catch (\RuntimeException) {
                        throw ValidationException::withMessages([
                            'receiptLines' => 'موجودی قابل برداشت نیست؛ بخشی از این رسید مصرف، انتقال یا رزرو شده است.',
                        ]);
                    }
                }

                $lockedReceipt->update([
                    'supplier_id' => $data['supplier_id'],
                    'currency_id' => $data['currency_id'],
                    'destination_location_id' => $newLocationId,
                    'received_at' => $data['received_at'],
                    'notes' => $data['notes'] ?? '',
                    'total_amount' => $totalAmount,
                ]);

                $retainedLineIds = [];
                foreach ($data['receiptLines'] as $line) {
                    $unit = $units->get((int) $line['item_unit_id']);
                    $conversionFactor = (float) $unit->conversion_to_base;
                    $quantity = (float) $line['quantity'];
                    $receiptLine = $lockedReceipt->receiptLines()
                        ->where('item_id', $line['item_id'])
                        ->where('item_unit_id', $line['item_unit_id'])
                        ->first();

                    $attributes = [
                        'item_id' => $line['item_id'],
                        'item_unit_id' => $line['item_unit_id'],
                        'quantity' => $quantity,
                        'conversion_factor' => $conversionFactor,
                        'base_quantity' => round($quantity * $conversionFactor, 3),
                        'unit_cost' => $line['unit_cost'],
                    ];

                    if ($receiptLine) {
                        $receiptLine->update($attributes);
                        $retainedLineIds[] = $receiptLine->id;
                    } else {
                        $retainedLineIds[] = $lockedReceipt->receiptLines()
                            ->create($attributes)
                            ->id;
                    }
                }
                $lockedReceipt->receiptLines()
                    ->whereNotIn('id', $retainedLineIds)
                    ->delete();

                (new Log())->create(
                    'update',
                    "رسید اجناس {$lockedReceipt->reference_no} ویرایش شد",
                    null,
                    route('receipts.show', $lockedReceipt),
                );
            }, 3);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            ApplicationLog::error('Goods receipt update failed.', [
                'user_id' => Auth::id(),
                'receipt_id' => $receipt->id,
                'exception' => $exception,
            ]);

            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'ویرایش رسید اجناس ناموفق بود. لطفاً دوباره تلاش کنید.',
            ]);

            return redirect()->back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'رسید اجناس با موفقیت ویرایش شد.']);

        return redirect()->route('receipts.show', $receipt);
    }

    public function show(Request $request, GoodsReceipt $receipt)
    {
        if ($request->user() instanceof User && $request->user()->hasRole('factory_clerk')) {
            abort_unless(
                $receipt->location()->whereIn('type', ['factory', 'warehouse'])->exists(),
                403,
            );
        }

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

    /**
     * @return array<int, string>
     */
    private function allowedLocationTypes(Request $request): array
    {
        return $this->canManageAllReceipts($request)
            ? ['warehouse', 'shop', 'office', 'factory', 'other']
            : (
                $request->user()?->hasRole('factory_clerk')
                    ? ['factory', 'warehouse']
                    : ($request->user()?->hasRole('shop_clerk') ? ['shop'] : [])
            );
    }

    private function canManageAllReceipts(Request $request): bool
    {
        return $request->user()?->hasAnyRole(['admin', 'super_admin']) ?? false;
    }

    private function authorizeReceiptEdit(Request $request, GoodsReceipt $receipt): void
    {
        if ($this->canManageAllReceipts($request)) {
            return;
        }

        Gate::authorize('reject-admins');
        $allowedTypes = $this->allowedLocationTypes($request);
        abort_unless(
            $allowedTypes !== [] && $receipt->location()->whereIn('type', $allowedTypes)->exists(),
            403,
        );
    }

    private function receiptLocations(Request $request)
    {
        return Location::query()
            ->select('id', 'name')
            ->whereIn('type', $this->allowedLocationTypes($request))
            ->orderBy('name')
            ->get();
    }
}
