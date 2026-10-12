<?php

namespace Tests\Unit;

use App\Models\Category;
use App\Models\Currency;
use App\Models\Item;
use App\Models\Location;
use App\Models\Sale;
use App\Models\SaleLine;
use App\Models\SaleReturn;
use App\Models\SaleReturnLine;
use App\Models\Transfer;
use App\Models\TransferLine;
use App\Services\PersianDateConverter;
use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Morilog\Jalali\Jalalian;
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
            'status' => 'completed',
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

    public function test_it_adjusts_sales_and_profit_for_returns_and_groups_by_currency(): void
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

        $afg = Currency::query()->firstOrCreate(['name' => 'AFG']);
        $usd = Currency::query()->firstOrCreate(['name' => 'USD']);
        $category = Category::query()->firstOrCreate(['name' => 'soap']);

        $item = Item::query()->firstOrCreate([
            'sku' => 'SOAP-002',
            'name' => 'Soap Deluxe',
            'code' => 'SOAP-002',
            'item_type' => 'product',
            'unit' => 'unit',
            'default_sale_price' => 100.00,
            'category_id' => $category->id,
        ]);

        $saleDate = Carbon::parse('2026-10-03 12:00:00');

        $afgSale = Sale::query()->create([
            'customer_name' => 'Customer A',
            'currency_id' => $afg->id,
            'status' => 'completed',
            'total' => 1000,
            'discount_total' => 0,
            'after_descount_total' => 1000,
            'amount_paid' => 1000,
            'sold_at' => $saleDate,
        ]);

        SaleLine::query()->create([
            'sale_id' => $afgSale->id,
            'item_id' => $item->id,
            'unit' => 'unit',
            'quantity' => 10,
            'unit_cost' => 30,
            'unit_price' => 100,
            'discount' => 0,
            'discount_total' => 0,
            'line_total' => 1000,
            'sort_order' => 1,
        ]);

        $afgReturn = SaleReturn::query()->create([
            'sale_id' => $afgSale->id,
            'return_number' => 'RET-001',
            'status' => 'completed',
            'currency' => 'AFG',
            'total' => 250,
            'refund_amount' => 250,
            'requested_at' => $saleDate,
            'received_at' => $saleDate,
            'refunded_at' => $saleDate,
        ]);

        SaleReturnLine::query()->create([
            'sale_return_id' => $afgReturn->id,
            'sale_line_id' => $afgSale->saleLines()->first()->id,
            'item_id' => $item->id,
            'quantity' => 2,
            'unit_price' => 100,
            'line_total' => 200,
        ]);

        $usdSale = Sale::query()->create([
            'customer_name' => 'Customer B',
            'currency_id' => $usd->id,
            'status' => 'completed',
            'total' => 200,
            'discount_total' => 0,
            'after_descount_total' => 200,
            'amount_paid' => 200,
            'sold_at' => $saleDate,
        ]);

        SaleLine::query()->create([
            'sale_id' => $usdSale->id,
            'item_id' => $item->id,
            'unit' => 'unit',
            'quantity' => 2,
            'unit_cost' => 25,
            'unit_price' => 100,
            'discount' => 0,
            'discount_total' => 0,
            'line_total' => 200,
            'sort_order' => 1,
        ]);

        $transfer = Transfer::query()->create([
            'source_id' => $factory->id,
            'destination_id' => $shop->id,
            'reference_no' => 'TR-1002',
            'notes' => 'Factory to shop transfer',
            'transferred_at' => $saleDate->toDateString(),
            'status' => 'completed',
        ]);

        TransferLine::query()->create([
            'transfer_id' => $transfer->id,
            'item_id' => $item->id,
            'quantity' => 3,
            'unit_price' => 50,
        ]);

        $report = app(ReportService::class)->buildForPeriod('daily', $saleDate);

        $this->assertSame(950.0, round((float) $report['summary']['sales']['total'], 2));
        $this->assertSame(250.0, round((float) $report['summary']['returns_total'], 2));
        $this->assertSame(660.0, round((float) $report['summary']['gross_profit'], 2));
        $this->assertTrue(collect($report['currencySummary'])->pluck('currency')->contains('AFG'));
        $this->assertTrue(collect($report['currencySummary'])->pluck('currency')->contains('USD'));
    }

    public function test_it_uses_today_as_the_base_for_today_preset_even_when_a_different_date_is_selected(): void
    {
        $today = Carbon::today(config('app.timezone'));
        $persianToday = Jalalian::fromCarbon($today)->format('Y/m/d');

        $report = app(ReportService::class)->buildForPeriod('daily', '2026-01-15', [
            'preset' => 'today',
        ]);

        $this->assertSame($persianToday, $report['range']['start']);
        $this->assertSame($persianToday, $report['range']['end']);
        $this->assertSame($persianToday, $report['filters']['date']);
        $this->assertSame($today->toDateString(), $report['filters']['dateGregorian']);
    }

    public function test_it_uses_the_current_month_as_the_base_for_this_month_preset_even_when_a_different_month_is_selected(): void
    {
        $today = Carbon::today(config('app.timezone'));

        $report = app(ReportService::class)->buildForPeriod('monthly', '2025-12-15', [
            'preset' => 'this_month',
        ]);

        $this->assertSame(Jalalian::fromCarbon($today)->format('Y/m'), $report['filters']['date']);
        $this->assertSame('01', substr($report['range']['start'], -2));
        $this->assertSame((string) Jalalian::fromCarbon($today)->getDaysOf(Jalalian::fromCarbon($today)->getMonth()), substr($report['range']['end'], -2));
    }

    public function test_it_includes_only_sales_within_the_selected_persian_day(): void
    {
        $converter = app(PersianDateConverter::class);
        $range = $converter->toGregorianRange('1405/07/10', 'date');
        $this->createSaleAt($range['start']->copy()->subSecond(), 10);
        $this->createSaleAt($range['start']->copy(), 20);
        $this->createSaleAt($range['end']->copy(), 30);
        $this->createSaleAt($range['end']->copy()->addSecond(), 40);

        $report = app(ReportService::class)->buildForPeriod('daily', '1405/07/10');

        $this->assertSame('1405/07/10', $report['range']['start']);
        $this->assertSame('1405/07/10', $report['range']['end']);
        $this->assertSame(2, $report['summary']['sales']['count']);
        $this->assertSame(50.0, (float) $report['summary']['sales']['total']);
    }

    public function test_daily_report_includes_legacy_sales_without_sold_at_using_created_at(): void
    {
        $converter = app(PersianDateConverter::class);
        $range = $converter->toGregorianRange('1405/07/10', 'date');
        $sale = $this->createSaleAt($range['start']->copy()->addHours(10), 75);
        $sale->forceFill([
            'sold_at' => null,
            'created_at' => $range['start']->copy()->addHours(10),
        ])->saveQuietly();

        $report = app(ReportService::class)->buildForPeriod('daily', '1405/07/10');

        $this->assertSame(1, $report['summary']['sales']['count']);
        $this->assertSame(75.0, (float) $report['summary']['sales']['total']);
        $this->assertSame($range['start']->toDateString(), $report['dailySales'][0]['date']);
    }

    public function test_monthly_report_uses_full_persian_month_boundaries(): void
    {
        $converter = app(PersianDateConverter::class);
        $range = $converter->toGregorianRange('1405/07', 'month');
        $this->createSaleAt($range['start']->copy()->subSecond(), 10);
        $this->createSaleAt($range['start']->copy(), 20);
        $this->createSaleAt($range['end']->copy(), 30);
        $this->createSaleAt($range['end']->copy()->addSecond(), 40);

        $report = app(ReportService::class)->buildForPeriod('monthly', '1405/07');

        $this->assertSame('1405/07/01', $report['range']['start']);
        $this->assertSame('1405/07/30', $report['range']['end']);
        $this->assertSame(2, $report['summary']['sales']['count']);
        $this->assertSame(50.0, (float) $report['summary']['sales']['total']);
    }

    public function test_report_accepts_persian_digits_and_applies_customer_filter_to_sales(): void
    {
        $converter = app(PersianDateConverter::class);
        $range = $converter->toGregorianRange('1405/07/10', 'date');
        $this->createSaleAt($range['start']->copy()->addHour(), 100, 'Selected Customer');
        $this->createSaleAt($range['start']->copy()->addHour(), 250, 'Other Customer');

        $report = app(ReportService::class)->buildForPeriod('daily', '۱۴۰۵/۰۷/۱۰', [
            'customer' => 'Selected Customer',
        ]);

        $this->assertSame(1, $report['summary']['sales']['count']);
        $this->assertSame(100.0, (float) $report['summary']['sales']['total']);
        $this->assertSame('1405/07/10', $report['range']['start']);
    }

    public function test_date_converter_rejects_impossible_persian_day(): void
    {
        $this->expectException(InvalidArgumentException::class);

        app(PersianDateConverter::class)->toGregorianRange('1405/07/31', 'date');
    }

    private function createSaleAt(Carbon $soldAt, float $amount, string $customerName = 'Date boundary customer'): Sale
    {
        $currency = Currency::query()->firstOrCreate(['name' => 'AFG']);

        return Sale::query()->create([
            'customer_name' => $customerName,
            'currency_id' => $currency->id,
            'status' => 'completed',
            'total' => $amount,
            'discount_total' => 0,
            'after_descount_total' => $amount,
            'amount_paid' => $amount,
            'sold_at' => $soldAt,
        ]);
    }
}
