<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptLine;
use App\Models\Supplier;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SupplierController extends Controller
{

    public function create()
    {

        return inertia('supplier/create');
    }

    public function store(Request $request): RedirectResponse
    {

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|numeric|starts_with:07',
            'email' => 'nullable|email|max:255|unique:suppliers,email,except:id',
            'address' => 'required|string|max:255',
        ]);
        DB::beginTransaction();
        try {
            Supplier::create([
                'name' => $data['name'],
                'phone' => $data['phone'],
                'email' => $data['email'],
                'address' => $data['address'],
            ]);
            $log = new Log();
            $log->create('insert', 'تأمین کننده نو ' . $data['name']);
            DB::commit();
            Inertia::flash('toast', ['type' => 'success', 'message' => 'تأمین کننده با موفقیت ایجاد شد.']);
            return redirect()->to(route('employees.index'));
        } catch (\Throwable $th) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'تأمین کننده ایجاد نشد.']);

            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'یک مشکل را در وجود امد. لطفا دوباره امتحان کنین']);
        }
    }

    public function show(Supplier $supplier)
    {

        //  { id: number; reference_no:string, notes:string, distination_location_id:number, total_amount: number; amount_paid: number; received_at: string; currency: { name: string }; }    
        return Inertia::render('supplier/show', [
            'supplier' => $supplier,
            'receipts' => $supplier
                ->goodsReceipts
                ->filter()
                ->map(function (GoodsReceipt $receipt) {

                    return [
                        'id' => $receipt->id,
                        'reference_no' => $receipt->reference_no,
                        'notes' => $receipt->notes,
                        'distination' => $receipt->location->name,
                        'total_amount' => $receipt->total_amount,
                        'amount_paid' => $receipt->amount_paid,
                        'received_at' => $receipt->received_at ? Carbon::parse($receipt->received_at)->format('Y/m/d') : null,
                        'currency' => $receipt->currency->name,
                        'lines' => $receipt->receiptLines->map(fn(GoodsReceiptLine $line) => [
                            'id' => $line->id,
                            'item' => $line->item->name,
                            'quantity' => $line->quantity,
                            'unit_cost' => $line->unit_cost,
                            'subTotal' => $line->quantity * $line->unit_cost,
                        ])->values(),
                    ];
                })->values(),
        ]);
    }

    public function edit(Supplier $supplier)
    {
        return inertia('supplier/edit', [
            'supplier' => $supplier,
        ]);
    }

    public function update(Request $request, Supplier $supplier): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|numeric|starts_with:07',
            'email' => 'nullable|email|max:255|unique:suppliers,email,' . $supplier->id,
            'address' => 'required|string|max:255',
        ]);
        DB::beginTransaction();
        try {
            $supplier->update($data);
            $log = new Log();
            $log->create('update', 'تأمین کننده ' . $supplier->name);
            DB::commit();
            Inertia::flash('toast', ['type' => 'success', 'message' => 'تأمین کننده با موفقیت ویرایش شد.']);
            return redirect()->to(route('employees.index'));
        } catch (\Throwable $th) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'تأمین کننده ویرایش نشد.' . $th->getMessage()]);
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'یک مشکل را در وجود امد. لطفا دوباره امتحان کنین']);
        }
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {

        DB::beginTransaction();
        try {
            $supplier->delete();
            $log = new Log();
            $log->create('delete', 'تأمین کننده ' . $supplier->name);
            DB::commit();
            Inertia::flash('toast', ['type' => 'success', 'message' => 'تأمین کننده با موفقیت حذف شد.']);
            return redirect()->to(route('employees.index'));
        } catch (\Throwable $th) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'تأمین کننده حذف نشد.' . $th->getMessage()]);
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'یک مشکل را در وجود امد. لطفا دوباره امتحان کنین']);
        }
    }


    public function status(Supplier $supplier)
    {
        return DB::transaction(function () use ($supplier) {
            $supplier->status = !$supplier->status;
            $supplier->save();
            $des = "اکونت {$supplier->name} " . (!$supplier->status ? 'بلاک شد' : 'خارج از بلاک لیست شد');
            (new Log())->create('update', $des, $supplier->name, route('suppliers.show', $supplier->id));
            Inertia::flash('toast', ['type' => "success", 'message' => $des]);
            return redirect()->back();
        }, 3);
    }
}
