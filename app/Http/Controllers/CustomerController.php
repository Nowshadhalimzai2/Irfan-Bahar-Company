<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function create()
    {
        Gate::authorize('manage-users');
        return Inertia::render('customer/create');
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-users');
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'nick_name' => 'nullable|string|max:255',
            'phone' => 'string|max:10|starts_with:07',
            'address' => 'string|max:500',
            'email' => 'nullable|email|max:255',
        ]);
        return DB::transaction(function () use ($data) {
            $customer = Customer::create($data);
            $log = new Log();
            $description = "مشتری جدید به نام {$customer->name} ایجاد شد";
            $log->create('insert', $description, null, "/customers/{$customer->id}");

            // NOTIFY EACH USER 
            $users = User::with('role:id,name')->whereHas('role', function ($q) {
                $q->where('name', 'admin')
                    ->orWhere('name', 'super_admin')
                    ->orWhere('name', 'shop_clerk')
                ;
            })->get();
            foreach ($users as $user) {
                $user->notify(new \App\Notifications\CustomerCreated($customer));
            }

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => $description,
            ]);
            return redirect()->to(route('employees.index'));
        }, 3);
    }

    public function show(Customer $customer)
    {
        $customer->load([
            'sales' => fn($query) => $query->latest('sold_at'),
            'sales.currency',
            'sales.invoice.sale',
            'sales.invoice.sale.saleReturns',
            'sales.invoice.payments' => fn($query) => $query->latest('paid_at'),
            'sales.saleReturns'
        ]);

        return Inertia::render('customer/show', [
            'customer' => $customer,
            'sales' => $customer->sales,
            'invoices' => $customer->sales()
                ->where(function ($q) {
                    $q->where('status', '!=', 'cancelled');
                })->get()
                ->pluck('invoice')
                ->filter()
                // ->take(4)
                ->map(function (Invoice $invoice) {
                    $summary = $invoice->financialSummary();

                    return [
                        'id' => $invoice->id,
                        'saleId' => $invoice->sale_id,
                        'invoice_number' => $invoice->invoice_number,
                        'number' => $invoice->invoice_number,
                        'customer' => $invoice->bill_to_name,
                        'phone' => $invoice->bill_to_phone,
                        'currency' => $invoice->currency,
                        ...$summary,
                        'status' => $invoice->status,
                        'issuedOn' => $invoice->issued_on ? Carbon::parse($invoice->issued_on)->format('Y/m/d') : '',
                        'dueOn' => $invoice->due_on ? Carbon::parse($invoice->due_on)->format('Y/m/d') : null,
                        'latest_payment' => $invoice->payments->first() ? [
                            'id' => $invoice->payments->first()->id,
                            'amount' => (float) $invoice->payments->first()->amount,
                            'method' => $invoice->payments->first()->method,
                            'reference' => $invoice->payments->first()->reference,
                            'paidAt' => Carbon::parse($invoice->payments->first()->paid_at)->toISOString(),
                        ] : null,
                        'payments' => $invoice->payments->map(fn(Payment $payment) => [
                            'id' => $payment->id,
                            'amount' => (float) $payment->amount,
                            'method' => $payment->method,
                            'reference' => $payment->reference,
                            'paidAt' => Carbon::parse($payment->paid_at)->toISOString(),
                        ])->values(),
                    ];
                })
                ->values(),
        ]);
    }
    public function edit(Customer $customer)
    {

        return Inertia::render('customer/edit', compact('customer'));
    }

    public function update(Request $request, Customer $customer)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'nick_name' => 'nullable|string|max:255',
            'phone' => 'string|max:10|starts_with:07',
            'address' => 'string|max:500',
            'email' => 'nullable|email|max:255',
        ]);

        return DB::transaction(function () use ($data, $customer) {
            $customer->update($data);
            $log = new Log();
            $description = "مشتری به نام {$data['name']} ویرایش شد";
            $log->create('insert', $description, $customer->name, "/customers/{$customer->id}");

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => $description,
            ]);
            return redirect()->to(route('customers.show', $customer->id));
        }, 3);
    }

    public function invoices(Customer $customer)
    {

        $customer->load('sales:id,status,after_descount_total,amount_paid,sold_at,currency_id', 'sales.currency:id,name');
        $customer->load('sales.invoice:id,sale_id,invoice_number,issued_on', 'sales.saleReturns:id,sale_id,total,refund_amount');
        $customer->load('sales.invoice.payments:id,invoice_id,amount,method,reference,notes,paid_at,payment_number,currency_id', 'sales.invoice.payments.currency:id,name');
        $orders = $customer->sales()->orderBy('id', 'desc')->get();
        return Inertia::render('customer/invoice', [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'joined' => $customer->created_at,
            ],
            'orders' => $orders->map(function (Sale $order) {
                return [
                    'id' => $order->id,
                    'status' => $order->status,
                    'invoice' => [
                        'id' => $order->invoice->id,
                        'invoice_number' => $order->invoice->invoice_number,
                        'status' => $order->invoice->status,
                        'customer' => $order->invoice->bill_to_name ?? 'walk-in',
                        'total' => $order->invoice->total,
                        'issued_on' => $order->invoice->issued_on,
                        'currency' => $order->invoice->currency,
                        'due' => $order->after_descount_total - $order->saleReturns->sum(fn(SaleReturn $return) => $return->total) - $order->invoice->payments->sum('amount'),
                        'paid' => $order->invoice->payments->sum('amount') ?? 0,
                    ],
                    'sold_at' => $order->sold_at,
                    'subTotal' => $order->total,
                    'grandTotal' => $order->after_descount_total,
                    'returnTotal' => $order->saleReturns->sum(fn(SaleReturn $return) => $return->total),
                    'refundTotal' => $order->saleReturns->sum(fn(SaleReturn $return) => $return->refund_amount),
                    'currency' => ['id' => $order->currency->id, 'name' => $order->currency->name],
                    'payments' => $order->invoice->payments->map(fn(Payment $payment) => [
                        'id' => $payment->id,
                        'amount' => $payment->amount,
                        'reference' => $payment->reference ?? '',
                        'notes' => $payment->notes ?? '',
                        'paid_at' => $payment->paid_at,
                        'method' => $payment->method ?? 'cash',
                        'number' => $payment->payment_number ?? 'PMT' . $payment->id,
                        'currency' => ['id' => $payment->currency->id, 'name' => $payment->currency->name]
                    ]),
                ];
            }),
        ]);
    }
    public function status(Customer $customer)
    {
        return DB::transaction(function () use ($customer) {
            $customer->is_active = !$customer->is_active;
            $customer->save();
            $des = "اکونت {$customer->name} " . (!$customer->is_active ? 'بلاک شد' : 'خارج از بلاک لیست شد');
            (new Log())->create('update', $des, $customer->name, route('customers.show', $customer->id));
            Inertia::flash('toast', ['type' => "success", 'message' => $des]);
            return redirect()->back();
        }, 3);
    }
}
