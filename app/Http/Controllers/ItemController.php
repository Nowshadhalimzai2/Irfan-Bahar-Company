<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Models\Category;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ItemController extends Controller
{
    public function index(): Response
    {

        $items = Item::with('product')->paginate(10);
        return Inertia::render('item/index', compact('items'));
    }

    public function create(): Response
    {

        $categories = Category::select('id', 'name')->get();

        return Inertia::render('item/create', compact('categories'));
    }

    public function store(Request $request)
    {
        DB::beginTransaction();
        $itemData = [];
        try {
            $itemData = $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:8',
                'sku' => 'required|unique:items,sku|string|max:12',
                'item_type' => 'required|string',
                'price' => 'required|numeric',
                'category_id' => 'required|exists:categories,id',
                'unit' => 'required|string',
            ]);

            $productData = [];

            if ($itemData['item_type'] === 'product') {
                $productData = $request->validate([
                    'barcode' => 'nullable|string|max:16|unique:products,barcode',
                    'weight' => 'required|numeric',
                    'contains' => 'required|integer',
                    'description' => 'nullable|string|max:255',
                ]);
            }

            $item = Item::create([
                'name' => $itemData['name'],
                'code' => $itemData['code'],
                'sku' => $itemData['sku'],
                'item_type' => $itemData['item_type'],
                'default_sale_price' => $itemData['price'],
                'category_id' => $itemData['category_id'],
                'unit' => $itemData['unit'],
            ]);

            if ($itemData['item_type'] === 'product') {
                $item->product()->create([
                    'barcode' => $productData['barcode'] ?? null,
                    'weight' => $productData['weight'] ?? 0,
                    'per_pack' => $productData['contains'] ?? 1,
                    'description' => $productData['description'] ?? null,
                ]);
            }

            $log = new Log();
            $log->create('insert', 'جنس نو ثبت شد در سیستم ' . $itemData['name']);
            $request->session()->flash('toast', ['type' => 'success', 'message' => 'جنس نو ثبت شد در سیستم ' . $itemData['name']]);
            DB::commit();

            return redirect()->route('items.index');
        } catch (\Throwable $th) {
            DB::rollBack();
            $request->session()->flash('toast', ['type' => 'error', 'message' => 'جنس نو ثبت نشد در سیستم ' .  ' ' . $th->getMessage()]);

            return redirect()->back();
        }
    }
}
