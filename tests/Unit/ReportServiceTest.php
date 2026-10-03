<?php

namespace Tests\Unit;

use App\Models\Category;
use App\Models\Currency;
use App\Models\Item;
use App\Models\Location;
use App\Models\Sale;
use App\Models\SaleLine;
use App\Models\Transfer;
use App\Models\TransferLine;
use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_keeps_internal_transfers_out_of_external_revenue_and_profit(): void
    {
        $factory = Location::query()->firstOrCreate([
            'name' => 'factory',
            'type' => 'factory',
            'address' => 'Factory floor',
            'is_active' => true,
        ]);

        $shop = Location::query()->firstOrCreate([
            'name' => 'shop',
            'type' => 'shop',
            'address' => 'Main shop',
            'is_active' => true,
        ]);

        $currency = Currency::query()->firstOrCreate([
            'name' => 'AFG',
        ]);

        $category = Category::query()->firstOrCreate(['name' => 'soap']);

        $item = Item::query()->firstOrCreate([
            'sku' => 'SOAP-001',
            'name' => 'Soap',
            'code' => 'SOAP-001',
            'item_type' => 'product',
            'unit' => 'unit',
            'default_sale_price' => 120.00,
            'category_id' => $category->id,
        ]);

        $saleDate = Carbon::parse('2026-10-02 10:00:00');

        $sale = Sale::query()->create([
            'customer_name' => 'Customer One',
            'currency_id' => $currency->id,
            'status' => 'completed',
            'total' => 1000.00,
            'discount_total' => 0,
            'after_descount_total' => 1000.00,
            'amount_paid' => 1000.00,
            'sold_at' => $saleDate,
        ]);

        SaleLine::query()->create([
            'sale_id' => $sale->id,
            'item_id' => $item->id,
            'unit' => 'unit',
            'quantity' => 10,
            'unit_cost' => 40,
            'unit_price' => 100,
            'discount' => 0,
            'discount_total' => 0,
            'line_total' => 1000,
            'sort_order' => 1,
        ]);

        $transfer = Transfer::query()->create([
            'source_id' => $factory->id,
            'destination_id' => $shop->id,
            'reference_no' => 'TR-1001',
            'notes' => 'Factory to shop transfer',
            'transferred_at' => $saleDate->toDateString(),
        ]);

        TransferLine::query()->create([
            'transfer_id' => $transfer->id,
            'item_id' => $item->id,
            'quantity' => 5,
            'unit_price' => 90,
        ]);

        $report = app(ReportService::class)->buildForPeriod('daily', $saleDate);

        $this->assertSame(1000.0, round((float) $report['summary']['sales']['total'], 2));
        $this->assertSame(400.0, round((float) $report['summary']['cost_of_goods_sold'], 2));
        $this->assertSame(600.0, round((float) $report['summary']['gross_profit'], 2));
        $this->assertSame(450.0, round((float) $report['summary']['internal_transfers'], 2));
    }
}
