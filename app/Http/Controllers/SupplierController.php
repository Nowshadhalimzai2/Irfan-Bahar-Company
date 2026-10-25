<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptLine;
use App\Models\Currency;
use App\Models\Supplier;
use App\Models\SupplierPayment;
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
            $supplier = Supplier::create([
                'name' => $data['name'],
                'phone' => $data['phone'],
                'email' => $data['email'],
                'address' => $data['address'],
            ]);
            $log = new Log();
            $log->create('insert', 'تأمین کننده نو ' . $data['name']);
            DB::commit();
            Inertia::flash('toast', ['type' => 'success', 'message' => 'تأمین کننده با موفقیت ایجاد شد.']);
            return redirect()->route('suppliers.show', $supplier);
        } catch (\Throwable $th) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'تأمین کننده ایجاد نشد.']);

            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'یک مشکل را در وجود امد. لطفا دوباره امتحان کنین']);
        }
    }

    public function show(Supplier $supplier)
    {
        $supplier->load('goodsReceipts.location:id,name', 'goodsReceipts.currency:id,name');
        $supplier->load('goodsReceipts.receiptLines.item:id,name');
        $supplier->load([
            'payments' => fn ($query) => $query->where('status', 'completed')->latest('paid_at'),
            'payments.currency:id,name',
            'payments.allocations.goodsReceipt:id,reference_no',
        ]);

        $receiptTotals = $supplier->goodsReceipts
            ->groupBy('currency_id')
            ->map(fn ($receipts) => (float) $receipts->sum('total_amount'));
        $receiptPaid = $supplier->goodsReceipts
            ->groupBy('currency_id')
            ->map(fn ($receipts) => (float) $receipts->sum('amount_paid'));
        $unallocatedPayments = $supplier->payments
            ->groupBy('currency_id')
            ->map(fn ($payments) => (float) $payments->sum(function (SupplierPayment $payment) {
                return max(0, (float) $payment->amount - (float) $payment->allocations->sum('amount'));
            }));

        $currencyIds = $receiptTotals->keys()
            ->merge($supplier->payments->pluck('currency_id'))
            ->unique();
        $accountCurrencies = Currency::query()->whereIn('id', $currencyIds)->orderBy('name')->get(['id', 'name']);
        $currencies = Currency::query()->orderBy('name')->get(['id', 'name']);
        $accounts = $accountCurrencies->map(function (Currency $currency) use ($receiptTotals, $receiptPaid, $unallocatedPayments) {
            $total = (float) $receiptTotals->get($currency->id, 0);
            $paid = (float) $receiptPaid->get($currency->id, 0) + (float) $unallocatedPayments->get($currency->id, 0);

            return [
                'currency_id' => $currency->id,
                'currency' => $currency->name,
                'supplied' => $total,
                'paid' => $paid,
                'remaining' => $total - $paid,
            ];
        })->values();

        return Inertia::render('supplier/show', [
            'supplier' => $supplier->only(['id', 'name', 'phone', 'email', 'address', 'status', 'has_account']),
            'accounts' => $accounts,
            'receipts' => $supplier->goodsReceipts->sortByDesc('received_at')->map(function (GoodsReceipt $receipt) {
                return [
                    'id' => $receipt->id,
                    'reference_no' => $receipt->reference_no,
                    'notes' => $receipt->notes,
                    'destination' => $receipt->location?->name,
                    'total_amount' => (float) $receipt->total_amount,
                    'amount_paid' => (float) $receipt->amount_paid,
                    'remaining' => (float) $receipt->total_amount - (float) $receipt->amount_paid,
                    'received_at' => $receipt->received_at ? Carbon::parse($receipt->received_at)->format('Y-m-d') : null,
                    'currency_id' => $receipt->currency_id,
                    'currency' => $receipt->currency?->name,
                    'lines' => $receipt->receiptLines->map(fn (GoodsReceiptLine $line) => [
                        'id' => $line->id,
                        'item' => $line->item?->name,
                        'quantity' => (float) $line->quantity,
                        'unit_cost' => (float) $line->unit_cost,
                        'subTotal' => round((float) $line->quantity * (float) $line->unit_cost, 2),
                    ])->values(),
                ];
            })->values(),
            'payments' => $supplier->payments->map(fn (SupplierPayment $payment) => [
                'id' => $payment->id,
                'payment_no' => $payment->payment_no,
                'amount' => (float) $payment->amount,
                'payment_method' => $payment->payment_method,
                'reference_no' => $payment->reference_no,
                'notes' => $payment->notes,
                'paid_at' => $payment->paid_at ? Carbon::parse($payment->paid_at)->format('Y-m-d') : null,
                'currency_id' => $payment->currency_id,
                'currency' => $payment->currency?->name,
                'allocations' => $payment->allocations->map(fn ($allocation) => [
                    'receipt' => $allocation->goodsReceipt?->reference_no,
                    'amount' => (float) $allocation->amount,
                ])->values(),
                'unallocated' => max(0, (float) $payment->amount - (float) $payment->allocations->sum('amount')),
            ])->values(),
            'currencies' => $currencies,
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
            return redirect()->route('suppliers.show', $supplier);
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
            return redirect()->to('/stackholders');
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
