<?php

namespace App\Http\Controllers;

use App\Custome\InvMovement;
use App\Custome\SHA;
use App\Models\Currency;
use App\Models\Customer;
use App\Models\InventoryBalance;
use App\Models\Invoice;
use App\Models\Item;
use App\Models\Location;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\SaleLine;
use App\Models\User;
use App\Notifications\CustomerHighDueAlert;
use App\Notifications\HighDiscountAlert;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Error;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class SaleController extends Controller
{
    public function index(Request $request)
    {

        $now = now();
        $monthStart = $now->copy()->startOfMonth();
        $requestedMonth = $request->period;
        if ($requestedMonth) {
            if ($requestedMonth == 'previous_month') {
                $monthStart = $now->copy()->startOfMonth()->subMonth();
            } else if ($requestedMonth == 'three_months_ago') {
                $monthStart = $now->copy()->startOfMonth()->subMonth();
                $monthStart = $monthStart->copy()->subMonth();
            }
        }

        $previousMonthStart = $monthStart->copy()->subMonth();
        $previousMonthEnd = $monthStart->copy()->subSecond();

        $sales = Sale::query()
            ->with(['customer:id,name', 'currency:id,name', 'saleLines.item:id,name,category_id,unit', 'saleLines.item.category:id,name', 'invoice:id,sale_id,invoice_number,status'])
            ->where(function ($query) use ($monthStart, $now) {
                $query->whereBetween('sold_at', [$monthStart, $now])
                    ->orWhereBetween('created_at', [$monthStart, $now]);
            })
            ->latest('sold_at')
            ->latest('created_at')
            ->get();

        $completedSales = $sales->where('status', 'completed');
        if ($request->expectsJson()) {
            //  get specified month from front and exeucte the logic accordingly
            // for month based sales
            $trend = $this->getTrend($monthStart, $completedSales);

            return response()->json([
                'trend' => $trend,
                'month' => $monthStart->translatedFormat('F Y'),
            ]);
        }
        $trend = $this->getTrend($monthStart, $completedSales);

        $previousMonthSales = Sale::query()
            ->whereBetween('sold_at', [$previousMonthStart, $previousMonthEnd])
            ->get();

        $previousRevenue = (float) $previousMonthSales->where('status', 'completed')->sum('after_descount_total');
        $revenue = (float) $completedSales->sum('after_descount_total');
        // $orderCount = $sales->count();
        $orderCount = Sale::query()->whereHas('invoice')->count();
        $previousOrderCount = $previousMonthSales->count();
        $activeCustomers = $completedSales->whereNotNull('customer_id')->pluck('customer_id')->unique()->count();
        $averageOrder = $completedSales->count() > 0 ? $revenue / $completedSales->count() : 0;

        $growth = static function (float $current, float $previous): float {
            return $previous > 0 ? round((($current - $previous) / $previous) * 100, 1) : ($current > 0 ? 100 : 0);
        };


        $topProducts = $completedSales->flatMap->saleLines
            ->groupBy('item_id')
            ->map(function ($lines) {
                $line = $lines->first();

                return [
                    'name' => $line->item?->name ?? 'بدون نام',
                    'category' => $line->item?->category?->name ?? 'بدون دسته‌بندی',
                    'sales' => round((float) $lines->sum('line_total'), 2),
                    'units' => round((float) $lines->sum('quantity'), 3),
                    'unit' => $line->item?->unit ?? 'unit',
                ];
            })->sortByDesc('sales')->values()->take(5)->values();

        // $registeredCustomerSales = $completedSales->whereNotNull('customer_id')->count();
        $registeredCustomerSales = Customer::where('is_active', 1)->count();
        $walkInSales = $completedSales->whereNull('customer_id')->count();
        $channelTotal = max($registeredCustomerSales + $walkInSales, 1);

        $channels = collect([
            ['name' => 'مشتری ثبت‌شده', 'value' => $registeredCustomerSales, 'color' => '#006fdf'],
            ['name' => 'فروش حضوری', 'value' => $walkInSales, 'color' => '#17b897'],
        ])->map(fn(array $channel) => [...$channel, 'percent' => round(($channel['value'] / $channelTotal) * 100, 1)])->values();

        $comments = $sales->filter(fn(Sale $sale) => filled($sale->notes))->take(10)->map(fn(Sale $sale) => [
            'saleID' => $sale->id,
            'name' => $sale->customer?->name ?? $sale->customer_name ?? 'یادداشت فروش',
            'text' => $sale->notes,
            'time' => Carbon::parse($sale->sold_at ?? $sale->created_at)->diffForHumans(),
        ])->take(6)->values();

        return Inertia::render('sale/index', [
            'stats' => [
                'revenue' => $revenue,
                'revenueGrowth' => $growth($revenue, $previousRevenue),
                'orders' => $orderCount,
                'ordersGrowth' => $growth($orderCount, $previousOrderCount),
                'averageOrder' => round($averageOrder, 2),
                'customers' => $activeCustomers,
                'currency' => $sales->first()?->currency?->name ?? 'AFN',
            ],
            'trend' => $trend,
            'channels' => $channels,
            'topProducts' => $topProducts,
            'orders' => $sales->take(8)->map(fn(Sale $sale) => [
                'saleId' => $sale->id,
                'id' => $sale->invoice?->invoice_number ?? '#SO-' . str_pad((string) $sale->id, 4, '0', STR_PAD_LEFT),
                'hasInvoice' => (bool) $sale->invoice,
                'customer' => $sale->customer?->name ?? $sale->customer_name ?? 'مشتری گذری',
                'date' => Carbon::parse($sale->sold_at ?? $sale->created_at)->diffForHumans(),
                'amount' => (float) ($sale->after_descount_total ?: $sale->total),
                'status' => $sale->status,
                'currency' => $sale->currency->name,
            ])->values(),
            'comments' => $comments,
            'meta' => [
                'month' => $monthStart->translatedFormat('F Y'),
                'currentRevenue' => $revenue,
                'previousRevenue' => $previousRevenue,
                'revenueGrowth' => $growth($revenue, $previousRevenue),
            ],
        ]);
    }

    public function create()
    {
        $locations = Location::query()->where('type', 'shop')->where('is_active', true)->orderBy('name')->get(['id', 'name', 'address']);
        $items = Item::query()
            ->with(['product:item_id,barcode,weight,per_pack', 'category:id,name', 'inventoryBalances:id,item_id,location_id,quantity_on_hand,reserved'])
            ->whereHas('inventoryBalances', fn($query) => $query->whereIn('location_id', $locations->pluck('id'))->where('quantity_on_hand', '>', 0))
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'sku', 'unit', 'default_sale_price', 'category_id']);

        $nextInvoiceID = Invoice::query()->orderBy('id', 'desc')->value('id') + 1;

        return Inertia::render('sale/create', [
            'items' => $items,
            'customers' => Customer::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'phone']),
            'currencies' => Currency::query()->orderBy('id')->get(['id', 'name']),
            'locations' => $locations,
            'nextInvoiceID' => $nextInvoiceID,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'customer_id' => $request->input('customer_id') ?: null,
        ]);

        $data = $request->validate([

            // LOCATION AND CUSTOMER VALIDATION
            'location_id' => ['required', 'exists:locations,id'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'customer_name' => ['nullable', 'string', 'max:50'],
            'currency_id' => ['required', 'exists:currencies,id'],
            'sold_at' => ['required', 'date'],

            // PAYMENT VALIDATION
            'discount_total' => ['nullable', 'numeric', 'min:0'],
            'amount_paid' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'create_invoice' => ['nullable', 'boolean'],

            // SALELINE VALIDATATION 
            'saleLines' => ['required', 'array', 'min:1'],
            'saleLines.*.item_id' => ['required', 'exists:items,id'],
            'saleLines.*.quantity' => ['required', 'numeric', 'gt:0'],
            'saleLines.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $location = Location::query()->where('type', 'shop')->where('is_active', true)->findOrFail($data['location_id']);

        try {
            $sale = DB::transaction(function () use ($data, $location, $request): Sale {
                $lineData = collect($data['saleLines'])->map(function (array $line) use ($location) {
                    $item = Item::query()->findOrFail($line['item_id']);
                    $balance = InventoryBalance::query()->where('location_id', $location->id)->where('item_id', $item->id)->lockForUpdate()->first();
                    $available = (float) ($balance?->quantity_on_hand ?? 0) - (float) ($balance?->reserved ?? 0);

                    if ($available < (float) $line['quantity']) {
                        throw new \RuntimeException("موجودی {$item->name} کافی نیست. موجودی قابل فروش: {$available}");
                    }

                    $lineTotal = (float) $line['quantity'] * (float) $line['unit_price'];

                    return ['item' => $item, 'quantity' => (float) $line['quantity'], 'unit_price' => (float) $line['unit_price'], 'line_total' => $lineTotal, 'balance' => $balance];
                });

                $total = (float) $lineData->sum('line_total');
                $discount = (float) ($data['discount_total'] ?? 0);
                $afterDiscount = max(0, $total - $discount);
                $amountPaid = min((float) ($data['amount_paid'] ?? 0), $afterDiscount);

                $sale = Sale::query()->create([
                    'customer_id' => $data['customer_id'] ?? null,
                    'customer_name' => $data['customer_name'] ?? null,
                    'currency_id' => $data['currency_id'],
                    'created_by' => $request->user()?->id,
                    'status' => 'completed',
                    'total' => $total,
                    'discount_total' => $discount,
                    'after_descount_total' => $afterDiscount,
                    'amount_paid' => $amountPaid,
                    'sold_at' => $data['sold_at'],
                    'notes' => $data['notes'] ?? null,
                ]);

                // Alert admin if customer due increases 300000
                if ($data['customer_id']) {
                    $this->AlertAdminIfCustomerDueExceedsLimit($request, Customer::findOrFail($data['customer_id']), Currency::findOrFail($data['currency_id']));
                }
                $totalSaleQuantities = 0;
                foreach ($data['saleLines'] as $line) {
                    $totalSaleQuantities += $line['quantity'];
                }

                foreach ($lineData as $line) {
                    SaleLine::query()->create([
                        'sale_id' => $sale->id,
                        'item_id' => $line['item']->id,
                        'unit' => $line['item']->unit,
                        'quantity' => $line['quantity'],
                        'unit_cost' => $line['item']->default_sale_price,
                        'unit_price' => $line['unit_price'],
                        'discount' => $this->getDiscountForEachItemAndAmount($line, $totalSaleQuantities, $total, $afterDiscount)[0],
                        'discount_total' => $this->getDiscountForEachItemAndAmount($line, $totalSaleQuantities, $total, $afterDiscount)[1],
                        'line_total' => $line['line_total'],
                    ]);
                    $invMove = new InvMovement;
                    $invMove->move($location->id, $line['item']->id, $line['quantity'], 'sale', $data['notes'] ?? 'فروش ثبت شد', '-');
                }
                $sa = new SHA;
                $sa->credit($afterDiscount, $data['currency_id']);

                if ($amountPaid < $afterDiscount || $data['customer_id'] != null) {
                    $this->createInvoice($sale);
                }
                $this->ensureDiscountIsEnough($sale);
                // throw new Error('not added');
                return $sale;
            });
            Inertia::flash('toast', ['type' => 'success', 'message' => 'فروشات تکمیل شد']);


            if ($request->boolean('create_invoice')) {
                $this->createInvoiceForSale($sale);
            }

            if ($request->boolean('create_invoice')) {
                return redirect()->route('sales.invoice.print', $sale);
            }

            return redirect()->route('sales.index')->with('success', 'فروش با موفقیت ثبت شد.');
        } catch (\Throwable $exception) {
            report($exception);
            Inertia::flash('toast', ['type' => 'error', 'message' => $exception->getMessage()]);

            return back()->withErrors(['saleLines' => $exception->getMessage()])->withInput();
        }
    }

    private function getDiscountForEachItemAndAmount(array $item, float $saleQuantities, float $total, float $discountTotal): array
    {
        if ($saleQuantities <= 0 || $total <= 0) {
            return [0.0, (float) ($item['line_total'] ?? 0)];
        }

        $overallDiscountPercent = ($discountTotal * 100) / $total;
        $itemShare = (float) ($item['quantity'] / $saleQuantities);
        $itemDiscountPercent = $itemShare * $overallDiscountPercent;
        $itemDiscountAmount = ($item['line_total'] * $itemDiscountPercent) / 100;
        $afterItemDiscount = max(0, $item['line_total'] - $itemDiscountAmount);

        return [(float) $itemDiscountPercent, (float) $afterItemDiscount];
    }

    private function ensureDiscountIsEnough(Sale $sale)
    {
        $total = $sale->total;
        $discountTotal = $sale->discount_total;
        $discount = ($discountTotal * 100) / $total;
        if ($discount > 10) {
            $admins = User::query()->with('role')->whereHas('role', function ($query) {
                $query->whereIn('name', ['admin', 'super_admin']);
            })->get();
            foreach ($admins as $user) {
                $user->notify(new HighDiscountAlert($sale));
            }
        }
    }

    public function createInvoice(Sale $sale): RedirectResponse
    {
        $this->createInvoiceForSale($sale);

        return redirect()->route('sales.invoice.print', $sale);
    }

    public function printInvoice(Sale $sale)
    {
        $sale->load(['customer:id,name,phone,address', 'currency:id,name', 'saleLines.item:id,name,unit,code', 'invoice']);

        abort_unless($sale->invoice, 404);

        return Inertia::render('sale/invoice', [
            'sale' => [
                'id' => $sale->id,
                'discount' => $sale->discount_total,
                'customer' => $sale->customer?->name ?? $sale->customer_name ?? 'مشتری گذری',
                'phone' => $sale->customer?->phone,
                'address' => $sale->customer?->address,
                'soldAt' => Carbon::parse($sale->sold_at ?? $sale->created_at)->format('Y/m/d H:i'),
                'amount_paid' => $sale->amount_paid,
                'lines' => $sale->saleLines->map(fn($line) => [
                    'name' => $line->item?->name ?? 'جنس حذف‌شده',
                    'code' => $line->item?->code ?? 'کود ندادرد',
                    'unit' => $line->unit,
                    'quantity' => (float) $line->quantity,
                    'unitPrice' => (float) $line->unit_price,
                    'total' => (float) $line->line_total,
                ])->values(),
            ],
            'invoice' => [
                'number' => $sale->invoice->invoice_number,
                'issuedOn' => $sale->invoice->issued_on ? Carbon::parse($sale->invoice->issued_on)->format('Y/m/d H:i:s') : '',
                'status' => $sale->invoice->status,
                'currency' => $sale->invoice->currency,
                'subtotal' => (float) $sale->invoice->subtotal,
                'discount' => (float) $sale->invoice->discount_total,
                'total' => (float) $sale->invoice->total,
                'notes' => $sale->invoice->notes,
            ],
        ]);
    }

    private function createInvoiceForSale(Sale $sale): Invoice
    {
        $sale->loadMissing(['customer', 'currency']);

        if ($sale->invoice) {
            return $sale->invoice;
        }

        $subtotal = (float) $sale->total;
        $total = (float) ($sale->after_descount_total ?: $sale->total);

        $paidAmount = (float) $sale->amount_paid;
        $invoiceID = Invoice::query()->orderBy('id', 'desc')->value('id');
        $invoice = Invoice::create([
            'sale_id' => $sale->id,
            'invoice_number' => 'INV-' . now()->format('Y') . '-' . str_pad((string) $invoiceID, 6, '0', STR_PAD_LEFT),
            'status' => $paidAmount >= $total ? 'paid' : ($paidAmount > 0 ? 'partially_paid' : 'issued'),
            'issued_on' => now(),
            'paid_at' => $paidAmount >= $total ? now() : null,
            'bill_to_name' => $sale->customer?->name ?? $sale->customer_name ?? 'مشتری گذری',
            'bill_to_phone' => $sale->customer?->phone ? substr($sale->customer->phone, 0, 10) : null,
            'bill_to_address' => $sale->customer?->address,
            'currency' => $sale->currency?->name ?? 'AFG',
            'subtotal' => $subtotal,
            'discount_total' => (float) $sale->discount_total,
            'total' => $total,
            'notes' => $sale->notes,
        ]);

        if ($paidAmount > 0) {
            Payment::create([
                'invoice_id' => $invoice->id,
                'amount' => min($paidAmount, $total),
                'method' => 'cash',
                'currency_id' => $sale->currency_id,
                'paid_at' => $sale->sold_at ?? now(),
                'notes' => 'پرداخت اولیه هنگام ثبت فروش',
            ]);
        }

        return $invoice;
    }

    public function getTrend(CarbonInterface $monthStart, mixed $completedSales)
    {
        $now = now();
        $endOfMonth = $monthStart->copy()->month == $now->month ? $now->copy() : $monthStart->copy()->endOfMonth();
        return collect(range(0, $endOfMonth->daysInMonth - 1))->map(function (int $day) use ($monthStart, $completedSales) {
            $date = $monthStart->copy()->addDays($day);
            $daySales = $completedSales->filter(function (Sale $sale) use ($date) {
                return Carbon::parse($sale->sold_at ?? $sale->created_at)->isSameDay($date);
            });

            return ['day' => $date->day, 'sales' => round((float) $daySales->sum('after_descount_total'), 2)];
        })->filter(fn(array $item) => $item['day'] <= $endOfMonth->day)->values();
    }

    public function mostSold(Request $request)
    {
        $period = $request->input('period', 'monthly');
        $data = $request->validate([
            'period' => ['sometimes', 'in:daily,monthly'],
            'date' => ['sometimes', 'date_format:' . ($period === 'daily' ? 'Y-m-d' : 'Y-m')],
        ]);
        $period = $data['period'] ?? 'monthly';
        $date = $data['date'] ?? Carbon::now(config('app.timezone'))->format('Y-m');
        $start = Carbon::createFromFormat($period === 'monthly' ? 'Y-m' : 'Y-m-d', $date, config('app.timezone'))->startOf($period === 'monthly' ? 'month' : 'day');
        $end = $start->copy()->endOf($period === 'monthly' ? 'month' : 'day');

        $sales = Sale::query()
            ->with(['customer:id,name', 'currency:id,name', 'saleLines.item:id,name,category_id,unit', 'saleLines.item.category:id,name', 'invoice:id,sale_id,invoice_number,status'])
            ->where(function ($query) use ($start, $end) {
                $query->whereBetween('sold_at', [$start, $end])
                    ->orWhere(function ($fallback) use ($start, $end) {
                        $fallback->whereNull('sold_at')->whereBetween('created_at', [$start, $end]);
                    });
            })
            ->latest('sold_at')
            ->latest('created_at')
            ->get();

        $completedSales = $sales->where('status', 'completed');
        $topProducts = $completedSales->flatMap->saleLines
            ->groupBy('item_id')
            ->map(function ($lines) {
                $line = $lines->first();

                return [
                    'name' => $line->item?->name ?? 'بدون نام',
                    'category' => $line->item?->category?->name ?? 'بدون دسته‌بندی',
                    'sales' => round((float) $lines->sum('line_total'), 2),
                    'units' => round((float) $lines->sum('quantity'), 3),
                    'unit' => $line->item?->unit ?? 'unit',
                ];
            })->sortByDesc('sales')->values()->values();
        return Inertia::render('sale/top-product', [
            'topProducts' => $topProducts,
            'filters' => [
                'period' => $period,
                'date' => $date,
            ],
        ]);
    }

    public function destroyNote(Sale $sale)
    {
        $sale->notes = '';
        $sale->save();
        return redirect()->back();
    }

    public function comment()
    {
        $sales = Sale::query()
            ->with('customer:id,name')
            ->latest('sold_at')
            ->latest('created_at')
            ->get();
        $comments = $sales->filter(fn(Sale $sale) => filled($sale->notes))->take(10)->map(fn(Sale $sale) => [
            'saleID' => $sale->id,
            'name' => $sale->customer?->name ?? $sale->customer_name ?? 'یادداشت فروش',
            'text' => $sale->notes,
            'time' => Carbon::parse($sale->sold_at ?? $sale->created_at)->diffForHumans(),
        ])->values();

        return Inertia::render('sale/comments', [
            'comments' => $comments,
        ]);
    }

    public function customerOwe(Request $request, Customer $customer, Currency $currency): float|JsonResponse
    {
        if (!$customer || !$currency)
            return 0;
        $customer->load(['sales:id,customer_id,after_descount_total', 'sales.invoice:id,sale_id', 'sales.invoice.payments:id,invoice_id,amount']);
        $totalPayments = $customer->sales->sum(
            fn($sale) => $sale->invoice?->payments()->where('currency_id', $currency->id)->sum('amount')
        );
        $totalOwes = $customer->sales()
            ->where('currency_id', $currency->id)
            ->whereNotIn('status', ['returned', 'partially_refunded'])
            ->sum('after_descount_total');

        $balance = $totalOwes - $totalPayments;

        if ($request->expectsJson())
            return response()->json($balance);
        return $balance;
    }

    private function AlertAdminIfCustomerDueExceedsLimit(Request $request, Customer $customer, Currency $currency)
    {
        if (!$customer || !$currency) {
            throw new Error('مشکل در مشتری یا واحد پول در وجود امد. لطفا دوباره چک کنید');
        }

        $balance = $this->customerOwe($request, $customer, $currency);
        if ($currency->name == 'AFG') {
            $possibleAFGDue = 300000;

            if ($balance > $possibleAFGDue) {
                $admins = User::query()->with('role:id,name')->whereHas('role', function ($query) {
                    $query->whereIn('name', ['admin', 'super_admin']);
                })->get();
                Notification::send($admins, new CustomerHighDueAlert($customer));
            }
        } else if ($currency->name == 'PKR') {
            $possiblePKRDue = 500000;
            if ($balance > $possiblePKRDue) {
                $admins = User::query()->with('role:id,name')->whereHas('role', function ($query) {
                    $query->whereIn('name', ['admin', 'super_admin']);
                })->get();
                Notification::send($admins, new CustomerHighDueAlert($customer));
            }
        } else if ($currency->name == 'USD') {
            $possibleUSDDue = 1000;
            if ($balance > $possibleUSDDue) {
                $admins = User::query()->with('role:id,name')->whereHas('role', function ($query) {
                    $query->whereIn('name', ['admin', 'super_admin']);
                })->get();
                Notification::send($admins, new CustomerHighDueAlert($customer));
            }
        }
    }

    public function allSales()
    {
        $now = Carbon::now(config('app.timezone'));
        // 3 months old record
        $fromDate = $now->copy()->subMonth()->subMonth()->subMonth();
        $sales = Sale::query()
            ->with(['customer:id,name', 'currency:id,name', 'saleLines.item:id,name,category_id,unit', 'saleLines.item.category:id,name', 'invoice:id,sale_id,invoice_number,status'])
            ->where(function ($query) use ($fromDate, $now) {
                $query->whereBetween('sold_at', [$fromDate, $now])
                    ->orWhereBetween('created_at', [$fromDate, $now]);
            })
            ->latest('sold_at')
            ->latest('created_at')
            ->get();
        return Inertia::render('sale/allSale', [
            'orders' => $sales->map(fn(Sale $sale) => [
                'saleId' => $sale->id,
                'id' => $sale->invoice?->invoice_number ?? '#SO-' . str_pad((string) $sale->id, 4, '0', STR_PAD_LEFT),
                'invoice_id' => $sale->invoice?->id,
                'hasInvoice' => (bool) $sale->invoice,
                'customer' => $sale->customer?->name ?? $sale->customer_name ?? 'مشتری گذری',
                'date' => Carbon::parse($sale->sold_at ?? $sale->created_at)->diffForHumans(),
                'amount' => (float) ($sale->after_descount_total ?: $sale->total),
                'status' => $sale->status,
                'currency' => $sale->currency->name,
            ])->values(),
        ]);
    }
}
