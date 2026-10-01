<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Models\BOM;
use App\Models\Category;
use App\Models\InventoryBalance;
use App\Models\Item;
use App\Models\Location;
use App\Models\Product;
use App\Models\ProductionInput;
use App\Models\ProductionOrder;
use App\Models\User;
use App\Notifications\NewOrderCreated;
use App\Notifications\OrderProcessed;
use Carbon\Carbon;
use Error;
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
            ->select(['id', 'ordered_by', 'status', 'order_date', 'notes', 'bom_id', 'reference_no'])
            ->whereNotIn('status', ['drafted', 'cancelled'])
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('factory/order/index', compact('production_orders'));
    }
    public function junks(): Response
    {
        $junkOrders = ProductionOrder::with([
            'bom:id,category_id',
            'bom.category:id,name',
            'productionOutputs:id,production_order_id,product_id,quantity_produced',
            'productionOutputs.product:item_id,weight,per_pack',
        ])
            ->select(['id', 'ordered_by', 'status', 'order_date', 'notes', 'bom_id'])
            ->whereIn('status', ['drafted', 'cancelled'])
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('factory/order/junks', compact('junkOrders'));
    }
    public function create()
    {

        $boms = BOM::with('category:id,name')->select('id', 'formula_name', 'category_id', 'min_exp_qty', 'max_exp_qty')->get();
        if ($boms->count() == 0) {
            $des = 'هیج فورمول وجود ندارد . لطفا اول فورمول را اضافه و بعدا سفارش بدهید.';
            Inertia::flash('toast', ['type' => 'error', 'message' => $des]);
            return redirect()->to(route('boms.create'));
        }

        // $products = Product::with(['item:id,name,unit,category_id','item.category:id,name'])
        // ->whereHas('item.category', function ($query) use ($bomCategory) {
        //     $query->where('name', $bomCategory);
        // })
        // ->get();
        return Inertia::render('factory/order/create', compact('boms'));
    }

    public function store(Request $request)
    {
        $data = $this->validateOrder($request);
        $log = new Log();
        DB::beginTransaction();

        try {
            // create the Production Order 
            $order = $this->createProductionOrder($data);

            $order->reference_no = sprintf('ORD-%s-%s', Carbon::now(config('app.timezone'))->year, str_pad($order->id, 5, '0', STR_PAD_LEFT));
            $order->save();
            // dd($data['productionOutputs']);

            // ===== CREATE PRODUCTION OUTPUTS =====
            foreach ($data['productionOutputs'] as $output) {
                $order->productionOutputs()->create($output);
            }

            // ============= CREATE PRODUCTION INPUTS ============
            $this->createProductionInputs($order);

            $des = 'سفارش ' . $data['ordered_by'] . ' در سیستم ثبت شد ';
            $log->create('insert', $des, null, '/factory/production-orders/' . $order->id);
            $notifiableUsers = User::query()
                ->with('role:id,name')
                ->whereHas('role', fn($q) => $q->whereIn('name', ['admin', 'super_admin', 'factory_clerk']))
                ->get();
            foreach ($notifiableUsers as $user) {
                $user->notify(new NewOrderCreated($order));
            }
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
        $productionOrder->load('productionOutputs:id,product_id,quantity_produced,production_order_id', 'productionOutputs.product:item_id,per_pack,weight', 'productionOutputs.product.item:id,name,unit,code');
        $productionOrder->load('wastes:id,production_order_id');
        return Inertia::render('factory/order/show', compact('productionOrder', 'logo'));
    }

    public function changeOrderStatus(ProductionOrder $production_order, string $status)
    {
        $currentStatus = $production_order->status;
        DB::beginTransaction();
        try {
            if ($currentStatus === "pending") {
                if ($status === "completed") {
                    Inertia::flash('toast', ['type' => 'error', 'message' => 'شما نمی توانین که از حالت منتظر به حالت تکیمل شده یک سفارش را ببرید. لطفا اول سفارش را به حالت جریان ارسال کنید!']);
                    DB::rollBack();
                    return redirect()->back();
                }
            }
            if ($status !== 'completed') {

                // check the inventory if there's enough items in factory
                // for status 'progress'
                if ($status === 'progress') {

                    //  check evenry row_materials if we have in factory
                    foreach ($production_order->productionInputs as $input) {
                        $this->ensureTheresEnoughQuantityInFactory($input->item, $input->quantity_used);
                    }
                }
                $production_order->status = $status;
                $production_order->save();
                $log = new Log();
                $des = 'حالت سفارش ' . $production_order->reference_no . ' تغیر از ' . $currentStatus . ' به' . $status . 'شد';
                $log->create('update', $des, null, route('orders.show', $production_order->id));
                $notifiableUsers = User::query()
                    ->with('role:id,name')
                    ->whereHas('role', fn($q) => $q->whereIn('name', ['admin', 'super_admin', 'shop_clerk']))
                    ->get();
                foreach ($notifiableUsers as $user) {
                    $user->notify(new OrderProcessed($production_order));
                }
                DB::commit();
                Inertia::flash('toast', ['type' => "success", 'message' => 'حالت سفارش تغیر از ' . $currentStatus . '  به شد' . $status]);
                return redirect()->to(route('orders.show', $production_order->id));
            }

            return redirect()->to(route('orders.confirm-outputs', [$production_order, $status]));
        } catch (\Throwable $th) {
            DB::rollBack();
            Inertia::flash('toast', ['type' => "error", 'message' => 'حالت سفارش تغیر از ' . $currentStatus . '  به نشد' . $status . ': مشکل: ' . $th->getMessage()]);
            return redirect()->back();
        }
    }


    public function getCategoryBasedProducts(Category $category)
    {

        $products = Product::with(['item:id,name,unit,category_id,default_sale_price', 'item.category:id,name'])
            ->whereHas('item.category', function ($query) use ($category) {
                $query->where('name', $category->name);
            })
            ->get();
        return response()->json($products);
    }

    private function ensureTheresEnoughQuantityInFactory(Item $item, float $req_qty): void
    {
        $location = Location::firstWhere('name', 'factory');
        if ($location === null)
            abort(404, 'the factory is not found for processing the order');
        $balance = InventoryBalance::where('location_id', $location->id)->where('item_id', $item->id)->first();
        if ($balance === null)
            abort(404, 'the balance is not found for the item : ' . $item->name . ' check the balance and retry!');
        $quantity_in_stock = $balance->quantity_on_hand - $balance->reserved;
        // dd($req_qty);
        if ($quantity_in_stock < $req_qty)
            abort(422, 'there is not enough quantity in factory for the item : ' . $item->name);
    }

    private function createProductionInputs(ProductionOrder $production_order)
    {
        // load bomLine 
        $production_order->load('bom:id,formula_name,min_exp_qty,max_exp_qty', 'bom.bomLines:id,item_id,bom_id,required_quantity', 'bom.bomLines.item:id,name,unit');

        // Get At least and at most expected quantity;
        // $min_exp_qty = $production_order->bom->min_exp_qty;
        $max_exp_qty = $production_order->bom->max_exp_qty;

        // Load Production OutPuts;
        $production_order->load('productionOutputs:id,production_order_id,product_id,quantity_produced', 'productionOutputs.product:item_id,weight');

        // get the ordered quantity of all products ordered
        $ordered_qty = 0;
        foreach ($production_order->productionOutputs as $output) {
            $ordered_qty += ($output->quantity_produced * $output->product->weight);
        }


        if ($max_exp_qty <= 0) {
            abort(422, 'مقدار تخمینی فورمول کمتر از صفر است. مقدار تخمینی را چک و دوباره کوشش کنید');
        }

        foreach ($production_order->bom->bomLines as $bom_line) {
            $quantity_used = round(
                ($bom_line->required_quantity * $ordered_qty) / $max_exp_qty,
                4
            );

            ProductionInput::updateOrCreate(
                [
                    'production_order_id' => $production_order->id,
                    'item_id' => $bom_line->item_id,
                ],
                ['quantity_used' => $quantity_used]
            );
        }
    }

    private function validateOrder(Request $request): array
    {
        return $request->validate([
            'ordered_by' => 'required|string|max:55',
            'bom_id' => 'required|integer|exists:boms,id',
            'order_date' => 'required|date',
            'notes' => 'nullable|string|max:255',
            'productionOutputs' => 'required|array|min:1',

            // each line validation
            'productionOutputs.*.product_id' => 'required|integer|exists:items,id|distinct',
            'productionOutputs.*.quantity_produced' => 'required|numeric|gt:0',
        ]);
    }

    private function createProductionOrder(array $data): ProductionOrder
    {
        return ProductionOrder::create([
            'ordered_by' => $data['ordered_by'],
            'bom_id' => $data['bom_id'],
            'order_date' => $data['order_date'],
            'notes' => $data['notes'],
            'status' => 'pending',
            'reference_no' => '',
        ]);
    }
}
