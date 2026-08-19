<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Models\BOM;
use App\Models\Product;
use App\Models\ProductionOrder;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ProductionOrderController extends Controller
{

    public function index(): Response
    {
        $production_orders = ProductionOrder::with([
            'bom:id,category_id',
            'bom.category:id,name',
            'productionOutputs:id,production_order_id,product_id,quantity_produced',
            'productionOutputs.product:item_id,weight,per_pack',
        ])
            ->select(['id', 'ordered_by', 'status', 'order_date', 'notes', 'bom_id'])
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('factory/order/index', compact('production_orders'));
    }
    public function create()
    {

        $boms = BOM::select('id', 'formula_name')->get();
        if ($boms->count() == 0) {
            $des = 'هیج فورمول وجود ندارد . لطفا اول فورمول را اضافه و بعدا سفارش بدهید.';
            Inertia::flash('toast', ['type' => 'error', 'message' => $des]);
            return redirect()->to(route('boms.create'));
        }
        $products = Product::with('item:id,name,unit')->get();
        return Inertia::render('factory/order/create', compact('boms', 'products'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'ordered_by' => 'required|string|max:55',
            'bom_id' => 'required|integer|exists:boms,id',
            'notes' => 'nullable|string|max:255',
            'productionOutputs' => 'required|array|min:1',

            // each line validation
            'productionOutputs.*.product_id' => 'required|integer|exists:items,id|distinct',
            'productionOutputs.*.quantity_produced' => 'required|numeric|gt:0',
        ]);
        $log = new Log();
        DB::beginTransaction();

        try {
            // create the goods receipt 
            $order = ProductionOrder::create([
                'ordered_by' => $data['ordered_by'],
                'bom_id' => $data['bom_id'],
                'notes' => $data['notes'],
                'order_date' => Carbon::now(config('app.timezone')),
                'status' => 'pending',
                'reference_no' => '',
            ]);
            $order->reference_no = sprintf('ORD-%s-%s', Carbon::now(config('app.timezone'))->year, str_pad($order->id, 5, '0', STR_PAD_LEFT));
            $order->save();
            // dd($data['productionOutputs']);
            // ===== CREATE THE BOM LINES =====
            foreach ($data['productionOutputs'] as $output) {
                $order->productionOutputs()->create($output);
            }
            $des = 'سفارش ' . $data['ordered_by'] . ' در ثبت سیستم ثبت شد ';
            $log->create('insert', $des, null, '/factory/production-orders/' . $order->id);
            DB::commit();

            Inertia::flash('toast', ['type' => 'success', 'message' => $des]);

            return redirect()->to(route('orders.index'));
        } catch (\Throwable $th) {
            // Let validation exceptions bubble so Inertia/Laravel can return proper validation responses
            if ($th instanceof ValidationException) {
                throw $th;
            }
            $des = ' متاسفانه سفارش' . ($data['ordered_by'] ?? '') . 'در ثبت سیستم ثبت نشد ';
            $log->create('insert', $des);
            DB::rollBack();

            Inertia::flash('toast', ['type' => 'error', 'message' => $des . $th->getMessage()]);
            return redirect()->back();
        }
    }

    public function show(ProductionOrder $productionOrder): Response
    {
        $logo = Storage::url('public/logo/nobg.png');
        $productionOrder->load('bom:id,category_id', 'bom.category:id,name');
        $productionOrder->load('productionOutputs:id,product_id,quantity_produced,production_order_id', 'productionOutputs.product:item_id,per_pack,weight', 'productionOutputs.product.item:id,name,unit');

        return Inertia::render('factory/order/show', compact('productionOrder', 'logo'));
    }
}
