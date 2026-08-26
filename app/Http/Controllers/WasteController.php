<?php

namespace App\Http\Controllers;

use App\Custome\InvMovement;
use App\Custome\Log;
use App\Models\Category;
use App\Models\Item;
use App\Models\Location;
use App\Models\ProductionOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class WasteController extends Controller
{
    public function create(ProductionOrder $production_order)
    {

        $categories = Category::select('id', 'name')->get();
        $items = Item::whereNot('item_type', 'product')->get();
        return Inertia::render('factory/waste/create', compact('categories', 'items', 'production_order'));
    }
    public function store(Request $request, ProductionOrder $production_order)
    {
        // dd($request->all());
        $data = $request->validate([
            'reason' => 'required|string|min:10|max:300',

            'wastes' => 'required|array|min:1',

            // each line validation
            'wastes.*.production_order_id' => 'required|integer|exists:production_orders,id',
            'wastes.*.item_id' => 'required|integer|exists:items,id|distinct',
            'wastes.*.wasted_quantity' => 'required|numeric|gt:0',
        ]);
        if ($production_order->id !== $data['wastes'][0]['production_order_id']) {
            Inertia::flash('toast', ['type' => 'success', 'message' => 'محصول مشابهت نمی کند']);
            return redirect()->back();
        }
        DB::beginTransaction();
        $log = new Log();
        try {
            if (!$this->StoreWastes($data, $production_order)) {
                throw new \RuntimeException(
                    'موجودی محصول تولیدشده به‌روزرسانی نشد.'
                );
            }
            $des = ' ضایعات در تولید سفارش به نمبر ' . $production_order->reference_no . ' ثبت شد';
            $log->create('insert', $des, '', route('wastes.index', $production_order->id));
            
            Inertia::flash('toast', ['type' => 'success', 'message' => $des]);
            // dd('done!');
            DB::commit();
            return redirect()->to(route('orders.show', $production_order->id));
        } catch (\Throwable $th) {

            $des = ' ضایعات در تولید سفارش به نمبر ' . $production_order->reference_no . ' ثبت نشد ' . $th->getMessage();
            Inertia::flash('toast', ['type' => 'error', 'message' => $des]);
            DB::rollBack();
            return redirect()->back();
        }
    }

    public function show(ProductionOrder $production_order)
    {
        $production_order->load('wastes:id,item_id,wasted_quantity,production_order_id', 'wastes.item:id,name,unit');
            // dd($production_order);
        Inertia::render('factory/waste/show', compact('production_order'));
    }

    private function StoreWastes(array $data, ProductionOrder $production_order)
    {
        // find location to calculate inventory balacne

        $location = Location::firstWhere('name', 'factory');
        if (!$location) {
            throw new \RuntimeException('Factory location was not found.');
        }

        foreach ($data['wastes'] as $waste) {
            $production_order->wastes()->create(array_merge($waste, ['reason' => $data['reason']]));

            $movement = new InvMovement();

            if (!$movement->move(
                $location->id,
                $waste['item_id'],
                $waste['wasted_quantity'],
                'production_consumption',
                '',
                '-'
            )) {
                return false;
            }
        }

        return true;
    }
}
