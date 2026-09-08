<?php

namespace App\Http\Controllers;

use App\Custome\InvMovement;
use App\Custome\SHA;
use App\Models\Currency;
use App\Models\Customer;
use App\Models\InventoryBalance;
use App\Models\InventoryMovement;
use App\Models\Item;
use App\Models\Location;
use App\Models\Sale;
use App\Models\SaleLine;
use App\Models\User;
use App\Notifications\HighDiscountAlert;
use Carbon\Carbon;
use Error;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SaleController extends Controller
{
    public function index()
    {
        $now = now();
        $monthStart = $now->copy()->startOfMonth();
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
        // dd($sales);
        $previousMonthSales = Sale::query()
            ->whereBetween('sold_at', [$previousMonthStart, $previousMonthEnd])
            ->get();

        $completedSales = $sales->where('status', 'completed');
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

        $trend = collect(range(0, $now->daysInMonth - 1))->map(function (int $day) use ($monthStart, $completedSales) {
            $date = $monthStart->copy()->addDays($day);
            $daySales = $completedSales->filter(function (Sale $sale) use ($date) {
                return Carbon::parse($sale->sold_at ?? $sale->created_at)->isSameDay($date);
            });

            return ['day' => $date->day, 'sales' => round((float) $daySales->sum('after_descount_total'), 2)];
        })->filter(fn(array $item) => $item['day'] <= $now->day)->values();

        $topProducts = $completedSales->flatMap->saleLines
            ->groupBy('item_id')
            ->map(function ($lines) {
                $line = $lines->first();

                return [
                    'name' => $line->item?->name ?? 'بدون نام',
                    'category' => $line->item?->category?->name ?? 'بدون دسته‌بندی',
                    'sales' => round((float) $lines->sum('line_total'), 2),
                    'units' => round((float) $lines->sum('quantity'), 3),
                    'unit' =>$line->item?->unit ?? 'unit',
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

        $comments = $sales->filter(fn(Sale $sale) => filled($sale->notes))->take(4)->map(fn(Sale $sale) => [
            'name' => $sale->customer?->name ?? $sale->customer_name ?? 'یادداشت فروش',
            'text' => $sale->notes,
            'time' => Carbon::parse($sale->sold_at ?? $sale->created_at)->diffForHumans(),
        ])->values();

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
                'id' => $sale->invoice?->invoice_number ?? '#SO-' . str_pad((string) $sale->id, 4, '0', STR_PAD_LEFT),
                'customer' => $sale->customer?->name ?? $sale->customer_name ?? 'مشتری گذری',
                'date' => Carbon::parse($sale->sold_at ?? $sale->created_at)->diffForHumans(),
                'amount' => (float) ($sale->after_descount_total ?: $sale->total),
                'status' => $sale->status,
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
            ->with(['product:item_id,barcode', 'category:id,name', 'inventoryBalances:id,item_id,location_id,quantity_on_hand,reserved'])
            ->whereHas('inventoryBalances', fn($query) => $query->whereIn('location_id', $locations->pluck('id'))->where('quantity_on_hand', '>', 0))
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'sku', 'unit', 'default_sale_price', 'category_id']);

        return Inertia::render('sale/create', [
            'items' => $items,
            'customers' => Customer::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'phone']),
            'currencies' => Currency::query()->orderBy('id')->get(['id', 'name']),
            'locations' => $locations,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'customer_id' => $request->input('customer_id') ?: null,
        ]);

        $data = $request->validate([
            'location_id' => ['required', 'exists:locations,id'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'customer_name' => ['nullable', 'string', 'max:50'],
            'currency_id' => ['required', 'exists:currencies,id'],
            'sold_at' => ['required', 'date'],
            'discount_total' => ['nullable', 'numeric', 'min:0'],
            'amount_paid' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'saleLines' => ['required', 'array', 'min:1'],
            'saleLines.*.item_id' => ['required', 'exists:items,id'],
            'saleLines.*.quantity' => ['required', 'numeric', 'gt:0'],
            'saleLines.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $location = Location::query()->where('type', 'shop')->where('is_active', true)->findOrFail($data['location_id']);

        try {
            DB::transaction(function () use ($data, $location, $request): void {
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

                $sale = Sale::query()->create([
                    'customer_id' => $data['customer_id'] ?? null,
                    'customer_name' => $data['customer_name'] ?? null,
                    'currency_id' => $data['currency_id'],
                    'created_by' => $request->user()?->id,
                    'status' => 'completed',
                    'total' => $total,
                    'discount_total' => $discount,
                    'after_descount_total' => $afterDiscount,
                    'amount_paid' => min((float) ($data['amount_paid'] ?? 0), $afterDiscount),
                    'sold_at' => $data['sold_at'],
                    'notes' => $data['notes'] ?? null,
                ]);
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
                    $invMove = new InvMovement();
                    $invMove->move($location->id, $line['item']->id, $line['quantity'], 'sale', $data['notes'] ?? 'فروش ثبت شد', '-');
                    $sa = new SHA();
                    $sa->credit($afterDiscount, $data['currency_id']);
                }

                $this->ensureDiscountIsEnough($sale);
            });
            Inertia::flash('toast', ['type' => "success", "message" => "فروشات تکمیل شد"]);
            // return redirect()->route('sales.index')->with('success', 'فروش با موفقیت ثبت شد.');
            return redirect()->back()->with('success', 'فروش با موفقیت ثبت شد.');
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

    private function ensureDiscountIsEnough(Sale $sale){
        $total = $sale->total;
        $discountTotal = $sale->discount_total;
        $discount = ($discountTotal*100)/$total;
        if($discount>10){
            $admins = User::query()->with('role')->whereHas('role',function ($query) {
                $query->whereIn('name',['admin','super_admin']);
            })->get();
            foreach($admins as $user){
                $user->notify(new HighDiscountAlert($sale));
            }
        }
    }
}
