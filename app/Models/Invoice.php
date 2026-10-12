<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    protected $fillable = ['sale_id', 'invoice_number', 'status', 'issued_on', 'due_on', 'paid_at', 'bill_to_name', 'bill_to_address', 'bill_to_phone', 'currency', 'subtotal', 'discount_total', 'total', 'pdf_path', 'notes'];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
    public function saleReturns(): hasMany
    {
        return $this->hasMany(SaleReturn::class);
    }

    public function financialSummary(): array
    {
        $paymentsTotal = $this->relationLoaded('payments')
            ? (float) $this->payments->sum('amount')
            : (float) $this->payments()->sum('amount');

        $hasPayments = $this->relationLoaded('payments')
            ? $this->payments->isNotEmpty()
            : $this->payments()->exists();

        $sale = $this->relationLoaded('sale') 
            ? $this->sale
            : $this->sale()->first(['id', 'amount_paid']);

        $returns = $sale && $sale->relationLoaded('saleReturns')
            ? $sale->saleReturns
            : SaleReturn::query()->where('sale_id', $this->sale_id)->get();

        $grossPaid = $hasPayments
            ? $paymentsTotal
            : (float) ($sale?->amount_paid ?? 0);

        $originalTotal = (float) $this->total;
        $returnTotal = (float) $returns->sum('total');
        $refundedAmount = (float) $returns->sum('refund_amount');
        $netTotal = max(0, $originalTotal - $returnTotal);
        $netPaid = min($netTotal, max(0, $grossPaid - $refundedAmount));
        $due = $sale?->status === 'cancelled' ? 0.0 : max(0, $netTotal - $netPaid);

        return [
            'original_total' => $originalTotal,
            'return_total' => $returnTotal,
            'refunded_amount' => $refundedAmount,
            'gross_paid' => $grossPaid,
            'total' => $netTotal,
            'paid' => $netPaid,
            'due' => $due,
        ];
    }
}
