<?php

namespace App\Http\Controllers;

use App\Custome\InvMovement;
use App\Custome\SHA;
use App\Models\Expense;
use App\Models\Location;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\SaleReturnLine;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SaleReturnController extends Controller
{
    public function create(Sale $sale): Response
    {
       Gate::allowIf($sale->status!='cancelled','این جنس لغو شده است.');
        $sale->load(['customer:id,name', 'currency:id,name', 'invoice', 'saleLines.item:id,name,unit', 'invoice.payments:id,invoice_id,amount']);
        $returnedQuantities = $this->returnedQuantities($sale->id);
        $locations = Location::query()->where('type', 'shop')->where('is_active', true)->orderBy('name')->get(['id', 'name']);
        return Inertia::render('sale-return/create', [
            'sale' => $sale,
            'locations' => $locations,
            'paidAmount' => $sale?->invoice->payments()->sum('amount'),
            'returnableLines' => $sale->saleLines->map(function ($line) use ($returnedQuantities) {
                $returned = (float) ($returnedQuantities[$line->id] ?? 0);

                return [
                    'id' => $line->id,
                    'item_id' => $line->item_id,
                    'item_name' => $line->item?->name,
                    'unit' => $line->unit,
                    'quantity' => (float) $line->quantity,
                    'returned_quantity' => $returned,
                    'remaining_quantity' => max(0, (float) $line->quantity - $returned),
                    'unit_price' => (float) $line->unit_price,
                ];
            })->values(),
        ]);
    }

    public function store(Request $request, Sale $sale): RedirectResponse
    {
        if ($sale->status == 'cancelled') {
            abort(505,'این جنس قبلا لغو شده است. قابل بازګشت نمودن نیست');
        }
        $data = $request->validate([
            'location_id' => ['required', 'integer', 'exists:locations,id'],
            'reason' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'refund_amount' => ['nullable', 'numeric', 'min:0'],
            'refund_method' => ['nullable', 'string', 'max:30'],
            'refund_reference' => ['nullable', 'string', 'max:255'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.sale_line_id' => ['required', 'integer', 'distinct'],
            'lines.*.quantity' => ['required', 'numeric', 'gt:0'],
            'lines.*.condition' => ['nullable', 'string', 'max:30'],
            'lines.*.restock_action' => ['required', 'in:restock,none'],
            'lines.*.notes' => ['nullable', 'string', 'max:500'],
        ]);

        $return = DB::transaction(function () use ($data, $request, $sale): SaleReturn {
            $lockedSale = Sale::query()->with(['saleLines', 'invoice', 'currency'])->lockForUpdate()->findOrFail($sale->id);
            $saleLines = $lockedSale->saleLines->keyBy('id');
            $returnedQuantities = $this->returnedQuantities($lockedSale->id, true);
            $returnTotal = 0.0;
            $preparedLines = [];

            foreach ($data['lines'] as $lineData) {
                $saleLine = $saleLines->get((int) $lineData['sale_line_id']);
                if (! $saleLine) {
                    throw ValidationException::withMessages(['lines' => 'یکی از اقلام متعلق به این فروش نیست.']);
                }

                $quantity = (float) $lineData['quantity'];
                $remaining = (float) $saleLine->quantity - (float) ($returnedQuantities[$saleLine->id] ?? 0);
                if ($quantity > $remaining + 0.000001) {
                    throw ValidationException::withMessages(['lines' => "مقدار قابل برگشت برای این قلم بیشتر از مقدار باقی‌مانده است."]);
                }

                $unitPrice = $lockedSale->returnValueForUnitPrice((float) $saleLine->unit_price);
                $lineTotal = round($quantity * $unitPrice, 2);
                $returnTotal += $lineTotal;
                $preparedLines[] = [$saleLine, $lineData, $quantity, $unitPrice, $lineTotal];
            }

            $refundAmount = (float) ($data['refund_amount'] ?? 0);
            if ($refundAmount > 0 && empty($data['refund_method'])) {
                throw ValidationException::withMessages(['refund_method' => 'روش بازپرداخت را انتخاب کنید.']);
            }
            if ($refundAmount > $returnTotal + 0.000001) {
                throw ValidationException::withMessages(['refund_amount' => 'مبلغ بازپرداخت نمی‌تواند بیشتر از مبلغ برگشت باشد.']);
            }
            // dd($lockedSale->amount_paid + 0.000001);
            if ($refundAmount > (float) $lockedSale->amount_paid + 0.000001) {
                throw ValidationException::withMessages(['refund_amount' => 'مبلغ بازپرداخت نمی‌تواند بیشتر از مبلغ دریافت‌شده باشد.']);
            }
            if ($refundAmount > 0 && ! (new SHA())->debit($refundAmount, (int) $lockedSale->currency_id)) {
                throw ValidationException::withMessages(['refund_amount' => 'موجودی حساب برای بازپرداخت کافی نیست.']);
            }

            $saleReturn = SaleReturn::query()->create([
                'sale_id' => $lockedSale->id,
                'location_id' => $data['location_id'],
                'invoice_id' => $lockedSale->invoice?->id,
                'created_by' => $request->user()?->id,
                'return_number' => 'SR-' . now()->format('YmdHis') . '-' . random_int(100, 999),
                'status' => $refundAmount > 0 ? 'refunded' : 'received',
                'reason' => $data['reason'] ?? null,
                'currency' => $lockedSale->currency?->name ?? 'AFG',
                'total' => $returnTotal,
                'refund_amount' => $refundAmount,
                'refund_method' => $refundAmount > 0 ? $data['refund_method'] : null,
                'refund_reference' => $data['refund_reference'] ?? null,
                'requested_at' => now(),
                'received_at' => now(),
                'refunded_at' => $refundAmount > 0 ? now() : null,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($preparedLines as [$saleLine, $lineData, $quantity, $unitPrice, $lineTotal]) {
                SaleReturnLine::query()->create([
                    'sale_return_id' => $saleReturn->id,
                    'sale_line_id' => $saleLine->id,
                    'item_id' => $saleLine->item_id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'line_total' => $lineTotal,
                    'condition' => $lineData['condition'] ?? null,
                    'restock_action' => $lineData['restock_action'],
                    'notes' => $lineData['notes'] ?? null,
                ]);
                if ($data['refund_method'] == 'cash' && $refundAmount > 0) {
                    Expense::create([
                        'amount' => $data['refund_amount'],
                        'currency_id' => $lockedSale->currency?->name ?? 'AFG',
                        'description' => sprintf('بل %s بازګشت شد', $lockedSale->invoice->invoice_number),
                        'date' => now(config('app.timezone')),
                    ]);
                }
                if ($lineData['restock_action'] === 'restock') {
                    $moved = (new InvMovement())->move((int) $data['location_id'], (int) $saleLine->item_id, $quantity, 'sale_return', $data['notes'] ?? 'جنس برگشتی دوباره به موجودی اضافه شد', '+');
                    if (! $moved) {
                        throw ValidationException::withMessages(['location_id' => 'ثبت حرکت موجودی برگشتی انجام نشد.']);
                    }
                }
            }

            $returnedTotal = (float) SaleReturnLine::query()->whereHas('saleReturn', fn($query) => $query->where('sale_id', $lockedSale->id))->sum('line_total');
            $lockedSale->update(['status' => $returnedTotal >= (float) $lockedSale->after_descount_total ? 'returned' : 'partially_returned']);
            if ($lockedSale->invoice) {
                $lockedSale->invoice->update(['status' => $returnedTotal >= (float) $lockedSale->invoice->total ? 'refunded' : 'partially_refunded']);
            }
            Inertia::flash('toast', ['type' => 'success', 'message' => sprintf('بل نمبر %s بازګشت شد ', $lockedSale->invoice->invoice_number)]);
            return $saleReturn;
        }, 3);

        return redirect()->route('sales.index')->with('success', "برگشت {$return->return_number} با موفقیت ثبت شد.");
    }

    private function returnedQuantities(int $saleId, bool $lock = false)
    {
        $query = SaleReturnLine::query()->select('sale_line_id', DB::raw('SUM(quantity) as returned_quantity'))->whereHas('saleReturn', fn($relation) => $relation->where('sale_id', $saleId))->groupBy('sale_line_id');
        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->pluck('returned_quantity', 'sale_line_id');
    }
}
