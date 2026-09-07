<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    protected $fillable = ['sale_id', 'invoice_number', 'status', 'issued_on', 'due_on', 'paid_at', 'bill_to_name', 'bill_to_address', 'bill_to_phone', 'currency', 'subtotal', 'discount_total', 'total', 'pdf_path', 'notes'];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
}
