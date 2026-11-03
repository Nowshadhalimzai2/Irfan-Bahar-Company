<?php

namespace App\Http\Controllers;

use App\Custome\InvMovement;
use App\Custome\Log;
use App\Models\InventoryBalance;
use App\Models\Item;
use App\Models\ItemUnit;
use App\Models\Location;
use App\Models\ProductionOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class WasteController extends Controller
{
    public function create(ProductionOrder $production_order)
    {
        abort_unless($production_order->status === 'completed', 422, 'ضایعات فقط پس از تکمیل سفارش ثبت می‌شود.');

        $itemIds = $production_order->productionInputs()->pluck('item_id');
        $items = Item::query()
            ->whereIn('id', $itemIds)
            ->with([
                'units' => fn ($query) => $query
                    ->select('id', 'item_id', 'name', 'symbol', 'conversion_to_base', 'is_active')
                    ->where('is_active', true)
                    ->orderBy('id'),
                'baseUnit:id,item_id,name,symbol,conversion_to_base,is_active',
            ])
            ->select(['id', 'name', 'code', 'unit', 'base_unit_id'])
            ->orderBy('name')
            ->get();

        return Inertia::render('factory/waste/create', compact('items', 'production_order'));
    }

    public function store(Request $request, ProductionOrder $production_order)
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'min:10', 'max:300'],
            'wastes' => ['required', 'array', 'min:1'],
            'wastes.*.production_order_id' => ['required', 'integer', Rule::in([$production_order->id])],
            'wastes.*.item_id' => ['required', 'integer', 'distinct', 'exists:items,id'],
            'wastes.*.item_unit_id' => ['required', 'integer', 'exists:item_units,id'],
            'wastes.*.wasted_quantity' => ['required', 'numeric', 'gt:0', 'decimal:0,3'],
        ]);

        abort_unless($production_order->status === 'completed', 422, 'ضایعات فقط پس از تکمیل سفارش ثبت می‌شود.');

        $itemIds = collect($data['wastes'])->pluck('item_id')->map(fn ($id) => (int) $id);
        $allowedItemIds = $production_order->productionInputs()->pluck('item_id')->map(fn ($id) => (int) $id);
        if ($itemIds->diff($allowedItemIds)->isNotEmpty()) {
            throw ValidationException::withMessages([
                'wastes' => 'مواد ضایع‌شده باید از مواد مصرفی همین سفارش باشند.',
            ]);
        }

        $units = ItemUnit::query()
            ->whereIn('id', collect($data['wastes'])->pluck('item_unit_id'))
            ->where('is_active', true)
            ->get(['id', 'item_id', 'conversion_to_base'])
            ->keyBy('id');

        foreach ($data['wastes'] as $index => $waste) {
            $unit = $units->get((int) $waste['item_unit_id']);
            if (! $unit || (int) $unit->item_id !== (int) $waste['item_id']) {
                throw ValidationException::withMessages([
                    "wastes.{$index}.item_unit_id" => 'واحد انتخاب‌شده به این جنس مربوط نیست یا غیرفعال است.',
                ]);
            }
        }

        $des = ' ضایعات در تولید سفارش به نمبر '.$production_order->reference_no.' ثبت شد';
        DB::transaction(function () use ($data, $production_order, $units, $des): void {
            $location = Location::firstWhere('name', 'factory')
                ?? throw new \RuntimeException('Factory location was not found.');
            $movement = new InvMovement;

            foreach ($data['wastes'] as $index => $waste) {
                $baseQuantity = round(
                    (float) $waste['wasted_quantity']
                        * (float) $units->get((int) $waste['item_unit_id'])->conversion_to_base,
                    3,
                );

                if ($baseQuantity <= 0) {
                    throw ValidationException::withMessages([
                        "wastes.{$index}.wasted_quantity" => 'مقدار ضایعات پس از تبدیل به واحد پایه باید بیشتر از صفر باشد.',
                    ]);
                }

                $balance = InventoryBalance::query()
                    ->where('location_id', $location->id)
                    ->where('item_id', $waste['item_id'])
                    ->lockForUpdate()
                    ->first();
                $availableQuantity = (float) ($balance?->quantity_on_hand ?? 0)
                    - (float) ($balance?->reserved ?? 0);

                if ($baseQuantity > $availableQuantity) {
                    throw ValidationException::withMessages([
                        "wastes.{$index}.wasted_quantity" => 'موجودی کافی برای ثبت این مقدار ضایعات وجود ندارد.',
                    ]);
                }

                $movement->move(
                    $location->id,
                    (int) $waste['item_id'],
                    $baseQuantity,
                    'production_consumption',
                    'Production waste '.$production_order->reference_no,
                    '-',
                );

                $production_order->wastes()->create([
                    'item_id' => $waste['item_id'],
                    'wasted_quantity' => $baseQuantity,
                    'reason' => $data['reason'],
                ]);
            }

            (new Log)->create('insert', $des, '', route('wastes.index', $production_order->id));
        }, 3);

        Inertia::flash('toast', ['type' => 'success', 'message' => $des]);

        return redirect()->route('orders.show', $production_order->id);
    }

    public function show(ProductionOrder $production_order)
    {
        if ($production_order->wastes()->doesntExist()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'این سفارش ضایعات ندارد یا هنگام پروسس ثبت نشده!']);

            return redirect()->route('orders.show', $production_order->id);
        }

        $production_order->load('wastes:id,item_id,wasted_quantity,production_order_id,reason', 'wastes.item:id,name,unit,code,base_unit_id', 'wastes.item.baseUnit:id,item_id,name,symbol');

        return Inertia::render('factory/waste/show', compact('production_order'));
    }
}
