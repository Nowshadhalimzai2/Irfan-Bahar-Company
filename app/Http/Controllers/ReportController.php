<?php

namespace App\Http\Controllers;

use App\Exports\DariReportExport;
use App\Exports\ReportExport;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Item;
use App\Models\Supplier;
use App\Services\PersianDateConverter;
use App\Services\ReportService;
use DateTimeZone;
use Illuminate\Http\Request;
use Inertia\Inertia;
use InvalidArgumentException;
use Maatwebsite\Excel\Facades\Excel;
use Morilog\Jalali\Jalalian;

class ReportController extends Controller
{
    public function index(Request $request, ReportService $reportService, PersianDateConverter $dateConverter)
    {
        $period = $request->input('period', 'daily') === 'monthly' ? 'monthly' : 'daily';
        $datePattern = $period === 'monthly'
            ? '/^[0-9۰-۹٠-٩]{4}\/[0-9۰-۹٠-٩]{1,2}$/u'
            : '/^[0-9۰-۹٠-٩]{4}\/[0-9۰-۹٠-٩]{1,2}\/[0-9۰-۹٠-٩]{1,2}$/u';

        $request->validate([
            'date' => [
                'nullable',
                'string',
                'max:20',
                'regex:'.$datePattern,
                function (string $attribute, mixed $value, \Closure $fail) use ($period, $dateConverter): void {
                    if (! is_string($value) || $value === '') {
                        return;
                    }

                    try {
                        $dateConverter->toGregorianRange($value, $period === 'monthly' ? 'month' : 'date');
                    } catch (InvalidArgumentException $exception) {
                        $fail('تاریخ فارسی معتبر نیست.');
                    }
                },
            ],
        ]);

        $preset = $request->input('preset', 'custom');
        $selectedDate = $request->input('date')
            ?? Jalalian::now(new DateTimeZone(config('app.timezone')))->format($period === 'monthly' ? 'Y/m' : 'Y/m/d');
        $report = $reportService->buildForPeriod($period, $selectedDate, [
            'preset' => $preset,
            // 'business_unit' => $request->input('business_unit', 'consolidated'),
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

    public function export(Request $request, ReportService $reportService, PersianDateConverter $dateConverter)
    {
        $period = $request->input('period', 'daily') === 'monthly' ? 'monthly' : 'daily';
        $datePattern = $period === 'monthly'
            ? '/^[0-9۰-۹٠-٩]{4}\/[0-9۰-۹٠-٩]{1,2}$/u'
            : '/^[0-9۰-۹٠-٩]{4}\/[0-9۰-۹٠-٩]{1,2}\/[0-9۰-۹٠-٩]{1,2}$/u';

        $request->validate([
            'date' => ['nullable', 'string', 'max:20', 'regex:'.$datePattern],
        ]);

        $selectedDate = $request->input('date')
            ?? Jalalian::now(new DateTimeZone(config('app.timezone')))->format($period === 'monthly' ? 'Y/m' : 'Y/m/d');

        $report = $reportService->buildForPeriod($period, $selectedDate, [
            'export' => true,
            'preset' => $request->input('preset', 'custom'),
            'business_unit' => $request->input('business_unit', 'consolidated'),
            'product' => $request->input('product'),
            'category' => $request->input('category'),
            'vendor' => $request->input('vendor'),
            'customer' => $request->input('customer'),
        ]);

        // $isDari = $request->input('language') === 'dari';
        $export = new DariReportExport($report);
        $filename = 'factory-report-'.str_replace(['/', '\\'], '-', $selectedDate).'.xlsx';

        return Excel::download($export, $filename);
    }
}
