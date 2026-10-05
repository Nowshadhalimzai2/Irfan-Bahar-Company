<?php

namespace App\Http\Controllers;

use App\Custome\SHA;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\PaymentCreated;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index()
    {

        $invoices = Invoice::query()
            ->with(['sale:id,amount_paid', 'payments:id,invoice_id,amount,method,reference,paid_at', 'sale.customer:id,name'])
            ->whereNotIn('status', ['paid', 'refunded'])
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
                    'invoice_number' => $invoice->invoice_number,
                    'customer' => $invoice->bill_to_name,
                    'phone' => $invoice->bill_to_phone,
                    'currency' => $invoice->currency,
                    'total' => $total,
                    'paid' => $paid,
                    'due' => max(0, $total - $paid),
                    'status' => $invoice->status,
                    'issued_on' => $invoice->issued_on ? Carbon::parse($invoice->issued_on)->format('Y/m/d') : '',
                    'payments' => $invoice->payments->map(fn(Payment $payment) => [
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
                $invoice = Invoice::query()->with(['sale.saleReturns', 'payments'])->lockForUpdate()->findOrFail($data['invoice_id']);
                $summary = $invoice->financialSummary();
                $paid = $summary['gross_paid'];
                $remaining = $summary['due'];

                if ((float) $data['amount'] > $remaining) {
                    throw new \RuntimeException('مبلغ پرداختی از باقی‌مانده بل بیشتر است.');
                }
                if ($data['method'] === 'cash') {
                    $sa = new SHA();
                    $sa->credit($data['amount'], $invoice->sale->currency_id);
                }
                if ($invoice->payments()->count() === 0 && $paid > 0) {
                    $invoice->payments()->create([
                        'amount' => min($paid, (float) $invoice->total),
                        'method' => 'cash',
                        'paid_at' => $invoice->sale?->sold_at ?? now(),
                        'notes' => 'پرداخت اولیه قبلی',
                    ]);
                }
                $paymentID = max(Payment::max('id'), 0) + 1;
                $payment = $invoice->payments()->create([
                    'amount' => $data['amount'],
                    'method' => $data['method'],
                    'reference' => $data['reference'] ?? null,
                    'paid_at' => $data['paid_at'],
                    'notes' => $data['notes'] ?? null,
                    'currency_id' => $invoice->sale->currency_id,
                    'payment_number' => 'RCP-' . now()->format('Y') . '-' . str_pad((string) $paymentID, 6, '0', STR_PAD_LEFT),
                ]);

                $newPaid = $summary['gross_paid'] + (float) $data['amount'];
                $newNetPaid = max(0, $newPaid - $summary['refunded_amount']);
                $invoice->update([
                    'status' => $newNetPaid >= $summary['total'] ? 'paid' : 'partially_paid',
                    'paid_at' => $newNetPaid >= $summary['total'] ? $data['paid_at'] : null,
                ]);

                if ($invoice->sale) {
                    $invoice->sale->update(['amount_paid' => $newPaid]);
                }
                $admins = User::query()
                    ->with('role:id,name')
                    ->whereHas('role', fn($query) => $query->whereIn('name', ['admin', 'super_admin']))
                    ->get();
                Notification::send($admins, new PaymentCreated($payment));
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
                'receiptNumber' => $payment->payment_number ?? 'REC-' . $payment->id,
                'amount' => (float) $payment->amount,
                'method' => $payment->method,
                'reference' => $payment->reference,
                'paidAt' => Carbon::parse($payment->paid_at)->format('Y/m/d H:i'),
                'notes' => $payment->notes,
            ],
            'invoice' => [
                'id' => $invoice->id,
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

    public function invoicePayments(Invoice $invoice)
    {
        $invoice->load([
            'sale:id,total,discount_total,after_descount_total,sold_at',
            'payments:id,invoice_id,paid_at,amount,method,reference,notes,currency_id'
        ]);

        // dd($invoice);
        return Inertia::render('invoice/index', [
            'invoice' => [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'issued_on' => $invoice->issued_on,
                'status' => $invoice->status,
                'bill_to_name' => $invoice->bill_to_name,
                // 'status' => $invoice->status,
                'sold_at' => $invoice->sale->sold_at,
                'total' => $invoice->sale->total,
                'discount_total' => $invoice->sale->discount_total,
                'after_descount_total' => $invoice->sale->after_descount_total,
                'total_paid_amount' => $invoice->payments()->sum('amount'),
                'sale_id' => $invoice->sale->id,
                'payments' => $invoice->payments->map(fn(Payment $payment) => [
                    'id' => $payment->id,
                    'amount' => $payment->amount,
                    'paid_at' => $payment->paid_at,
                    'payment_number' => $payment->payment_number,
                    'method' => $payment->method,
                    'notes' => $payment->notes,
                ])->values(),
            ],
        ]);
    }

    public function allPayments()
    {
        // $now = Carbon::now(config('app.timezone'));
        // $threeMonthsAgo = $now->copy()->subMonth()->subMonth();
    
        $invoices = Invoice::query()
            ->with(['sale:id,amount_paid', 'payments:id,invoice_id,amount,method,reference,paid_at', 'sale.customer:id,name'])
            ->whereIn('status', ['issued', 'partially_paid', 'paid', 'over_due', 'refunded', 'partially_refunded'])    
            ->latest('issued_on')
            ->paginate(30);


        return Inertia::render('payments/allPayment', [
            'invoices' => $invoices->map(function (Invoice $invoice) {
                $paid = (float) $invoice->payments->sum('amount');
                if ($paid === 0.0 && $invoice->sale) {
                    $paid = (float) $invoice->sale->amount_paid;
                }
                $total = (float) $invoice->total;

                return [
                    'id' => $invoice->id,
                    'saleId' => $invoice->sale_id,
                    'invoice_number' => $invoice->invoice_number,
                    'customer' => $invoice->bill_to_name,
                    'phone' => $invoice->bill_to_phone,
                    'currency' => $invoice->currency,
                    'total' => $total,
                    'paid' => $paid,
                    'due' => max(0, $total - $paid),
                    'status' => $invoice->status,
                    'issued_on' => $invoice->issued_on ? Carbon::parse($invoice->issued_on)->format('Y/m/d') : '',
                    'payments' => $invoice->payments->map(fn(Payment $payment) => [
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
}
