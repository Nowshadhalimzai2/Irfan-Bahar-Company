<?php

namespace App\Http\Controllers;

use App\Models\ItemUnit;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Picqer\Barcode\Renderers\SvgRenderer;
use Picqer\Barcode\Types\TypeCode128;

class BarcodeController extends Controller
{
    public function index()
    {
        $units = ItemUnit::query()
            ->with([
                'item:id,name,code,sku,item_type,category_id,base_unit_id',
                'item.category:id,name',
                'item.baseUnit:id,item_id,name,symbol',
                'item.product:item_id,weight',
            ])
            ->where('is_active', true)
            ->whereNotNull('barcode')
            ->where('barcode', '<>', '')
            ->whereHas('item')
            ->orderBy('item_id')
            ->orderBy('conversion_to_base')
            ->get();

        $missingBarcodeCount = ItemUnit::query()
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('barcode')->orWhere('barcode', '');
            })
            ->whereHas('item')
            ->count();

        return Inertia::render('barcode', [
            'units' => $units->map(fn (ItemUnit $unit) => [
                'id' => $unit->id,
                'item_id' => $unit->item_id,
                'item_name' => $unit->item->name,
                'item_code' => $unit->item->code,
                'item_sku' => $unit->item->sku,
                'item_type' => $unit->item->item_type,
                'category' => $unit->item->category?->name,
                'product_weight' => $unit->item->product?->weight === null
                    ? null
                    : (float) $unit->item->product->weight,
                'unit_name' => $unit->name,
                'unit_symbol' => $unit->symbol,
                'base_unit_name' => $unit->item->baseUnit?->name,
                'base_unit_symbol' => $unit->item->baseUnit?->symbol,
                'conversion_to_base' => (float) $unit->conversion_to_base,
                'barcode' => $unit->barcode,
                'is_active' => $unit->is_active,
            ])->values(),
            'missingBarcodeCount' => $missingBarcodeCount,
        ]);
    }

    public function show(Request $request)
    {
        $value = $request->query('value');
        abort_unless(is_string($value) && preg_match('/\A[\x20-\x7E]{1,50}\z/D', $value), 404);

        $barcode = (new TypeCode128)->getBarcode($value);
        $svg = (new SvgRenderer)->render($barcode, 360, 100);
        $response = response($svg)->header('Content-Type', 'image/svg+xml');
        
        if ($request->boolean('download')) {
            $filename = preg_replace('/[^A-Za-z0-9_-]/', '-', $value);
            $response->header('Content-Disposition', 'attachment; filename="barcode-'.$filename.'.svg"');
        }

        return $response;
    }
}
