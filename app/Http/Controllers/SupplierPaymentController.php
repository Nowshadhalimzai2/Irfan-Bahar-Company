<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SupplierPaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'gt:0'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'goods_receipt_id' => ['nullable', 'exists:goods_receipts,id'],
            'currency_id' => ['required', 'exists:currencies,id'],
            'payment_method' => ['required', 'in:cash,bank_transfer,card,other'],
            'reference_no' => ['nullable','max:64'],
            'paid_at' => ['required', 'date'],
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
