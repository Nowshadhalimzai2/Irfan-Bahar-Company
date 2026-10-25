<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Custome\SHA;
use App\Models\Expense;
use App\Models\GoodsReceipt;
use App\Models\ShopAccount;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Models\SupplierPaymentAllocation;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class SupplierPaymentController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'gt:0', 'max:9999999999999.99'],
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'currency_id' => ['required', 'integer', 'exists:currencies,id'],
            'payment_method' => ['required', 'in:cash,bank_transfer,card,other'],
            'reference_no' => ['nullable', 'string', 'max:64'],
            'paid_at' => ['required', 'date_format:Y-m-d'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'allocations' => ['nullable', 'array'],
            'allocations.*.goods_receipt_id' => ['required', 'integer', 'distinct', 'exists:goods_receipts,id'],
            'allocations.*.amount' => ['required', 'numeric', 'gt:0', 'max:9999999999999.99'],
        ]);

        $allocations = collect($data['allocations'] ?? []);
        $allocatedAmount = round((float) $allocations->sum('amount'), 2);

        if ($allocatedAmount > round((float) $data['amount'], 2)) {
            throw ValidationException::withMessages([
                'allocations' => 'مجموع مبالغ تخصیص‌یافته نمی‌تواند بیشتر از مبلغ پرداخت باشد.',
            ]);
        }

        return DB::transaction(function () use ($data, $allocations) {
            $supplier = Supplier::query()->lockForUpdate()->findOrFail($data['supplier_id']);
            $lockedReceipts = [];

            foreach ($allocations as $allocation) {
                $receipt = GoodsReceipt::query()
                    ->where('supplier_id', $supplier->id)
                    ->where('currency_id', $data['currency_id'])
                    ->lockForUpdate()
                    ->find($allocation['goods_receipt_id']);

                if (! $receipt) {
                    throw ValidationException::withMessages([
                        'allocations' => 'رسید انتخاب‌شده متعلق به این تأمین‌کننده یا واحد پول نیست.',
                    ]);
                }

                if ((float) $allocation['amount'] > (float) $receipt->total_amount - (float) $receipt->amount_paid + 0.00001) {
                    throw ValidationException::withMessages([
                        'allocations' => "مبلغ تخصیص به رسید {$receipt->reference_no} از باقی‌مانده آن بیشتر است.",
                    ]);
                }

                $lockedReceipts[] = [$receipt, round((float) $allocation['amount'], 2)];
            }

            $payment = SupplierPayment::create([
                'supplier_id' => $supplier->id,
                'goods_receipt_id' => count($lockedReceipts) === 1 ? $lockedReceipts[0][0]->id : null,
                'currency_id' => $data['currency_id'],
                'payment_no' => 'TEMP-' . Str::uuid(),
                'amount' => round((float) $data['amount'], 2),
                'payment_method' => $data['payment_method'],
                'paid_at' => $data['paid_at'],
                'reference_no' => $data['reference_no'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => Auth::id(),
                'status' => 'completed',
            ]);

            $payment->update([
                'payment_no' => sprintf('SP-%s-%06d', Carbon::parse($data['paid_at'])->format('Y'), $payment->id),
            ]);
            //  check if the payment is from shop or elsewhere if shop debit the shop account and add as an expense!
            if((string) $data['payment_method']== 'cash'){
                $sa =ShopAccount::query()->where('currency_id',$data['currency_id'])->first();
                if($sa->amount< (float)$data['amount']){
                        throw ValidationException::withMessages(['allocation'=>"مبلغ پرداخت شده ګی زیاتر از حساب $payment->amount زیات شده نمی شه"]);
                }
                (new SHA())->debit($data['amount'],$data['currency_id']);
                Expense::create([
                    'amount' => $data['amount'],
                    'currency_id' => $data['currency_id'],
                    'description' => sprintf('برای %s پول پراخت شد  ',$supplier->name),
                    'date' => $data['paid_at'],
                ]);
            }
            foreach ($lockedReceipts as [$receipt, $amount]) {
                SupplierPaymentAllocation::create([
                    'supplier_payment_id' => $payment->id,
                    'goods_receipt_id' => $receipt->id,
                    'amount' => $amount,
                    
                ]);
                $receipt->increment('amount_paid', $amount);
            }

            (new Log())->create('insert', "پرداخت {$payment->payment_no} برای تأمین‌کننده {$supplier->name} ثبت شد");

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => "پرداخت {$payment->payment_no} با موفقیت ثبت شد.",
            ]);

            return redirect()->route('suppliers.show', $supplier);
        }, 3);
    }
}
