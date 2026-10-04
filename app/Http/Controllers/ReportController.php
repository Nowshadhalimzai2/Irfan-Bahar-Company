<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Item;
use App\Models\Supplier;
use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request, ReportService $reportService)
    {
        $period = $request->input('period', 'daily') === 'monthly' ? 'monthly' : 'daily';
        $preset = $request->input('preset', 'custom');
        $selectedDate = $request->date('date') ?? Carbon::today(config('app.timezone'));
        $report = $reportService->buildForPeriod($period, $selectedDate, [
            'preset' => $preset,
            'business_unit' => $request->input('business_unit', 'consolidated'),
            'product' => $request->input('product'),
            'category' => $request->input('category'),
            'vendor' => $request->input('vendor'),
            'customer' => $request->input('customer'),
            ]);
            
            $report['catalog'] = [
            'products' => Item::query()->select('id', 'name')->orderBy('name')->limit(100)->get()->map(fn ($item) => ['id' => $item->id, 'name' => $item->name])->all(),
            'categories' => Category::query()->select('id', 'name')->orderBy('name')->get()->map(fn ($category) => ['id' => $category->id, 'name' => $category->name])->all(),
            'customers' => Customer::query()->select('id', 'name')->orderBy('name')->limit(100)->get()->map(fn ($customer) => ['id' => $customer->id, 'name' => $customer->name])->all(),
            'suppliers' => Supplier::query()->select('id', 'name')->orderBy('name')->limit(100)->get()->map(fn ($supplier) => ['id' => $supplier->id, 'name' => $supplier->name])->all(),
        ];

        return Inertia::render('reports/index', $report);
    }
}