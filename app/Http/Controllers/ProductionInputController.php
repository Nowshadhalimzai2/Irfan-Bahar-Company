<?php

namespace App\Http\Controllers;

use App\Custome\InvMovement;
use App\Custome\Log;
use App\Models\Item;
use App\Models\Location;
use App\Models\ProductionInput;
use App\Models\ProductionOrder;
use Illuminate\Auth\Access\Gate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate as FacadesGate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ProductionInputController extends Controller
{

    public function getInputs(ProductionOrder $production_order)
    {
        // load bomLine 
        $production_order->load('bom:id,formula_name,min_exp_qty,max_exp_qty', 'bom.bomLines:id,item_id,bom_id,required_quantity', 'bom.bomLines.item:id,name,unit');

        //  LOAD PRODUCTION INPUTS 
        $production_order->load('productionInputs:id,production_order_id,item_id,quantity_used', 'productionInputs.item:id,name,unit,code');

        $logo = Storage::url('public/logo/nobg.png');

        return Inertia::render('factory/order/ingredients', compact('production_order', 'logo'));
    }

    public function confirmInputs(ProductionOrder $production_order, string $status)
    {
        FacadesGate::authorize('allow-factory_clerk');
        if ($status !== 'completed')
            return redirect()->to(route('orders.index'));


        $items = Item::whereNot('item_type', 'product')->select('id', 'name', 'unit', 'item_type,code')->get();
        // dd($items);
        $production_order->load('productionInputs:id,item_id,quantity_used,production_order_id', 'productionInputs.item:id,name,unit');
        $production_order->load('productionOutputs:id,item_id,quantity_used,production_order_id', 'productionInputs.item:id,name,unit');
        return Inertia::render('factory/order/confirm-inputs', compact('production_order', 'status', 'items'));
    }

    public function update(Request $request, ProductionOrder $production_order)
    {
        FacadesGate::authorize('allow-factory_clerk');
        $data = $this->validateData($request);

        if ((int) $data['production_order_id'] !== (int) $production_order->id) {
            abort(422, 'محصول تولید شده مشابهت نمی کنه');
        }

        if ($production_order->status === 'completed') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'این سفارش قبلاً تکمیل شده است.',
            ]);

            return redirect()->back();
        }

        DB::beginTransaction();

        try {
            $currentStatus = $production_order->status;

            $production_order->update([
                'status' => $data['status'],
            ]);

            if (!$this->updateProductionInputs($data, $production_order)) {
                throw new \RuntimeException(
                    'در کارخانه مواد کافی نداریم لطفا مقدار چک و دوباره امتحان نمایید.'
                );
            }

            if (!$this->updateProductionOutputs($production_order)) {
                throw new \RuntimeException(
                    'موجودی محصول تولیدشده به‌روزرسانی نشد.'
                );
            }

            $log = new Log();
            $des = 'حالت سفارش ' . $production_order->reference_no
                . ' تغیر از ' . $currentStatus
                . ' به ' . $data['status'] . ' شد';

            $log->create(
                'update',
                $des,
                null,
                route('orders.show', $production_order->id)
            );

            DB::commit();

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'سفارش با موفقیت تکمیل شد.',
            ]);

            if ($data['doesItHaveWaste']) {
                return redirect()->route('wastes.create', $production_order->id);
            }

            return redirect()->route('orders.show', $production_order->id);
        } catch (\Throwable $th) {
            DB::rollBack();
            if ($th instanceof ValidationException) {
                return redirect()->back()->withErrors('message', 'erorr ' . $th->getMessage());
            }
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'درخواست تان قبول نشد. ' . $th->getMessage(),
            ]);

            return redirect()->back();
        }
    }

    private function updateProductionInputs(array $data, ProductionOrder $production_order): bool
    {
        FacadesGate::authorize('allow-factory_clerk');
        $location = Location::firstWhere('name', 'factory');

        if (!$location) {
            throw new \RuntimeException('Factory location was not found.');
        }

        foreach ($data['orderInputs'] as $input) {
            ProductionInput::updateOrCreate(
                [
                    'production_order_id' => $production_order->id,
                    'item_id' => $input['item_id'],
                ],
                [
                    'quantity_used' => $input['quantity_used'],
                ]
            );

            $movement = new InvMovement();

            if (!$movement->move(
                $location->id,
                $input['item_id'],
                $input['quantity_used'],
                'production_consumption',
                '',
                '-'
            )) {
                return false;
            }
        }

        return true;
    }

    private function validateData(Request $request): array
    {
        // dd($request->all());
        return $request->validate([
            'production_order_id' => 'required|integer|exists:production_orders,id',
            'status' => 'required|in:completed',
            'doesItHaveWaste' => 'required|boolean',
            'orderInputs' => 'required|array|min:1',
            'orderInputs.*.item_id' => 'required|integer|exists:items,id|distinct',
            'orderInputs.*.quantity_used' => 'required|numeric|gte:0',
        ]);
    }
    private function updateProductionOutputs(ProductionOrder $production_order): bool
    {
        $location = Location::firstWhere('name', 'factory');

        if (!$location) {
            throw new \RuntimeException('Factory location was not found.');
        }

        $production_order->load(
            'productionOutputs:id,production_order_id,product_id,quantity_produced'
        );

        foreach ($production_order->productionOutputs as $output) {
            $movement = new InvMovement();

            if (!$movement->move(
                $location->id,
                $output->product_id,
                $output->quantity_produced,
                'production_output'
            )) {
                return false;
            }
        }

        return true;
    }
}
