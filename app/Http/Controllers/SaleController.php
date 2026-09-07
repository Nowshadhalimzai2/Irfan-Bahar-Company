<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Sale;
use Carbon\Carbon;
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
            ->with(['customer:id,name', 'currency:id,name', 'saleLines.item:id,name,category_id', 'saleLines.item.category:id,name', 'invoice:id,sale_id,invoice_number,status'])
            ->where(function ($query) use ($monthStart, $now) {
                $query->whereBetween('sold_at', [$monthStart, $now])->orWhere(function ($query) use ($monthStart, $now) {
                    $query->whereNull('sold_at')->whereBetween('created_at', [$monthStart, $now]);
                });
            })
            ->latest('sold_at')
            ->latest('created_at')
            ->get();

        $previousMonthSales = Sale::query()
            ->whereBetween('sold_at', [$previousMonthStart, $previousMonthEnd])
            ->get();

        $completedSales = $sales->where('status', 'completed');
        $previousRevenue = (float) $previousMonthSales->where('status', 'completed')->sum('after_descount_total');
        $revenue = (float) $completedSales->sum('after_descount_total');
        $orderCount = $sales->count();
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
        })->filter(fn (array $item) => $item['day'] <= $now->day)->values();

        $topProducts = $completedSales->flatMap->saleLines
            ->groupBy('item_id')
            ->map(function ($lines) {
                $line = $lines->first();

                return [
                    'name' => $line->item?->name ?? 'بدون نام',
                    'category' => $line->item?->category?->name ?? 'بدون دسته‌بندی',
                    'sales' => round((float) $lines->sum('line_total'), 2),
                    'units' => round((float) $lines->sum('quantity'), 3),
                ];
            })->sortByDesc('sales')->values()->take(5)->values();

        // $registeredCustomerSales = $completedSales->whereNotNull('customer_id')->count();
        $registeredCustomerSales = Customer::where('is_active',1)->count();
        $walkInSales = $completedSales->whereNull('customer_id')->count();
        $channelTotal = max($registeredCustomerSales + $walkInSales, 1);

        $channels = collect([
            ['name' => 'مشتری ثبت‌شده', 'value' => $registeredCustomerSales, 'color' => '#006fdf'],
            ['name' => 'فروش حضوری', 'value' => $walkInSales, 'color' => '#17b897'],
        ])->map(fn (array $channel) => [...$channel, 'percent' => round(($channel['value'] / $channelTotal) * 100, 1)])->values();

        $comments = $sales->filter(fn (Sale $sale) => filled($sale->notes))->take(4)->map(fn (Sale $sale) => [
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
            'orders' => $sales->take(8)->map(fn (Sale $sale) => [
                'id' => $sale->invoice?->invoice_number ?? '#SO-'.str_pad((string) $sale->id, 4, '0', STR_PAD_LEFT),
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

    public function create(){

        return Inertia::render('sale/create');
    }
}
