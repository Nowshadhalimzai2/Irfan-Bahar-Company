<?php

namespace App\Http\Controllers;

use App\Custome\InvMovement;
use App\Custome\Log;
use App\Models\Item;
use App\Models\Location;
use App\Models\ProductionInput;
use App\Models\ProductionOrder;
use App\Models\User;
use App\Notifications\OrderProcessed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProductionInputController extends Controller
{
    public function getInputs(ProductionOrder $production_order)
    {
        Gate::authorize('allow-factory_clerk');

        $production_order->load([
            'bom:id,formula_name,min_exp_qty,max_exp_qty',
            'bom.bomLines:id,item_id,bom_id,required_quantity',
            'bom.bomLines.item:id,name,unit',
            'productionInputs:id,production_order_id,item_id,quantity_used',
            'productionInputs.item:id,name,unit,code',
        ]);

        $logo = asset('nobg.png');

        return Inertia::render('factory/order/ingredients', compact('production_order', 'logo'));
    }

    public function confirmOutputs(ProductionOrder $production_order, string $status)
    {
        Gate::authorize('allow-factory_clerk');

        if ($status !== 'completed') {
            return redirect()->route('orders.index');
        }

        // Outputs must be actual products, not merely any non-raw-material item.
        $items = Item::query()
            ->whereHas('product')
            ->select('id', 'name', 'unit', 'item_type', 'code')
            ->orderBy('name')
            ->get();

        $production_order->load([
            'productionOutputs:id,production_order_id,product_id,quantity_produced',
            'productionOutputs.product:item_id,weight,per_pack',
            'productionOutputs.product.item:id,name,unit,code',
        ]);

        return Inertia::render('factory/order/confirm-outputs', compact('production_order', 'status', 'items'));
    }

    public function updateOutputs(Request $request, ProductionOrder $production_order, string $status)
    {
        Gate::authorize('allow-factory_clerk');
        $data = $request->validate([
            'production_order_id' => [
                'required',
                'integer',
                Rule::exists('production_orders', 'id'),
            ],
            'status' => ['required', 'in:completed'],
            'outputs' => ['required', 'array', 'min:1'],
            'outputs.*.item_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('items', 'id'),
            ],
            'outputs.*.quantity_produced' => ['required', 'numeric', 'gt:0'],
        ]);
        // dd($data);

        $this->assertOrderMatchesRequest($data['production_order_id'], $production_order);

        if ($status !== $data['status']) {
            abort(422, 'وضعیت سفارش معتبر نیست.');
        }

        try {
            DB::transaction(function () use ($data, $production_order): void {
                $order = ProductionOrder::query()
                    ->whereKey($production_order->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($order->status === 'completed') {
                    throw new \RuntimeException('این سفارش قبلاً تکمیل شده است.');
                }

                $submittedProductIds = collect($data['outputs'])
                    ->pluck('item_id')
                    ->map(fn($id) => (int) $id)
                    ->all();

                // Remove products deleted from the confirmation form.
                $order->productionOutputs()
                    ->whereNotIn('product_id', $submittedProductIds)
                    ->delete();

                foreach ($data['outputs'] as $output) {
                    $order->productionOutputs()->updateOrCreate(
                        ['product_id' => $output['item_id']],
                        ['quantity_produced' => $output['quantity_produced']],
                    );
                }

                $description = sprintf(
                    'سفارش %s تولیدات اش به‌روزرسانی شد',
                    $order->reference_no
                );

                (new Log())->create(
                    'update',
                    $description,
                    null,
                    route('orders.show', $order->id),
                );
            }, 3);

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'تولیدات سفارش ذخیره شد.',
            ]);

            return redirect()->route('orders.confirm-inputs', [$production_order->id, $status]);
        } catch (\Throwable $exception) {
            return $this->backWithError($exception);
        }
    }

    public function confirmInputs(ProductionOrder $production_order, string $status)
    {
        Gate::authorize('allow-factory_clerk');

        if ($status !== 'completed') {
            return redirect()->route('orders.index');
        }

        $items = Item::query()
            ->where('item_type', '!=', 'product')
            ->select('id', 'name', 'unit', 'item_type', 'code')
            ->orderBy('name')
            ->get();

        $production_order->load([
            'productionInputs:id,production_order_id,item_id,quantity_used',
            'productionInputs.item:id,name,unit,code',
            // 'productionOutputs:id,production_order_id,product_id,quantity_produced',
            // 'productionOutputs.product.item:id,name,unit,code',
        ]);

        return Inertia::render('factory/order/confirm-inputs', compact('production_order', 'status', 'items'));
    }

    public function updateInputs(Request $request, ProductionOrder $production_order)
    {
        Gate::authorize('allow-factory_clerk');

        $data = $this->validateInputData($request);
        $this->assertOrderMatchesRequest($data['production_order_id'], $production_order);
        try {
            DB::transaction(function () use ($data, $production_order): void {
                $order = ProductionOrder::query()
                    ->whereKey($production_order->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($order->status === 'completed') {
                    throw new \RuntimeException('این سفارش قبلاً تکمیل شده است.');
                }

                $order->load('productionOutputs:id,production_order_id,product_id,quantity_produced');

                if ($order->productionOutputs->isEmpty()) {
                    throw new \RuntimeException('ابتدا حداقل یک محصول تولیدشده را ثبت کنید.');
                }

                $this->consumeInputs($data, $order);
                $this->addOutputsToInventory($order);

                $oldStatus = $order->status;
                $order->update(['status' => 'completed']);

                $description = 'حالت سفارش ' . $order->reference_no
                    . ' از ' . $oldStatus . ' به completed تغییر کرد';
                
                    //  ALERT USERS FOR ORDER COMPLETTION
                $users = User::query()->with('role:id,name')->whereHas('role',fn($p0) => $p0->whereIn('name',['admin','super_admin','shop_clerk']))->get();
                foreach($users as $user)
                    $user->notify(new OrderProcessed($order));

                (new Log())->create(
                    'update',
                    $description,
                    null,
                    route('orders.show', $order->id),
                );
            }, 3);

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'سفارش با موفقیت تکمیل شد.',
            ]);

            if ($data['doesItHaveWaste']) {
                return redirect()->route('wastes.create', $production_order->id);
            }

            return redirect()->route('orders.show', $production_order->id);
        } catch (\Throwable $exception) {
            return $this->backWithError($exception);
        }
    }

    private function consumeInputs(array $data, ProductionOrder $order): void
    {
        $location = $this->factoryLocation();

        $submittedItemIds = collect($data['orderInputs'])
            ->pluck('item_id')
            ->map(fn($id) => (int) $id)
            ->all();

        $order->productionInputs()
            ->whereNotIn('item_id', $submittedItemIds)
            ->delete();

        foreach ($data['orderInputs'] as $input) {
            ProductionInput::updateOrCreate(
                [
                    'production_order_id' => $order->id,
                    'item_id' => $input['item_id'],
                ],
                ['quantity_used' => $input['quantity_used']],
            );

            $moved = (new InvMovement())->move(
                $location->id,
                $input['item_id'],
                (float) $input['quantity_used'],
                'production_consumption',
                'Production order ' . $order->reference_no,
                '-',
            );

            if (!$moved) {
                throw new \RuntimeException('در کارخانه مواد کافی نداریم.');
            }
        }
    }

    private function addOutputsToInventory(ProductionOrder $order): void
    {
        $location = $this->factoryLocation();
        // dd($order->productionOutputs);

        foreach ($order->productionOutputs as $output) {
            $moved = (new InvMovement())->move(
                $location->id,
                $output->product_id,
                (float) $output->quantity_produced,
                'production_output',
                'Production order ' . $order->reference_no,
            );

            if (!$moved) {
                throw new \RuntimeException('موجودی محصول تولیدشده به‌روزرسانی نشد.');
            }
        }
    }

    private function validateInputData(Request $request): array
    {
        return $request->validate([
            'production_order_id' => ['required', 'integer', Rule::exists('production_orders', 'id')],
            'status' => ['required', 'in:completed'],
            'doesItHaveWaste' => ['required', 'boolean'],
            'orderInputs' => ['required', 'array', 'min:1'],
            'orderInputs.*.item_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('items', 'id')->where(
                    fn($query) => $query->where('item_type', '!=', 'product')
                ),
            ],
            'orderInputs.*.quantity_used' => ['required', 'numeric', 'gte:0'],
        ]);
    }

    private function factoryLocation(): Location
    {
        return Location::firstWhere('name', 'factory')
            ?? throw new \RuntimeException('Factory location was not found.');
    }

    private function assertOrderMatchesRequest(int|string $requestOrderId, ProductionOrder $order): void
    {
        if ((int) $requestOrderId !== (int) $order->id) {
            abort(422, 'سفارش درخواست‌شده معتبر نیست.');
        }
    }

    private function backWithError(\Throwable $exception)
    {
        Inertia::flash('toast', [
            'type' => 'error',
            'message' => 'درخواست پذیرفته نشد. ' . $exception->getMessage(),
        ]);

        return redirect()->back()->withErrors([
            'message' => $exception->getMessage(),
        ]);
    }
}
