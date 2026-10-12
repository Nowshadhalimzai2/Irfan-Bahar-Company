<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\Export;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class ReportExport implements Export, WithMultipleSheets
{
    public function __construct(private array $report) {}

    public function sheets(): array
    {
        $sheets = [
            new ReportSheet('Summary', $this->summaryRows()),
            new ReportSheet('Daily Sales', self::records($this->report['dailySales'] ?? [])),
            new ReportSheet('Expenses', self::records($this->report['expenses'] ?? [])),
            new ReportSheet('Expenses by Currency', self::records($this->report['expenseByCurrency'] ?? [])),
            new ReportSheet('Currency Summary', self::records($this->report['currencySummary'] ?? [])),
            new ReportSheet('Inventory Movements', self::records($this->report['movementSummary'] ?? [])),
            new ReportSheet('Production', self::records($this->report['productionSummary'] ?? [])),
            new ReportSheet('Top Products', self::records($this->report['topProducts'] ?? [])),
            new ReportSheet('Customer Sales', self::records($this->report['customerSales'] ?? [])),
            new ReportSheet('Vendor Purchases', self::records($this->report['vendorPurchases'] ?? [])),
            new ReportSheet('Internal Transfers', self::records($this->report['internalTransfers'] ?? [])),
            new ReportSheet('Shop Inventory', self::records($this->report['shopInventory'] ?? [])),
            new ReportSheet('Low Stock', self::lowStockRows($this->report['summary']['low_stock_items'] ?? [])),
        ];

        return $sheets;
    }

    private function summaryRows(): array
    {
        $summary = $this->report['summary'] ?? [];

        return [
            ['Report range', $this->report['range']['label'] ?? ''],
            ['Range start', $this->report['range']['start'] ?? ''],
            ['Range end', $this->report['range']['end'] ?? ''],
            ['Period', $this->report['filters']['period'] ?? ''],
            [],
            ['Metric', 'Value'],
            ['Sales total', $summary['sales']['total'] ?? 0],
            ['Sales count', $summary['sales']['count'] ?? 0],
            ['Gross sales total', $summary['sales']['gross_total'] ?? 0],
            ['Expenses total', $summary['expenses']['total'] ?? 0],
            ['Expenses count', $summary['expenses']['count'] ?? 0],
            ['Payments total', $summary['payments']['total'] ?? 0],
            ['Refunds total', $summary['refunds']['total'] ?? 0],
            ['Cost of goods sold', $summary['cost_of_goods_sold'] ?? 0],
            ['Gross profit', $summary['gross_profit'] ?? 0],
            ['Raw material purchase cost', $summary['raw_material_purchase_cost'] ?? 0],
            ['Production quantity completed', $summary['production_quantity_completed'] ?? 0],
            ['Production cost', $summary['production_cost'] ?? 0],
            ['Shop stock value', $summary['shop_stock_value'] ?? 0],
            ['Factory stock value', $summary['factory_stock_value'] ?? 0],
            ['Low stock items count', $summary['low_stock_items_count'] ?? 0],
            ['Internal transfers value', $summary['internal_transfers'] ?? 0],
            ['Attendance present', $summary['attendance']['present'] ?? 0],
            ['Attendance absent', $summary['attendance']['absent'] ?? 0],
            ['Inventory movements', $summary['movements'] ?? 0],
            ['Production orders', $summary['production'] ?? 0],
            ['System activity', $summary['activity'] ?? 0],
        ];
    }

    private static function records(mixed $records): array
    {
        $records = self::normalize($records);

        if ($records === []) {
            return [['No records']];
        }

        $records = array_map(fn ($record) => (array) $record, $records);
        $headers = array_values(array_unique(array_merge(...array_map('array_keys', $records))));
        $rows = [$headers];

        foreach ($records as $record) {
            $rows[] = array_map(fn ($header) => $record[$header] ?? '', $headers);
        }

        return $rows;
    }

    private static function lowStockRows(mixed $records): array
    {
        $records = self::normalize($records);
        $rows = [['Item ID', 'Item', 'Code', 'Quantity', 'Total Cost']];

        foreach ($records as $record) {
            $item = $record['item'] ?? [];
            $rows[] = [
                $item['id'] ?? '',
                $item['name'] ?? '',
                $item['code'] ?? '',
                $record['quantity'] ?? 0,
                $record['total_cost'] ?? 0,
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
}
