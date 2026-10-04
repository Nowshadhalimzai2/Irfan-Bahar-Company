<?php

namespace Tests\Unit;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\SaleLine;
use App\Models\SaleReturn;
use PHPUnit\Framework\TestCase;

class InvoiceFinancialSummaryTest extends TestCase
{
    public function test_it_nets_returned_goods_and_cash_refunds_separately(): void
    {
        $invoice = new Invoice(['total' => 100]);
        $sale = new Sale(['amount_paid' => 70]);
        $sale->setRelation('saleReturns', collect([
            new SaleReturn(['total' => 20, 'refund_amount' => 10]),
        ]));
        $invoice->setRelation('sale', $sale);
        $invoice->setRelation('payments', collect([new Payment(['amount' => 50])]));

        self::assertSame([
            'original_total' => 100.0,
            'return_total' => 20.0,
            'refunded_amount' => 10.0,
            'gross_paid' => 50.0,
            'total' => 80.0,
            'paid' => 40.0,
            'due' => 40.0,
        ], $invoice->financialSummary());
    }

    public function test_returned_unit_value_includes_the_original_sale_discount(): void
    {
        $sale = new Sale([
            'total' => 1000,
            'after_descount_total' => 900,
        ]);

        self::assertSame(90.0, $sale->returnValueForUnitPrice(100));
    }
}