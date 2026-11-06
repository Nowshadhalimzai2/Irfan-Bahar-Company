<?php

namespace App\Http\Controllers;

use App\Custome\InvMovement;
use App\Models\Invoice;
use App\Models\Location;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\SaleReturnLine;
use App\Models\ShopAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SaleReturnController extends Controller
{
    public function create(Sale $sale): Response
    {
        abort(404);
        // Gate::authorize('allow-shop-clerk');
        abort_unless(
            in_array($sale->status, ['completed', 'partially_returned'], true),
            403,
            'این فروش قابل برگشت نیست.',
        );

        $sale->load([
            'customer:id,name',
            'currency:id,name',
            'invoice.payments:id,invoice_id,amount',
            'saleLines.item:id,name,unit',
            'saleLines.itemUnit:id,item_id,name,symbol,conversion_to_base',
        ]);
        $returnedQuantities = $this->returnedQuantities($sale->id);
        $returnedValues = SaleReturnLine::query()
            ->whereHas('saleReturn', fn ($query) => $query->where('sale_id', $sale->id))
            ->selectRaw('sale_line_id, SUM(line_total) as returned_value')
            ->groupBy('sale_line_id')
            ->pluck('returned_value', 'sale_line_id');
        $locations = Location::query()
            ->where('type', 'shop')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);
        $paidAmount = $sale->invoice
            ? $sale->invoice->financialSummary()['gross_paid']
            : (float) $sale->amount_paid;

        return Inertia::render('sale-return/create', [
            'sale' => $sale,
            'locations' => $locations,
            'paidAmount' => $paidAmount,
            'previousReturnTotal' => (float) $sale->saleReturns()->sum('total'),
            'previousRefundTotal' => (float) $sale->saleReturns()->sum('refund_amount'),
            'returnableLines' => $sale->saleLines->map(function ($line) use ($returnedQuantities, $returnedValues) {
                $returned = (float) ($returnedQuantities[$line->id] ?? 0);
                $remaining = max(0, (float) $line->quantity - $returned);
                $netLineTotal = max(
                    0,
                    round((float) $line->line_total - (float) $line->discount_total, 2),
                );
                $remainingValue = max(
                    0,
                    round($netLineTotal - (float) ($returnedValues[$line->id] ?? 0), 2),
                );

                return [
                    'id' => $line->id,
                    'item_id' => $line->item_id,
                    'item_name' => $line->item?->name,
                    'unit' => $line->itemUnit?->name ?? $line->unit,
                    'quantity' => (float) $line->quantity,
                    'returned_quantity' => $returned,
                    'remaining_quantity' => $remaining,
                    'net_line_total' => $netLineTotal,
                    'remaining_return_value' => $remainingValue,
                    'unit_price' => (float) $line->unit_price,
                ];
            })->values(),
        ]);
    }

    public function store(Request $request, Sale $sale): RedirectResponse
    {
        abort(404);
        // Gate::authorize('allow-shop-clerk');
        $data = $request->validate([
            'location_id' => [
                'required',
                'integer',
                Rule::exists('locations', 'id')->where(
                    fn ($query) => $query->where('type', 'shop')->where('is_active', true),
                ),
            ],
            'reason' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'refund_amount' => [
                'nullable',
                'numeric',
                'decimal:0,2',
                'min:0',
                'max:9999999999999.99',
            ],
            'refund_method' => ['nullable', Rule::in(['cash', 'bank_transfer', 'office'])],
            'refund_reference' => ['nullable', 'string', 'max:255'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.sale_line_id' => ['required', 'integer', 'distinct'],
            'lines.*.quantity' => ['required', 'numeric', 'decimal:0,3', 'gt:0'],
            'lines.*.condition' => ['nullable', 'string', 'max:30'],
            'lines.*.restock_action' => ['required', 'in:restock,none'],
            'lines.*.notes' => ['nullable', 'string', 'max:500'],
        ]);

        $return = DB::transaction(function () use ($data, $request, $sale): SaleReturn {
            $lockedInvoice = Invoice::query()
                ->where('sale_id', $sale->id)
                ->lockForUpdate()
                ->first();
            $lockedSale = Sale::query()
                ->with(['saleLines', 'saleLines.itemUnit', 'currency'])
                ->lockForUpdate()
                ->findOrFail($sale->id);
            $lockedSale->setRelation('invoice', $lockedInvoice);

            if (! in_array($lockedSale->status, ['completed', 'partially_returned'], true)) {
                throw ValidationException::withMessages([
                    'lines' => 'این فروش قابل برگشت نیست.',
                ]);
            }

            $saleLines = $lockedSale->saleLines->keyBy('id');
            $returnedQuantities = $this->returnedQuantities($lockedSale->id, true);
            $returnedValues = SaleReturnLine::query()
                ->whereIn('sale_line_id', $saleLines->keys())
                ->whereHas('saleReturn', fn ($query) => $query->where('sale_id', $lockedSale->id))
                ->selectRaw('sale_line_id, SUM(line_total) as returned_value')
                ->groupBy('sale_line_id')
                ->pluck('returned_value', 'sale_line_id');
            $previousReturnTotal = (float) $lockedSale->saleReturns()->sum('total');
            $previousRefundTotal = (float) $lockedSale->saleReturns()->sum('refund_amount');
            $paidAmount = $lockedInvoice
                ? $lockedInvoice->financialSummary()['gross_paid']
                : (float) $lockedSale->amount_paid;
            $returnTotal = 0.0;
            $preparedLines = [];

            foreach ($data['lines'] as $lineData) {
                $saleLine = $saleLines->get((int) $lineData['sale_line_id']);
                if (! $saleLine) {
                    throw ValidationException::withMessages([
                        'lines' => 'یکی از اقلام متعلق به این فروش نیست.',
                    ]);
                }

                $quantity = (float) $lineData['quantity'];
                $previouslyReturnedQuantity = (float) ($returnedQuantities[$saleLine->id] ?? 0);
                $remainingQuantity = max(
                    0,
                    (float) $saleLine->quantity - $previouslyReturnedQuantity,
                );
                if ($quantity > $remainingQuantity + 0.000001) {
                    throw ValidationException::withMessages([
                        'lines' => 'مقدار قابل برگشت برای این قلم بیشتر از مقدار باقی‌مانده است.',
                    ]);
                }

                $netLineTotal = max(
                    0,
                    round((float) $saleLine->line_total - (float) $saleLine->discount_total, 2),
                );
                $previouslyReturnedValue = (float) ($returnedValues[$saleLine->id] ?? 0);
                $remainingValue = max(
                    0,
                    round($netLineTotal - $previouslyReturnedValue, 2),
                );
                $lineTotal = $quantity >= $remainingQuantity - 0.000001
                    ? $remainingValue
                    : min(
                        $remainingValue,
                        round($quantity * $netLineTotal / (float) $saleLine->quantity, 2),
                    );
                $unitPrice = (float) $saleLine->unit_price;
                $conversionFactor = (float) (
                    $saleLine->conversion_factor
                    ?? $saleLine->itemUnit?->conversion_to_base
                    ?? 1
                );
                $baseQuantity = round($quantity * $conversionFactor, 3);

                if ($baseQuantity <= 0) {
                    throw ValidationException::withMessages([
                        'lines' => 'مقدار برگشتی برای واحد پایه کمتر از حد مجاز است.',
                    ]);
                }

                $returnTotal += $lineTotal;
                $preparedLines[] = [
                    $saleLine,
                    $lineData,
                    $quantity,
                    $conversionFactor,
                    $baseQuantity,
                    $unitPrice,
                    $lineTotal,
                ];
            }

            $returnTotal = round($returnTotal, 2);
            $refundAmount = round((float) ($data['refund_amount'] ?? 0), 2);
            $remainingSaleValue = max(
                0,
                (float) $lockedSale->after_descount_total
                    - $previousReturnTotal
                    - $returnTotal,
            );
            $maximumRefund = min(
                $returnTotal,
                max(0, $paidAmount - $previousRefundTotal - $remainingSaleValue),
            );

            if ($refundAmount > 0 && empty($data['refund_method'])) {
                throw ValidationException::withMessages([
                    'refund_method' => 'روش بازپرداخت را انتخاب کنید.',
                ]);
            }
            if ($refundAmount > $maximumRefund + 0.000001) {
                throw ValidationException::withMessages([
                    'refund_amount' => 'مبلغ بازپرداخت بیشتر از مبلغ قابل پرداخت برای این برگشت است.',
                ]);
            }

            if ($refundAmount > 0 && $data['refund_method'] === 'cash') {
                $account = ShopAccount::query()
                    ->where('currency_id', $lockedSale->currency_id)
                    ->lockForUpdate()
                    ->first();
                if (! $account || (float) $account->amount < $refundAmount) {
                    throw ValidationException::withMessages([
                        'refund_amount' => 'موجودی حساب برای بازپرداخت نقدی کافی نیست.',
                    ]);
                }
                $account->decrement('amount', $refundAmount);
            }

            $saleReturn = SaleReturn::query()->create([
                'sale_id' => $lockedSale->id,
                'location_id' => $data['location_id'],
                'invoice_id' => $lockedInvoice?->id,
                'created_by' => $request->user()?->id,
                'return_number' => 'SR-' . now()->format('YmdHis') . '-' . random_int(100, 999),
                'status' => $refundAmount > 0 ? 'refunded' : 'received',
                'reason' => $data['reason'] ?? null,
                'currency' => $lockedSale->currency?->name ?? 'AFG',
                'total' => $returnTotal,
                'refund_amount' => $refundAmount,
                'refund_method' => $refundAmount > 0 ? $data['refund_method'] : null,
                'refund_reference' => $refundAmount > 0 ? ($data['refund_reference'] ?? null) : null,
                'requested_at' => now(),
                'received_at' => now(),
                'refunded_at' => $refundAmount > 0 ? now() : null,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($preparedLines as [
                $saleLine,
                $lineData,
                $quantity,
                $conversionFactor,
                $baseQuantity,
                $unitPrice,
                $lineTotal,
            ]) {
                SaleReturnLine::query()->create([
                    'sale_return_id' => $saleReturn->id,
                    'sale_line_id' => $saleLine->id,
                    'item_id' => $saleLine->item_id,
                    'item_unit_id' => $saleLine->item_unit_id,
                    'quantity' => $quantity,
                    'conversion_factor' => $conversionFactor,
                    'base_quantity' => $baseQuantity,
                    'unit_price' => $unitPrice,
                    'line_total' => $lineTotal,
                    'condition' => $lineData['condition'] ?? null,
                    'restock_action' => $lineData['restock_action'],
                    'notes' => $lineData['notes'] ?? null,
                ]);

                if ($lineData['restock_action'] === 'restock') {
                    (new InvMovement())->move(
                        (int) $data['location_id'],
                        (int) $saleLine->item_id,
                        $baseQuantity,
                        'sale_return',
                        $lineData['notes'] ?? $data['notes'] ?? 'جنس برگشتی دوباره به موجودی اضافه شد',
                        '+',
                    );
                }
            }

            $returnedTotal = (float) SaleReturnLine::query()
                ->whereHas('saleReturn', fn ($query) => $query->where('sale_id', $lockedSale->id))
                ->sum('line_total');
            $lockedSale->update([
                'status' => $returnedTotal + 0.000001 >= (float) $lockedSale->after_descount_total
                    ? 'returned'
                    : 'partially_returned',
            ]);

            if ($lockedInvoice) {
                $lockedInvoice->update([
                    'status' => $returnedTotal + 0.000001 >= (float) $lockedInvoice->total
                        ? 'refunded'
                        : 'partially_refunded',
                ]);
            }

            return $saleReturn;
        }, 3);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "برگشت {$return->return_number} با موفقیت ثبت شد.",
        ]);

        return redirect()->route('sales.index')->with(
            'success',
            "برگشت {$return->return_number} با موفقیت ثبت شد.",
        );
    }

    private function returnedQuantities(int $saleId, bool $lock = false): Collection
    {
        $query = SaleReturnLine::query()
            ->select('sale_line_id', DB::raw('SUM(quantity) as returned_quantity'))
            ->whereHas('saleReturn', fn ($relation) => $relation->where('sale_id', $saleId))
            ->groupBy('sale_line_id');
        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->pluck('returned_quantity', 'sale_line_id');
    }
}
