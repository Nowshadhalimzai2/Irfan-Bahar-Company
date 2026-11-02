<?php

namespace App\Http\Controllers;

use App\Custome\InvMovement;
use App\Custome\Log;
use App\Custome\SHA;
use App\Models\Currency;
use App\Models\Customer;
use App\Models\InventoryBalance;
use App\Models\Invoice;
use App\Models\Item;
use App\Models\ItemUnit;
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
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Morilog\Jalali\Jalalian;

class SaleController extends Controller
{
    public function index(Request $request)
    {

        $now = now();
        $selectedPeriod = $this->resolveMonthRange($now, $request->period ?? 'this_month');
        $monthStart = $selectedPeriod['start'];
        $periodEnd = $selectedPeriod['end'];

        $previousPeriod = $this->resolveMonthRange($now, 'previous_month');
        $previousMonthStart = $previousPeriod['start'];
        $previousMonthEnd = $previousPeriod['end'];

        $sales = Sale::query()
            ->with(['customer:id,name', 'currency:id,name', 'saleLines.item:id,name,category_id,unit', 'saleLines.item.category:id,name', 'invoice:id,sale_id,invoice_number,status'])
            ->where(function ($query) use ($monthStart, $periodEnd) {
                $query->whereBetween('sold_at', [$monthStart, $periodEnd])
                    ->orWhereBetween('created_at', [$monthStart, $periodEnd]);
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
                'month' => Jalalian::fromCarbon($monthStart)->format('Y/m'),
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
                    'units' => round((float) $lines->sum(fn (SaleLine $saleLine) => $saleLine->base_quantity ?? $saleLine->quantity), 3),
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
        ])->map(fn (array $channel) => [...$channel, 'percent' => round(($channel['value'] / $channelTotal) * 100, 1)])->values();

        $comments = $sales->filter(fn (Sale $sale) => filled($sale->notes))->take(10)->map(fn (Sale $sale) => [
            'saleID' => $sale->id,
            'name' => $sale->customer?->name ?? $sale->customer_name ?? 'یادداشت فروش',
            'text' => $sale->notes,
            'time' => Carbon::parse($sale->sold_at ?? $sale->created_at)->locale('fa')->diffForHumans(),
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
            'orders' => $sales->take(8)->map(fn (Sale $sale) => [
                'saleId' => $sale->id,
                'id' => $sale->invoice?->invoice_number ?? '#SO-'.str_pad((string) $sale->id, 4, '0', STR_PAD_LEFT),
                'hasInvoice' => (bool) $sale->invoice,
                'customer' => $sale->customer?->name ?? $sale->customer_name ?? 'مشتری گذری',
                'date' => Carbon::parse($sale->sold_at ?? $sale->created_at)->locale('fa')->diffForHumans(),
                'amount' => (float) ($sale->after_descount_total ?: $sale->total),
                'status' => $sale->status,
                'currency' => $sale->currency->name,
            ])->values(),
            'comments' => $comments,
            'meta' => [
                'month' => Jalalian::fromCarbon($monthStart)->format('Y/m'),
                'currentRevenue' => $revenue,
                'previousRevenue' => $previousRevenue,
                'revenueGrowth' => $growth($revenue, $previousRevenue),
            ],
        ]);
    }

    private function resolveMonthRange(CarbonInterface $now, ?string $requestedPeriod): array
    {
        $baseJalali = Jalalian::fromCarbon(Carbon::instance($now));

        $selectedJalali = match ($requestedPeriod) {
            'previous_month' => Jalalian::fromCarbon(Carbon::instance($now))->subMonths(1),
            'three_months_ago' => Jalalian::fromCarbon(Carbon::instance($now))->subMonths(3),
            default => Jalalian::fromCarbon(Carbon::instance($now)),
        };

        $monthStart = Jalalian::fromFormat(
            'Y/m/d',
            sprintf('%04d/%02d/01', $selectedJalali->getYear(), $selectedJalali->getMonth()),
            new \DateTimeZone(config('app.timezone')),
        )->toCarbon()->startOfDay();

        $currentJalaliMonth = $baseJalali->format('Y/m');
        $selectedMonthKey = $selectedJalali->format('Y/m');
        $end = $selectedMonthKey === $currentJalaliMonth
            ? Carbon::instance($now)->endOfDay()
            : $selectedJalali->addMonths(1)->subDay()->toCarbon()->endOfDay();

        return ['start' => $monthStart, 'end' => $end];
    }

    public function create()
    {
        $auth = Auth::user();
        Gate::allowIf(($auth instanceof User && $auth->hasRole('shop_clerk')), 'صلاحیت این صفحه ندارین!', 403);

        $locations = Location::query()->where('type', 'shop')->where('is_active', true)->orderBy('name')->get(['id', 'name', 'address']);
        $items = Item::query()
            ->with([
                'units' => fn ($query) => $query
                    ->select('id', 'item_id', 'name', 'symbol', 'conversion_to_base', 'code', 'barcode', 'selling_price', 'purchase_price', 'is_active')
                    ->where('is_active', true)
                    ->orderBy('id'),
                'baseUnit:id,item_id,name,symbol,conversion_to_base,code,barcode,selling_price,purchase_price,is_active',
                'category:id,name',
                'inventoryBalances:id,item_id,location_id,quantity_on_hand,reserved',
            ])
            ->whereHas('inventoryBalances', fn ($query) => $query->whereIn('location_id', $locations->pluck('id'))->where('quantity_on_hand', '>', 0))
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'sku', 'unit', 'default_sale_price', 'category_id', 'base_unit_id']);

        $nextInvoiceID = (int) Invoice::query()->max('id') + 1;

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
        $auth = Auth::user();
        Gate::allowIf(($auth instanceof User && $auth->hasRole('shop_clerk')), 'صلاحیت این صفحه ندارین!', 403);
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
            'discount_total' => ['nullable', 'numeric', 'decimal:0,2', 'min:0'],
            'amount_paid' => ['nullable', 'numeric', 'decimal:0,2', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'create_invoice' => ['nullable', 'boolean'],

            // SALELINE VALIDATATION
            'saleLines' => ['required', 'array', 'min:1', 'max:12'],
            'saleLines.*.item_id' => ['required', 'exists:items,id'],
            'saleLines.*.item_unit_id' => ['required', 'exists:item_units,id', 'distinct'],
            'saleLines.*.quantity' => ['required', 'numeric', 'decimal:0,3', 'gt:0'],
            'saleLines.*.unit_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $units = ItemUnit::query()
            ->whereIn('id', collect($data['saleLines'])->pluck('item_unit_id'))
            ->where('is_active', true)
            ->get(['id', 'item_id', 'name', 'conversion_to_base', 'selling_price', 'purchase_price'])
            ->keyBy('id');

        foreach ($data['saleLines'] as $index => $line) {
            $unit = $units->get((int) $line['item_unit_id']);

            if (! $unit || (int) $unit->item_id !== (int) $line['item_id']) {
                throw ValidationException::withMessages([
                    "saleLines.{$index}.item_unit_id" => 'واحد انتخاب‌شده به این جنس مربوط نیست.',
                ]);
            }

            if ((float) $unit->conversion_to_base <= 0) {
                throw ValidationException::withMessages([
                    "saleLines.{$index}.item_unit_id" => 'ضریب تبدیل این واحد نامعتبر است.',
                ]);
            }
        }

        $location = Location::query()->where('type', 'shop')->where('is_active', true)->findOrFail($data['location_id']);

        try {
            $sale = DB::transaction(function () use ($data, $location, $request, $units): Sale {
                $lineData = collect($data['saleLines'])->map(function (array $line, int $index) use ($units) {
                    $item = Item::query()->findOrFail($line['item_id']);
                    $unit = $units->get((int) $line['item_unit_id']);
                    $quantity = (float) $line['quantity'];
                    $conversionFactor = (float) $unit->conversion_to_base;
                    $baseQuantity = round($quantity * $conversionFactor, 3);
                    if ($baseQuantity <= 0) {
                        throw ValidationException::withMessages([
                            "saleLines.{$index}.quantity" => 'مقدار فروش برای این واحد از دقت موجودی کمتر است.',
                        ]);
                    }

                    $unitPrice = (float) $unit->selling_price;

                    return [
                        'item' => $item,
                        'unit' => $unit,
                        'quantity' => $quantity,
                        'conversion_factor' => $conversionFactor,
                        'base_quantity' => $baseQuantity,
                        'unit_price' => $unitPrice,
                        'unit_cost' => (float) ($unit->purchase_price ?? 0),
                        'line_total' => round($quantity * $unitPrice, 2),
                    ];
                });

                $requiredBaseQuantities = $lineData->groupBy(fn (array $line) => $line['item']->id)
                    ->map(fn ($lines) => round($lines->sum('base_quantity'), 3));

                foreach ($requiredBaseQuantities as $itemId => $requiredBaseQuantity) {
                    $balance = InventoryBalance::query()
                        ->where('location_id', $location->id)
                        ->where('item_id', $itemId)
                        ->lockForUpdate()
                        ->first();
                    $available = (float) ($balance?->quantity_on_hand ?? 0) - (float) ($balance?->reserved ?? 0);

                    if ($available < $requiredBaseQuantity) {
                        $itemName = $lineData->first(fn (array $line) => $line['item']->id === (int) $itemId)['item']->name;
                        throw new \RuntimeException("موجودی {$itemName} کافی نیست. موجودی قابل فروش: {$available}");
                    }
                }

                $total = round((float) $lineData->sum('line_total'), 2);
                $discount = round((float) ($data['discount_total'] ?? 0), 2);

                if ($discount > $total) {
                    throw ValidationException::withMessages([
                        'discount_total' => 'تخفیف نمی‌تواند از مجموع فروش بیشتر باشد.',
                    ]);
                }

                $afterDiscount = round($total - $discount, 2);
                $amountPaid = round((float) ($data['amount_paid'] ?? 0), 2);
                if ($amountPaid > $afterDiscount) {
                    throw ValidationException::withMessages([
                        'amount_paid' => 'مبلغ پرداخت‌شده نمی‌تواند از مبلغ قابل پرداخت بیشتر باشد.',
                    ]);
                }

                $lineCount = $lineData->count();
                $lineDiscountPercent = $total > 0 ? ($discount / $total) * 100 : 0;
                $allocatedDiscount = 0.0;
                $lineData = $lineData->values()->map(function (array $line, int $index) use ($discount, $total, $lineCount, $lineDiscountPercent, &$allocatedDiscount): array {
                    $lineDiscount = $index === $lineCount - 1
                        ? round($discount - $allocatedDiscount, 2)
                        : ($total > 0 ? round($line['line_total'] * $discount / $total, 2) : 0.0);
                    $allocatedDiscount += $lineDiscount;

                    return [
                        ...$line,
                        'discount_percent' => $lineDiscountPercent,
                        'discount_total' => $lineDiscount,
                    ];
                });

                $sale = Sale::query()->create([
                    'customer_id' => $data['customer_id'] ?? null,
                    'customer_name' => $data['customer_name'] ?? null,
                    'currency_id' => $data['currency_id'],
                    'location_id' => $location->id,
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
                foreach ($lineData as $line) {
                    SaleLine::query()->create([
                        'sale_id' => $sale->id,
                        'item_id' => $line['item']->id,
                        'item_unit_id' => $line['unit']->id,
                        'unit' => $line['item']->unit,
                        'quantity' => $line['quantity'],
                        'conversion_factor' => $line['conversion_factor'],
                        'base_quantity' => $line['base_quantity'],
                        'unit_cost' => $line['unit_cost'],
                        'unit_price' => $line['unit_price'],
                        'discount' => $line['discount_percent'],
                        'discount_total' => $line['discount_total'],
                        'line_total' => $line['line_total'],
                    ]);
                    $invMove = new InvMovement;
                    $invMove->move($location->id, $line['item']->id, $line['base_quantity'], 'sale', $data['notes'] ?? 'فروش ثبت شد', '-');
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

            return redirect()->route('sales.create')->with('success', 'فروش با موفقیت ثبت شد.');
        } catch (\Throwable $exception) {
            if ($exception instanceof ValidationException) {
                throw $exception;
            }

            report($exception);
            Inertia::flash('toast', ['type' => 'error', 'message' => $exception->getMessage()]);

            return back()->withErrors(['saleLines' => $exception->getMessage()])->withInput();
        }
    }

    public function cancelSale(Sale $sale)
    {
        $user = Auth::user();
        if ($user instanceof User) {
            Gate::allowIf(! $user->hasRole('factory_clerk'));
        }

        try {
            if ($sale->status === 'cancelled') {
                throw new Error('این جنس قبلا لغوه شده است');
            }
            $sale->load('location:id,name,type', 'invoice:id,sale_id,invoice_number', 'invoice.payments:id,invoice_id,amount');
            $sale->load('saleLines:id,sale_id,item_id,quantity,base_quantity');
            if (($sale->invoice?->payments->count() ?? 0) > 1) {
                throw new Error('شما نمی توانین این فروش لغو کنین');
            }
            DB::transaction(function () use ($sale) {
                $sale->status = 'cancelled';
                $sale->save();
                $shopAccount = new SHA;
                $shopAccount->debit($sale->amount_paid, $sale->currency_id);
                $shop = $sale->location ?? Location::where('name', 'shop')->where('type', 'shop')->first();
                if (! $shop) {
                    throw new Error('دوکان پیدا نشد');
                }
                foreach ($sale->saleLines as $line) {
                    $moveBalance = new InvMovement;
                    $moveBalance->move($shop->id, $line->item_id, (float) ($line->base_quantity ?? $line->quantity), 'sale_return', 'لغو شد');
                }
                // throw new Error('test action');
            });
        } catch (\Throwable $th) {
            $des = sprintf(' مشکل در لغوه نمودن بل %s '.$th->getMessage(), $sale->invoice()->exists() ? $sale->invoice->invoice_number : '#00'.$sale->id);
            Inertia::flash('toast', ['type' => 'error', 'message' => $des]);

            return redirect()->back();
        }
        $des = sprintf('فروش بل نمبر  %s  لغو شد', $sale->invoice()->exists() ? $sale->invoice->invoice_number : '#00'.$sale->id);
        (new Log)->create('update', $des, '', "/sales/$sale->id/invoice/print");
        Inertia::flash('toast', ['type' => 'success', 'message' => $des]);

        return redirect()->back();
    }

    private function ensureDiscountIsEnough(Sale $sale)
    {
        $total = $sale->total;
        $discountTotal = $sale->discount_total;
        if ($total <= 0) {
            return;
        }

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
        $sale->load(['customer:id,name,phone,address', 'currency:id,name', 'saleLines.item:id,name,unit,code', 'saleLines.itemUnit:id,item_id,name,symbol', 'invoice']);

        abort_unless($sale->invoice, 404);

        return Inertia::render('sale/invoice', [
            'sale' => [
                'id' => $sale->id,
                'status' => $sale->status,
                'discount' => $sale->discount_total,
                'customer' => $sale->customer?->name ?? $sale->customer_name ?? 'مشتری گذری',
                'phone' => $sale->customer?->phone,
                'address' => $sale->customer?->address,
                'soldAt' => Carbon::parse($sale->sold_at ?? $sale->created_at)->format('Y/m/d H:i'),
                'amount_paid' => $sale->amount_paid,
                'lines' => $sale->saleLines->map(fn ($line) => [
                    'name' => $line->item?->name ?? 'جنس حذف‌شده',
                    'code' => $line->item?->code ?? 'کود ندادرد',
                    'unit' => $line->itemUnit?->name ?? $line->unit,
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
        return DB::transaction(function () use ($sale): Invoice {
            $sale = Sale::query()->lockForUpdate()->findOrFail($sale->id);
            $sale->load(['customer', 'currency']);

            $existingInvoice = $sale->invoice()->first();
            if ($existingInvoice) {
                return $existingInvoice;
            }

            $subtotal = (float) $sale->total;
            $total = (float) $sale->after_descount_total;

            $paidAmount = (float) $sale->amount_paid;
            $invoice = Invoice::create([
                'sale_id' => $sale->id,
                'invoice_number' => 'TMP-'.$sale->id,
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
            $invoice->update([
                'invoice_number' => 'INV-'.now()->format('Y').'-'.str_pad((string) $invoice->id, 6, '0', STR_PAD_LEFT),
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
        });
    }

    public function getTrend(CarbonInterface $monthStart, mixed $completedSales)
    {
        $now = now();
        $monthJalali = Jalalian::fromCarbon(Carbon::instance($monthStart));
        $currentMonthJalali = Jalalian::fromCarbon(Carbon::instance($now));
        $endOfMonth = ($monthJalali->format('Y/m') === $currentMonthJalali->format('Y/m'))
            ? Carbon::instance($now)
            : $monthJalali->addMonths(1)->subDay()->toCarbon()->endOfDay();

        return collect(range(0, $monthStart->diffInDays($endOfMonth) + 1))->map(function (int $offset) use ($monthStart, $completedSales, $endOfMonth) {
            $date = $monthStart->copy()->addDays($offset);
            if ($date->greaterThan($endOfMonth)) {
                return null;
            }

            $daySales = $completedSales->filter(function (Sale $sale) use ($date) {
                $saleDate = $sale->sold_at ?? $sale->created_at ?? now();

                return Carbon::parse($saleDate)->isSameDay($date);
            });

            $jalaliDate = Jalalian::fromCarbon(Carbon::instance($date));

            return [
                'day' => $jalaliDate->getDay(),
                'label' => $jalaliDate->format('m/d'),
                'sales' => round((float) $daySales->sum('after_descount_total'), 2),
            ];
        })->filter(fn (?array $item) => $item !== null)->values();
    }

    public function mostSold(Request $request)
    {
        $period = $request->input('period', 'monthly');
        $data = $request->validate([
            'period' => ['sometimes', 'in:daily,monthly'],
            'date' => ['sometimes', 'date_format:'.($period === 'daily' ? 'Y-m-d' : 'Y-m')],
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
                    'units' => round((float) $lines->sum(fn (SaleLine $saleLine) => $saleLine->base_quantity ?? $saleLine->quantity), 3),
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
        $comments = $sales->filter(fn (Sale $sale) => filled($sale->notes))->take(10)->map(fn (Sale $sale) => [
            'saleID' => $sale->id,
            'name' => $sale->customer?->name ?? $sale->customer_name ?? 'یادداشت فروش',
            'text' => $sale->notes,
            'time' => Carbon::parse($sale->sold_at ?? $sale->created_at)->locale('fa')->diffForHumans(),
        ])->values();

        return Inertia::render('sale/comments', [
            'comments' => $comments,
        ]);
    }

    public function customerOwe(Request $request, Customer $customer, Currency $currency): float|JsonResponse
    {
        if (! $customer || ! $currency) {
            return 0;
        }
        $customer->load(['sales:id,customer_id,after_descount_total', 'sales.invoice:id,sale_id', 'sales.invoice.payments:id,invoice_id,amount']);
        $totalPayments = $customer->sales->sum(
            fn ($sale) => $sale->invoice?->payments()->where('currency_id', $currency->id)->sum('amount')
        );
        $totalOwes = $customer->sales()
            ->where('currency_id', $currency->id)
            ->whereNotIn('status', ['returned', 'partially_refunded'])
            ->sum('after_descount_total');

        $balance = $totalOwes - $totalPayments;

        if ($request->expectsJson()) {
            return response()->json($balance);
        }

        return $balance;
    }

    private function AlertAdminIfCustomerDueExceedsLimit(Request $request, Customer $customer, Currency $currency)
    {
        if (! $customer || ! $currency) {
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
        } elseif ($currency->name == 'PKR') {
            $possiblePKRDue = 500000;
            if ($balance > $possiblePKRDue) {
                $admins = User::query()->with('role:id,name')->whereHas('role', function ($query) {
                    $query->whereIn('name', ['admin', 'super_admin']);
                })->get();
                Notification::send($admins, new CustomerHighDueAlert($customer));
            }
        } elseif ($currency->name == 'USD') {
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
            ->with(['customer:id,name', 'currency:id,name', 'saleLines.item:id,name,category_id,unit', 'saleLines.item.category:id,name', 'invoice:id,sale_id,invoice_number,status', 'invoice.payments:id,invoice_id'])
            ->where(function ($query) use ($fromDate, $now) {
                $query->whereBetween('sold_at', [$fromDate, $now])
                    ->orWhereBetween('created_at', [$fromDate, $now]);
            })
            ->latest('sold_at')
            ->latest('created_at')
            ->get();

        return Inertia::render('sale/allSale', [
            'orders' => $sales->map(fn (Sale $sale) => [
                'saleId' => $sale->id,

                'isCancelable' => $sale->status != 'cancelled' ? ((! $sale->invoice ? true : (($sale?->invoice?->payments->count() ?? 0) < 2))) : false,
                'id' => $sale->invoice?->invoice_number ?? '#SO-'.str_pad((string) $sale->id, 4, '0', STR_PAD_LEFT),
                'invoice_id' => $sale->invoice?->id,
                'hasInvoice' => (bool) $sale->invoice,
                'customer' => $sale->customer?->name ?? $sale->customer_name ?? 'مشتری گذری',
                'date' => Carbon::parse($sale->sold_at ?? $sale->created_at)->locale('fa')->diffForHumans(),
                'amount' => (float) ($sale->after_descount_total ?: $sale->total),
                'status' => $sale->status,
                'currency' => $sale->currency->name,
            ])->values(),
        ]);
    }
}
