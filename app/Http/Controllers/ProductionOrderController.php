<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Models\BOM;
use App\Models\Category;
use App\Models\InventoryBalance;
use App\Models\Item;
use App\Models\Location;
use App\Models\Product;
use App\Models\ProductionOrder;
use App\Models\User;
use App\Notifications\NewOrderCreated;
use App\Notifications\OrderProcessed;
use App\Services\ProductionOrderService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log as ApplicationLog;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class ProductionOrderController extends Controller
{
    private function getAuthUser(): User
    {
        return Auth::user();
    }

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
        Gate::authorize(! $this->getAuthUser()->hasRole('shop_clerk'));
        $junkOrders = ProductionOrder::with([
            'bom:id,category_id',
            'bom.category:id,name',
            'productionOutputs:id,production_order_id,product_id,quantity_produced',
            'productionOutputs.product:item_id,weight,per_pack',
        ])
            ->select(['id', 'ordered_by', 'status', 'order_date', 'notes', 'bom_id'])
            // ->whereDate('order_date','>=',now(config('app.timezone')))
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

        return Inertia::render('factory/order/create', compact('boms'));
    }

    public function store(Request $request)
    {
        $data = $this->validateOrder($request);
        $log = new Log;
        $order = null;
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
            app(ProductionOrderService::class)->syncExpectedInputs($order);

            $des = 'سفارش '.$data['ordered_by'].' در سیستم ثبت شد ';
            $log->create('insert', $des, null, '/factory/production-orders/'.$order->id);
            $notifiableUsers = User::query()
                ->with('role:id,name')
                ->whereHas('role', fn ($q) => $q->whereIn('name', ['admin', 'super_admin', 'factory_clerk']))
                ->get();
            foreach ($notifiableUsers as $user) {
                $user->notify(new NewOrderCreated($order));
            }
            DB::commit();
            ApplicationLog::info('Production order created.', [
                'user_id' => Auth::id(),
                'production_order_id' => $order->id,
                'reference_no' => $order->reference_no,
                'status' => $order->status,
            ]);
            Inertia::flash('toast', ['type' => 'success', 'message' => $des]);

            return redirect()->to(route('orders.index'));
        } catch (\Throwable $th) {
            // Let validation exceptions bubble so Inertia/Laravel can return proper validation responses
            if ($th instanceof ValidationException) {
                DB::rollBack();
                throw $th;
            }
            $des = ' متاسفانه سفارش'.($data['ordered_by'] ?? '').'در ثبت سیستم ثبت نشد ';
            DB::rollBack();
            ApplicationLog::error('Production order creation failed.', [
                'user_id' => Auth::id(),
                'production_order_id' => $order->id ?? null,
                'reference_no' => $order->reference_no ?? null,
                'status' => 'failed',
                'exception' => $th,
            ]);
            Inertia::flash('toast', ['type' => 'error', 'message' => 'ثبت سفارش تولید ناموفق بود. لطفاً دوباره تلاش کنید.']);

            return redirect()->back();
        }
    }

    public function show(ProductionOrder $productionOrder): Response
    {
        $logo = asset('nobg.png');
        $productionOrder->load('bom:id,category_id', 'bom.category:id,name');
        $productionOrder->load('productionOutputs:id,product_id,quantity_produced,production_order_id', 'productionOutputs.product:item_id,per_pack,weight', 'productionOutputs.product.item:id,name,unit,code');
        $productionOrder->load('wastes:id,production_order_id');

        return Inertia::render('factory/order/show', compact('productionOrder', 'logo'));
    }

    public function changeOrderStatus(ProductionOrder $production_order, string $status)
    {
        Gate::allowIf($this->getAuthUser()->hasRole('factory_clerk'));

        try {
            return DB::transaction(function () use ($production_order, $status): RedirectResponse {
                $order = ProductionOrder::query()
                    ->whereKey($production_order->id)
                    ->lockForUpdate()
                    ->firstOrFail();
                $currentStatus = $order->status;

                $allowedTransitions = [
                    'pending' => ['progress', 'cancelled'],
                    'progress' => ['completed', 'drafted'],
                    'drafted' => ['pending', 'progress'],
                    'cancelled' => [],
                    'completed' => [],
                ];
                abort_unless(
                    in_array($status, $allowedTransitions[$currentStatus] ?? [], true),
                    422,
                    'تغییر وضعیت سفارش مجاز نیست.',
                );

                if ($status === 'completed') {
                    abort_if($order->productionOutputs()->doesntExist(), 422, 'ابتدا محصولات تولیدشده را ثبت کنید.');
                    abort_if($order->productionInputs()->doesntExist(), 422, 'مواد مصرفی فورمول در دسترس نیست.');

                    return redirect()->route('orders.confirm-outputs', [$order, $status]);
                }

                if ($status === 'progress') {
                    $order->load('productionInputs.item');
                    abort_if($order->productionInputs->isEmpty(), 422, 'مواد مصرفی فورمول در دسترس نیست.');

                    foreach ($order->productionInputs as $input) {
                        $this->ensureTheresEnoughQuantityInFactory($input->item, (float) $input->quantity_used);
                    }
                }

                $order->status = $status;
                $order->save();
                DB::afterCommit(fn () => ApplicationLog::info('Production order status updated.', [
                    'user_id' => Auth::id(),
                    'production_order_id' => $order->id,
                    'reference_no' => $order->reference_no,
                    'previous_status' => $currentStatus,
                    'status' => $status,
                ]));
                $log = new Log;
                $des = 'حالت سفارش '.$order->reference_no.' تغیر از '.$currentStatus.' به'.$status.'شد';
                $log->create('update', $des, null, route('orders.show', $order->id));
                $notifiableUsers = User::query()
                    ->with('role:id,name')
                    ->whereHas('role', fn ($q) => $q->whereIn('name', ['admin', 'super_admin', 'shop_clerk']))
                    ->get();
                foreach ($notifiableUsers as $user) {
                    $user->notify(new OrderProcessed($order));
                }
                Inertia::flash('toast', ['type' => 'success', 'message' => 'حالت سفارش تغیر از '.$currentStatus.'  به شد'.$status]);

                return redirect()->to(route('orders.show', $order->id));
            }, 3);
        } catch (\Throwable $th) {
            if ($th instanceof HttpExceptionInterface || $th instanceof ValidationException) {
                throw $th;
            }

            ApplicationLog::error('Production order status update failed.', [
                'user_id' => Auth::id(),
                'production_order_id' => $production_order->id,
                'reference_no' => $production_order->reference_no,
                'requested_status' => $status,
                'exception' => $th,
            ]);
            Inertia::flash('toast', ['type' => 'error', 'message' => 'تغییر وضعیت سفارش ناموفق بود. لطفاً دوباره تلاش کنید.']);

            return redirect()->back();
        }
    }

    public function getCategoryBasedProducts(Category $category)
    {

        $products = Product::with([
            'item:id,name,unit,category_id,default_sale_price,base_unit_id,code',
            'item.units:id,item_id,name,symbol,conversion_to_base,code,barcode,selling_price,purchase_price,is_active',
            'item.baseUnit:id,item_id,name,symbol,conversion_to_base,code,barcode,selling_price,purchase_price,is_active',
            'item.category:id,name',
        ])
            ->whereHas('item.units', fn ($query) => $query->where('is_active', true))
            ->whereHas('item.category', function ($query) use ($category) {
                $query->where('name', $category->name);
            })
            ->get();

        return response()->json($products);
    }

    private function ensureTheresEnoughQuantityInFactory(Item $item, float $req_qty): void
    {
        $location = Location::firstWhere('name', 'factory');
        if ($location === null) {
            abort(404, 'the factory is not found for processing the order');
        }
        $balance = InventoryBalance::where('location_id', $location->id)->where('item_id', $item->id)->first();
        $quantity_in_stock = ($balance?->quantity_on_hand ?? 0) - ($balance?->reserved ?? 0);
        if ($quantity_in_stock < $req_qty) {
            abort(422, 'there is not enough quantity in factory for the item : '.$item->name);
        }
    }

    private function validateOrder(Request $request): array
    {
        $validator = Validator::make($request->all(), [
            'ordered_by' => 'required|string|max:55',
            'bom_id' => 'required|integer|exists:boms,id',
            'order_date' => 'required|date',
            'notes' => 'nullable|string|max:255',
            'productionOutputs' => 'required|array|min:1',

            // each line validation
            'productionOutputs.*.product_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('products', 'item_id'),
            ],
            'productionOutputs.*.quantity_produced' => ['required', 'numeric', 'gt:0', 'decimal:0,3'],
        ]);

        $validator->after(function ($validator) use ($request): void {
            $bom = BOM::query()->find($request->input('bom_id'));
            $outputs = $request->input('productionOutputs', []);

            if (! $bom || ! is_array($outputs)) {
                return;
            }

            $productIds = collect($outputs)
                ->filter(fn ($output) => is_array($output) && isset($output['product_id']))
                ->pluck('product_id')
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values();

            $validProductIds = Product::query()
                ->whereIn('item_id', $productIds)
                ->whereHas('item', fn ($query) => $query->where('category_id', $bom->category_id))
                ->pluck('item_id')
                ->map(fn ($id) => (int) $id)
                ->all();

            foreach ($outputs as $index => $output) {
                if (
                    is_array($output)
                    && isset($output['product_id'])
                    && ! in_array((int) $output['product_id'], $validProductIds, true)
                ) {
                    $validator->errors()->add(
                        "productionOutputs.{$index}.product_id",
                        'محصول انتخاب‌شده با دسته‌بندی فورمول مطابقت ندارد.',
                    );
                }
            }
        });

        return $validator->validate();
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
