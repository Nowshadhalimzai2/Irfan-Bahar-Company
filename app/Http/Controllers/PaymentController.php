<?php

namespace App\Http\Controllers;

use App\Custome\SHA;
use App\Models\Invoice;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index()
    {
        $invoices = Invoice::query()
            ->with(['sale:id,amount_paid', 'payments:id,invoice_id,amount,method,reference,paid_at', 'sale.customer:id,name'])
            ->whereIn('status', ['issued', 'partially_paid', 'paid', 'over_due'])
            ->latest('issued_on')
            ->get();

        return Inertia::render('payments/index', [
            'invoices' => $invoices->map(function (Invoice $invoice) {
                $paid = (float) $invoice->payments->sum('amount');
                if ($paid === 0.0 && $invoice->sale) {
                    $paid = (float) $invoice->sale->amount_paid;
                }
                $total = (float) $invoice->total;

                return [
                    'id' => $invoice->id,
                    'saleId' => $invoice->sale_id,
                    'number' => $invoice->invoice_number,
                    'customer' => $invoice->bill_to_name,
                    'phone' => $invoice->bill_to_phone,
                    'currency' => $invoice->currency,
                    'total' => $total,
                    'paid' => $paid,
                    'due' => max(0, $total - $paid),
                    'status' => $invoice->status,
                    'issuedOn' => $invoice->issued_on ? Carbon::parse($invoice->issued_on)->format('Y/m/d') : '',
                    'payments' => $invoice->payments->map(fn (Payment $payment) => [
                        'id' => $payment->id,
                        'amount' => (float) $payment->amount,
                        'method' => $payment->method,
                        'reference' => $payment->reference,
                        'paidAt' => Carbon::parse($payment->paid_at)->format('Y/m/d H:i'),
                    ])->values(),
                ];
            })->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'invoice_id' => ['required', 'exists:invoices,id'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'method' => ['required', 'in:cash,card,bank_transfer,other'],
            'reference' => ['nullable', 'string', 'max:255'],
            'paid_at' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $payment = DB::transaction(function () use ($data): Payment {
                $invoice = Invoice::query()->with('sale')->lockForUpdate()->findOrFail($data['invoice_id']);
                $paid = (float) $invoice->payments()->sum('amount');
                if ($paid === 0.0) {
                    $paid = (float) $invoice->sale?->amount_paid;
                }
                $remaining = (float) $invoice->total - $paid;

                if ((float) $data['amount'] > $remaining) {
                    throw new \RuntimeException('مبلغ پرداختی از باقی‌مانده بل بیشتر است.');
                }
                if($data['method']==='cash'){
                    $sa = new SHA();
                    $sa->credit($data['amount'],$invoice->sale->currency_id);
                }
                if ($invoice->payments()->count() === 0 && $paid > 0) {
                    $invoice->payments()->create([
                        'amount' => min($paid, (float) $invoice->total),
                        'method' => 'cash',
                        'paid_at' => $invoice->sale?->sold_at ?? now(),
                        'notes' => 'پرداخت اولیه قبلی',
                    ]);
                }

                $payment = $invoice->payments()->create([
                    'amount' => $data['amount'],
                    'method' => $data['method'],
                    'reference' => $data['reference'] ?? null,
                    'paid_at' => $data['paid_at'],
                    'notes' => $data['notes'] ?? null,
                ]);

                $newPaid = $paid + (float) $data['amount'];
                $invoice->update([
                    'status' => $newPaid >= (float) $invoice->total ? 'paid' : 'partially_paid',
                    'paid_at' => $newPaid >= (float) $invoice->total ? $data['paid_at'] : null,
                ]);

                if ($invoice->sale) {
                    $invoice->sale->update(['amount_paid' => $newPaid]);
                }

                return $payment;
            });

            return redirect()->route('payments.receipt', $payment)->with('success', 'پرداخت ثبت شد.');
        } catch (\Throwable $exception) {
            report($exception);

            return back()->withErrors(['amount' => $exception->getMessage()])->withInput();
        }
    }

    public function receipt(Payment $payment)
    {
        $payment->load(['invoice.sale', 'invoice.payments']);
        $invoice = $payment->invoice;
        $paid = (float) $invoice->payments->sum('amount');
        if ($paid === 0.0 && $invoice->sale) {
            $paid = (float) $invoice->sale->amount_paid;
        }

        return Inertia::render('payments/receipt', [
            'payment' => [
                'id' => $payment->id,
                'receiptNumber' => 'REC-'.now()->format('Y').'-'.str_pad((string) $payment->id, 6, '0', STR_PAD_LEFT),
                'amount' => (float) $payment->amount,
                'method' => $payment->method,
                'reference' => $payment->reference,
                'paidAt' => Carbon::parse($payment->paid_at)->format('Y/m/d H:i'),
                'notes' => $payment->notes,
            ],
            'invoice' => [
                'number' => $invoice->invoice_number,
                'customer' => $invoice->bill_to_name,
                'phone' => $invoice->bill_to_phone,
                'currency' => $invoice->currency,
                'total' => (float) $invoice->total,
                'paid' => $paid,
                'remaining' => max(0, (float) $invoice->total - $paid),
            ],
        ]);
    }
}
