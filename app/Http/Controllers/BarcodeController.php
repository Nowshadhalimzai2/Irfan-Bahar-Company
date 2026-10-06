<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Picqer\Barcode\Renderers\SvgRenderer;
use Picqer\Barcode\Types\TypeCode128;

class BarcodeController extends Controller
{
    public function index()
    {
        $products = Product::query()
            ->with(['item:id,name,code,sku,unit,category_id', 'item.category:id,name'])
            ->whereNotNull('barcode')
            ->where('barcode', '<>', '')
            ->whereHas('item')
            ->orderBy('item_id')
            ->get();

        $missingBarcodeCount = Product::query()
            ->where(function ($query) {
                $query->whereNull('barcode')->orWhere('barcode', '');
            })
            ->count();

        return Inertia::render('barcode', [
            'products' => $products->map(fn (Product $product) => [
                'id' => $product->item_id,
                'name' => $product->item->name,
                'code' => $product->item->code,
                'sku' => $product->item->sku,
                'unit' => $product->item->unit,
                'category' => $product->item->category?->name,
                'weight' => (float) $product->weight,
                'perPack' => $product->per_pack,
                'barcode' => $product->barcode,
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
