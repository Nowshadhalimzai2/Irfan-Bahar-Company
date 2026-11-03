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
use App\Services\ProductionOrderService;
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
            'bom.bomLines:id,item_id,item_unit_id,bom_id,required_quantity',
            'bom.bomLines.item:id,name,unit',
            'bom.bomLines.itemUnit:id,name,symbol,conversion_to_base',
            'productionInputs:id,production_order_id,item_id,quantity_used',
            'productionInputs.item:id,name,unit,item_type,code,base_unit_id',
            'productionInputs.item.baseUnit:id,item_id,name,symbol,conversion_to_base',
        ]);

        $logo = asset('nobg.png');

        return Inertia::render('factory/order/ingredients', compact('production_order', 'logo'));
    }

    public function confirmOutputs(ProductionOrder $production_order, string $status)
    {
        Gate::authorize('allow-factory_clerk');

        abort_unless(
            $status === 'completed' && $production_order->status === 'progress',
            422,
            'سفارش در مرحله تولید نیست.',
        );

        $items = Item::query()
            ->whereHas('product')
            ->where('category_id', $production_order->bom->category_id)
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
        abort_unless(
            $status === 'completed' && $production_order->status === 'progress',
            422,
            'سفارش در مرحله تولید نیست.',
        );

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
            'outputs.*.quantity_produced' => ['required', 'numeric', 'gt:0', 'decimal:0,3'],
        ]);

        $this->assertOrderMatchesRequest($data['production_order_id'], $production_order);

        abort_unless($status === $data['status'], 422, 'وضعیت سفارش معتبر نیست.');

        $categoryId = $production_order->bom()->value('category_id');
        $submittedProductIds = collect($data['outputs'])->pluck('item_id')->map(fn ($id) => (int) $id);
        $validProductIds = Item::query()
            ->whereIn('id', $submittedProductIds)
            ->where('category_id', $categoryId)
            ->whereHas('product')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        abort_unless(
            $submittedProductIds->every(fn ($id) => in_array((int) $id, $validProductIds, true)),
            422,
            'محصول انتخاب‌شده با دسته‌بندی فورمول مطابقت ندارد.',
        );

        try {
            DB::transaction(function () use ($data, $production_order): void {
                $order = ProductionOrder::query()
                    ->whereKey($production_order->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($order->status !== 'progress') {
                    throw new \RuntimeException('سفارش در مرحله تولید نیست یا قبلاً تکمیل شده است.');
                }

                $submittedProductIds = collect($data['outputs'])
                    ->pluck('item_id')
                    ->map(fn ($id) => (int) $id)
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

                app(ProductionOrderService::class)->syncExpectedInputs($order);
                $order->outputs_confirmed_at = now();
                $order->save();

                $description = sprintf(
                    'سفارش %s تولیدات اش به‌روزرسانی شد',
                    $order->reference_no
                );

                (new Log)->create(
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

        abort_unless(
            $status === 'completed'
                && $production_order->status === 'progress'
                && $production_order->outputs_confirmed_at !== null,
            422,
            'ابتدا محصولات تولیدشده را تائید کنید.',
        );

        $items = Item::query()
            ->whereIn('id', $production_order->productionInputs()->pluck('item_id'))
            ->with('baseUnit:id,item_id,name,symbol,conversion_to_base')
            ->select('id', 'name', 'unit', 'item_type', 'code', 'base_unit_id')
            ->orderBy('name')
            ->get();

        $production_order->load([
            'productionInputs:id,production_order_id,item_id,quantity_used',
            'productionInputs.item:id,name,unit,item_type,code,base_unit_id',
            'productionInputs.item.baseUnit:id,item_id,name,symbol,conversion_to_base',
            // 'productionOutputs:id,production_order_id,product_id,quantity_produced',
            // 'productionOutputs.product.item:id,name,unit,code',
        ]);

        return Inertia::render('factory/order/confirm-inputs', compact('production_order', 'status', 'items'));
    }

    public function updateInputs(Request $request, ProductionOrder $production_order)
    {
        Gate::authorize('allow-factory_clerk');

        abort_unless($production_order->status === 'progress', 422, 'سفارش در مرحله تولید نیست.');
        abort_unless($production_order->outputs_confirmed_at !== null, 422, 'ابتدا محصولات تولیدشده را تائید کنید.');
        $data = $this->validateInputData($request);
        $this->assertOrderMatchesRequest($data['production_order_id'], $production_order);
        try {
            DB::transaction(function () use ($data, $production_order): void {
                $order = ProductionOrder::query()
                    ->whereKey($production_order->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($order->status !== 'progress') {
                    throw new \RuntimeException('سفارش در مرحله تولید نیست یا قبلاً تکمیل شده است.');
                }
                if ($order->outputs_confirmed_at === null) {
                    throw new \RuntimeException('ابتدا محصولات تولیدشده را تائید کنید.');
                }

                $order->load('productionOutputs:id,production_order_id,product_id,quantity_produced');

                if ($order->productionOutputs->isEmpty()) {
                    throw new \RuntimeException('ابتدا حداقل یک محصول تولیدشده را ثبت کنید.');
                }

                $this->consumeInputs($data, $order);
                $this->addOutputsToInventory($order);

                $oldStatus = $order->status;
                $order->update(['status' => 'completed']);

                $description = 'حالت سفارش '.$order->reference_no
                    .' از '.$oldStatus.' به completed تغییر کرد';

                //  ALERT USERS FOR ORDER COMPLETTION
                $users = User::query()->with('role:id,name')->whereHas('role', fn ($p0) => $p0->whereIn('name', ['admin', 'super_admin', 'shop_clerk']))->get();
                foreach ($users as $user) {
                    $user->notify(new OrderProcessed($order));
                }

                (new Log)->create(
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
        $allowedItemIds = $order->productionInputs()->pluck('item_id')->map(fn ($id) => (int) $id)->all();

        $submittedItemIds = collect($data['orderInputs'])
            ->pluck('item_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if (array_diff($submittedItemIds, $allowedItemIds) !== []) {
            throw new \RuntimeException('مواد مصرفی باید از مواد فورمول همین سفارش انتخاب شوند.');
        }

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

            $moved = (new InvMovement)->move(
                $location->id,
                $input['item_id'],
                (float) $input['quantity_used'],
                'production_consumption',
                'Production order '.$order->reference_no,
                '-',
            );

            if (! $moved) {
                throw new \RuntimeException('در کارخانه مواد کافی نداریم.');
            }
        }
    }

    private function addOutputsToInventory(ProductionOrder $order): void
    {
        $location = $this->factoryLocation();
        // dd($order->productionOutputs);

        foreach ($order->productionOutputs as $output) {
            $moved = (new InvMovement)->move(
                $location->id,
                $output->product_id,
                (float) $output->quantity_produced,
                'production_output',
                'Production order '.$order->reference_no,
            );

            if (! $moved) {
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
                    fn ($query) => $query->where('item_type', '!=', 'product')
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
            'message' => 'درخواست پذیرفته نشد. '.$exception->getMessage(),
        ]);

        return redirect()->back()->withErrors([
            'message' => $exception->getMessage(),
        ]);
    }
}
