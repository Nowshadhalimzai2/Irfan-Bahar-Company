<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class ReportExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_download_a_valid_excel_report(): void
    {
        $role = Role::query()->firstOrCreate(['name' => 'super_admin']);
        $user = User::factory()->create([
            'name' => 'Test Admin',
            'email' => 'admin@example.com',
            'role_id' => $role->id,
            'password' => bcrypt('password'),
        ]);

        Auth::login($user);

        $response = $this->get('/reports/export?period=daily&preset=custom&date=1405/07/10');

        $response->assertOk();
        $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_report_export_handles_nested_values_without_corrupting_the_workbook(): void
    {
        $report = [
            'summary' => [
                'sales' => ['total' => 0, 'gross_total' => 0, 'count' => 1],
                'expenses' => ['total' => 0, 'count' => 0],
                'payments' => ['total' => 0],
                'refunds' => ['total' => 0],
                'attendance' => ['present' => 0, 'absent' => 0],
                'movements' => 0,
                'production' => 0,
                'activity' => 0,
                'cost_of_goods_sold' => 0,
                'gross_profit' => 0,
                'raw_material_purchase_cost' => 0,
                'production_quantity_completed' => 0,
                'production_cost' => 0,
                'shop_stock_value' => 0,
                'factory_stock_value' => 0,
                'low_stock_items_count' => 0,
                'low_stock_items' => [],
                'internal_transfers' => 0,
            ],
            'range' => ['label' => '1405/07', 'start' => '1405/07/01', 'end' => '1405/07/30'],
            'filters' => ['period' => 'daily'],
            'dailySales' => [[
                'date' => '1405/07/10',
                'label' => '07/10',
                'sales' => 1200,
                'count' => 2,
                'meta' => ['code' => 'A1', 'name' => 'Test'],
            ]],
            'expenses' => [],
            'expenseByCurrency' => [],
            'currencySummary' => [],
            'movementSummary' => [],
            'productionSummary' => [],
            'topProducts' => [],
            'customerSales' => [],
            'vendorPurchases' => [],
            'internalTransfers' => [],
            'shopInventory' => [],
        ];

        $path = storage_path('app/private/tmp/report-export-nested.xlsx');
        \Maatwebsite\Excel\Facades\Excel::store(new \App\Exports\ReportExport($report), 'tmp/report-export-nested.xlsx');

        $this->assertFileExists($path);

        $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($path);
        $sheet = $spreadsheet->getSheetByName('Daily Sales');

        $this->assertSame('sales', $sheet->getCell('C1')->getValue());
        $this->assertSame('{"code":"A1","name":"Test"}', $sheet->getCell('E2')->getValue());
    }
}
