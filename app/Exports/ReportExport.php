<?php

namespace App\Exports;

use DateTimeInterface;
use Maatwebsite\Excel\Concerns\Export;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class ReportExport implements Export, WithMultipleSheets
{
    public function __construct(
        private array $report,
        private bool $dari = false,
    ) {}

    public function sheets(): array
    {
        $sheets = [
            new ReportSheet($this->label('Summary'), $this->summaryRows(), $this->dari),
            new ReportSheet($this->label('Daily Sales'), self::records($this->report['dailySales'] ?? [], $this->dari), $this->dari),
            new ReportSheet($this->label('Expenses'), self::records($this->report['expenses'] ?? [], $this->dari), $this->dari),
            // new ReportSheet($this->label('Expenses by Currency'), self::records($this->report['expenseByCurrency'] ?? [], $this->dari), $this->dari),
            new ReportSheet($this->label('Currency Summary'), self::records($this->report['currencySummary'] ?? [], $this->dari), $this->dari),
            new ReportSheet($this->label('Inventory Movements'), self::records($this->report['movementSummary'] ?? [], $this->dari), $this->dari),
            new ReportSheet($this->label('Production'), self::records($this->report['productionSummary'] ?? [], $this->dari), $this->dari),
            new ReportSheet($this->label('Top Products'), self::records($this->report['topProducts'] ?? [], $this->dari), $this->dari),
            new ReportSheet($this->label('Customer Sales'), self::records($this->report['customerSales'] ?? [], $this->dari), $this->dari),
            new ReportSheet($this->label('Vendor Purchases'), self::records($this->report['vendorPurchases'] ?? [], $this->dari), $this->dari),
            new ReportSheet($this->label('Internal Transfers'), self::records($this->report['internalTransfers'] ?? [], $this->dari), $this->dari),
            new ReportSheet($this->label('Shop Inventory'), self::records($this->report['shopInventory'] ?? [], $this->dari), $this->dari),
            new ReportSheet($this->label('Low Stock'), self::lowStockRows($this->report['summary']['low_stock_items'] ?? [], $this->dari), $this->dari),
        ];

        return $sheets;
    }

    private function summaryRows(): array
    {
        $summary = $this->report['summary'] ?? [];
        $currencySummary = collect(self::normalize($this->report['currencySummary'] ?? []));
        $currencyTotals = fn (string $key): string => $currencySummary
            ->filter(fn ($row) => (float) ($row[$key] ?? 0) !== 0.0)
            ->map(fn ($row) => ($row[$key] ?? 0).' '.($row['currency'] ?? 'AFG'))
            ->implode(' | ') ?: '0';

        $rows = [
            ['Report range', $this->report['range']['label'] ?? ''],
            ['Range start', $this->report['range']['start'] ?? ''],
            ['Range end', $this->report['range']['end'] ?? ''],
            ['Period', $this->report['filters']['period'] ?? ''],
            [],
            ['Metric', 'Value'],
            ['Sales total by currency', $currencyTotals('net_total')],
            ['Sales count', $summary['sales']['count'] ?? 0],
            ['Gross sales total by currency', $currencyTotals('sales_total')],
            ['Expenses total by currency', $currencyTotals('expenses_total')],
            ['Expenses count', $summary['expenses']['count'] ?? 0],
            ['Payments total by currency', $currencyTotals('payments_total')],
            ['Refunds total by currency', $currencyTotals('refund_total')],
            ['Cost of goods sold by currency', $currencyTotals('cost_of_goods_sold')],
            ['Gross profit by currency', $currencyTotals('gross_profit')],
            ['Raw material purchase cost by currency', $currencyTotals('raw_material_purchase_cost')],
            ['Production quantity completed', $summary['production_quantity_completed'] ?? 0],
            ['Production cost by currency', $currencyTotals('production_cost')],
            ['Production cost basis', $summary['production_cost_basis'] ?? ''],
            ['Shop inventory sales value (AFG)', $summary['shop_stock_value_afg'] ?? 0],
            ['Factory inventory sales value (AFG)', $summary['factory_stock_value_afg'] ?? 0],
            ['Low stock items count', $summary['low_stock_items_count'] ?? 0],
            ['Internal transfers value (AFG)', $summary['internal_transfers_value_afg'] ?? 0],
            ['Attendance present', $summary['attendance']['present'] ?? 0],
            ['Attendance absent', $summary['attendance']['absent'] ?? 0],
            ['Inventory movements', $summary['movements'] ?? 0],
            ['Production orders', $summary['production'] ?? 0],
            ['System activity', $summary['activity'] ?? 0],
        ];

        return $this->dari
            ? array_map(fn ($row) => $row === [] ? [] : [self::labelFor($row[0]), ...array_slice($row, 1)], $rows)
            : $rows;
    }

    private static function records(mixed $records, bool $dari = false): array
    {
        $records = self::normalize($records);

        if ($records === []) {
            return [['No records']];
        }

        $records = array_map(fn ($record) => (array) $record, $records);
        $headers = array_values(array_unique(array_merge(...array_map('array_keys', $records))));
        $rows = [$dari ? array_map(fn ($header) => self::labelFor($header), $headers) : $headers];

        foreach ($records as $record) {
            $rows[] = array_map(fn ($header) => self::cellValue($record[$header] ?? ''), $headers);
        }

        return $rows;
    }

    private static function lowStockRows(mixed $records, bool $dari = false): array
    {
        $records = self::normalize($records);
        $rows = [$dari ? ['شناسه جنس', 'جنس', 'کود جنس', 'واحد', 'مقدار', 'ارزش', 'ارز'] : ['Item ID', 'Item', 'Code', 'Unit', 'Quantity', 'Value', 'Currency']];

        foreach ($records as $record) {
            $item = $record['item'] ?? [];
            $rows[] = [
                $item['id'] ?? '',
                self::cellValue($item['name'] ?? ''),
                self::cellValue($item['code'] ?? ''),
                self::cellValue($item['unit'] ?? ''),
                self::cellValue($record['quantity'] ?? 0),
                self::cellValue($record['total_value'] ?? 0),
                self::cellValue($item['currency'] ?? 'AFG'),
            ];
        }

        return $rows;
    }

    private static function normalize(mixed $records): array
    {
        if (is_object($records) && method_exists($records, 'all')) {
            $records = $records->all();
        }

        return is_array($records) ? $records : [];
    }

    private static function cellValue(mixed $value): mixed
    {
        if ($value instanceof DateTimeInterface) {
            return $value->format('Y-m-d H:i:s');
        }

        if ($value === null || is_scalar($value)) {
            return $value;
        }

        if (is_array($value)) {
            return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        }

        return is_object($value) && method_exists($value, 'toArray')
            ? json_encode($value->toArray(), JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)
            : (string) $value;
    }

    private function label(string $label): string
    {
        return $this->dari ? self::labelFor($label) : $label;
    }

    private static function labelFor(string $label): string
    {
        return [
            'Summary' => 'خلاصه', 'Daily Sales' => 'فروش روزانه', 'Expenses' => 'مصارف',
            'Expenses by Currency' => 'مصارف بر اساس ارز', 'Currency Summary' => 'خلاصه ارزها',
            'Inventory Movements' => 'حرکت موجودی', 'Production' => 'تولید', 'Top Products' => 'محصولات پرفروش',
            'Customer Sales' => 'فروش مشتریان', 'Vendor Purchases' => 'خرید از تأمین‌کنندگان',
            'Internal Transfers' => 'انتقالات داخلی', 'Shop Inventory' => 'موجودی فروشگاه', 'Low Stock' => 'موجودی کم',
            'Report range' => 'بازه راپور', 'Range start' => 'شروع بازه', 'Range end' => 'پایان بازه', 'Period' => 'دوره',
            'Metric' => 'شاخص', 'Value' => 'مقدار', 'Sales total by currency' => 'مجموع فروش خالص بر اساس ارز', 'Sales count' => 'تعداد فروش',
            'Gross sales total by currency' => 'مجموع فروش ناخالص بر اساس ارز', 'Expenses total by currency' => 'مجموع مصارف بر اساس ارز', 'Expenses count' => 'تعداد مصارف',
            'Payments total by currency' => 'مجموع پرداخت‌ها بر اساس ارز', 'Refunds total by currency' => 'مجموع برگشت‌ها بر اساس ارز',
            'Cost of goods sold by currency' => 'بهای تمام‌شده کالا بر اساس ارز', 'Gross profit by currency' => 'سود ناخالص بر اساس ارز',
            'Raw material purchase cost by currency' => 'هزینه خرید مواد خام بر اساس ارز',
            'Production quantity completed' => 'مقدار تولید تکمیل‌شده', 'Production cost' => 'هزینه تولید',
            'Production cost basis' => 'مبنای محاسبه هزینه تولید',
            'Production cost by currency' => 'هزینه تولید بر اساس ارز',
            'Shop inventory sales value (AFG)' => 'ارزش فروش موجودی فروشگاه (AFG)',
            'Factory inventory sales value (AFG)' => 'ارزش فروش موجودی کارخانه (AFG)',
            'Internal transfers value (AFG)' => 'ارزش انتقالات داخلی (AFG)',
            'Low stock items count' => 'تعداد اقلام کم‌موجودی', 'Internal transfers value' => 'ارزش انتقالات داخلی',
            'Attendance present' => 'حاضر', 'Attendance absent' => 'غایب', 'Inventory movements' => 'حرکت‌های موجودی',
            'Production orders' => 'سفارش‌های تولید', 'System activity' => 'فعالیت سیستم',
            'date' => 'تاریخ', 'currency' => 'ارز', 'description' => 'توضیحات', 'amount' => 'مبلغ',
            'label' => 'برچسب', 'sales' => 'فروش', 'count' => 'تعداد', 'total' => 'مجموع', 'refund_total' => 'مجموع برگشت',
            'net_total' => 'مجموع خالص', 'expenses_total' => 'مجموع مصارف', 'sales_count' => 'تعداد فروش',
            'refund_count' => 'تعداد برگشت', 'expense_count' => 'تعداد مصرف', 'type' => 'نوع', 'movements' => 'حرکت‌ها',
            'payments_total' => 'مجموع پرداخت‌ها', 'cost_of_goods_sold' => 'بهای تمام‌شده کالا',
            'gross_profit' => 'سود ناخالص', 'raw_material_purchase_cost' => 'هزینه خرید مواد خام',
            'production_cost' => 'هزینه تولید',
            'quantity' => 'مقدار', 'status' => 'وضعیت', 'name' => 'نام', 'customer' => 'مشتری', 'orders' => 'سفارش‌ها',
            'vendor' => 'تأمین‌کننده', 'product' => 'محصول', 'value' => 'ارزش', 'is_low_stock' => 'موجودی کم',
        ][$label] ?? $label;
    }
}
