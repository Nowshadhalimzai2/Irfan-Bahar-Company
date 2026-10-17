<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class HighProductionService
{
    
    public function getCategoryByProduction()
    {
        $productionStartDate = Carbon::today()->subDays(6);
        $productionByCategory = DB::table('production_outputs')
            ->join('production_orders', 'production_orders.id', '=', 'production_outputs.production_order_id')
            ->join('products', 'products.item_id', '=', 'production_outputs.product_id')
            ->join('items', 'items.id', '=', 'products.item_id')
            ->join('categories', 'categories.id', '=', 'items.category_id')
            ->where('production_orders.status', 'completed')
            ->where('items.item_type', 'product')
            ->whereDate('production_orders.updated_at', '>=', $productionStartDate->toDateString())
            ->whereDate('production_orders.updated_at', '<=', Carbon::today()->toDateString())
            ->select(
                'categories.id as category_id',
                'categories.name as category_name',
                DB::raw('DATE(production_orders.updated_at) as production_date'),
                DB::raw('SUM(production_outputs.quantity_produced) as quantity_produced'),
            )
            ->groupBy('categories.id', 'categories.name', DB::raw('DATE(production_orders.updated_at)'))
            ->get();

        return $productionByCategory;
    }

    public function topProductionCategory($productionByCategory)
    {
        return $productionByCategory
            ->groupBy('category_id')
            ->map(fn($rows) => [
                'id' => $rows->first()->category_id,
                'name' => $rows->first()->category_name,
                'total' => $rows->sum('quantity_produced'),
            ])
            ->sortByDesc('total')
            ->take(2)
            ->values();
    }
    public function GenerateProductionChart($productionByCategory, $topProductionCategories)
    {
        $productionStartDate = Carbon::today()->subDays(6);
        $productionChart = collect(range(0, 6))->map(function ($daysAgo) use ($productionStartDate, $productionByCategory, $topProductionCategories) {
            $date = $productionStartDate->copy()->addDays($daysAgo);
            $dayData = ['day' => $date->format('Y-m-d')];

            foreach ($topProductionCategories as $category) {
                $dayData['category_' . $category['id']] = (float) $productionByCategory
                    ->where('category_id', $category['id'])
                    ->where('production_date', $date->toDateString())
                    ->sum('quantity_produced');
            }

            return $dayData;
        });


        return $productionChart;
    }
}
