<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Models\Category;
use App\Models\Item;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
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
        $itemData = [];
        try {
            $itemData = $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:12',
                // 'per_pack' => 'required|unique:items,sku|string|max:12',
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
                    'per_pack' => 'required|integer',
                    'description' => 'nullable|string|max:255',
                ]);
            }

           
            // start DB transaction only after validation passed
            DB::beginTransaction();

            $item = Item::create([
                'name' => $itemData['name'],
                'code' => $itemData['code'],
                'sku' => '',
                'item_type' => $itemData['item_type'],
                'default_sale_price' => $itemData['price'],
                'category_id' => $itemData['category_id'],
                'unit' => $itemData['unit'],
            ]);
            // If item is a product, create product first so SKU generation can use product data
            if ($itemData['item_type'] === 'product') {
                $item->product()->create([
                    'barcode' => $productData['barcode'] ?? null,
                    'weight' => $productData['weight'] ?? 0,
                    'per_pack' => $productData['per_pack'] ?? 1,
                    'description' => $productData['description'] ?? null,
                ]);
                $item->load('product');
            }

            //  GENERATE SKU 
            $item->sku = $this->generateSKU($item);
            $item->save();

            $log = new Log();
            $log->create('insert', 'جنس نو ثبت شد در سیستم ' . $itemData['name']);
            $request->session()->flash('toast', ['type' => 'success', 'message' => 'جنس نو ثبت شد در سیستم ' . $itemData['name']]);
            DB::commit();

            return redirect()->route('items.index');
        } catch (\Throwable $th) {
            // Let validation exceptions bubble so Inertia/Laravel can return proper validation responses
            if ($th instanceof ValidationException) {
                throw $th;
                Inertia::Flash('toast', ['type' => 'error', 'message' => 'جنس نو ثبت نشد در سیستم ' .  ' ' . $th->getMessage()]);
            }

            DB::rollBack();
            Inertia::Flash('toast', ['type' => 'error', 'message' => 'جنس نو ثبت نشد در سیستم ' .  ' ' . $th->getMessage()]);

            return redirect()->back();
        }
    }


    private function generateSKU(Item $item): string
    {
        $item->load('category:id,name');
        $categoryName = $item->category->name ?? '';
        $acronym = $this->getCategoryAcronym($categoryName);

        if ($acronym === '') {
            $acronym = strtoupper(substr($categoryName, 0, 3));
        }
        if ($item->item_type == 'product')
            return sprintf('%s-%d-%d-%s-%s', $acronym,$item->product->weight,$item->product->per_pack, str(Carbon::now(config('app.timezone'))->year), str_pad($item->id, 3, '0', STR_PAD_LEFT));

        return sprintf('%s-%s-%s', $acronym, str(Carbon::now(config('app.timezone'))->year), str_pad($item->id, 3, '0', STR_PAD_LEFT));
    }

    private function getCategoryAcronym(string $name): string
    {
        switch (strtolower($name)) {
            case 'soap':
                return 'SP';
            case 'powder':
                return 'PDR';
            case 'vaseline':
                return 'VSL';
            case 'shampoo':
                return 'SMP';
            case 'raw_material' :
                return 'RM';
            case 'raw_materail' :
                return 'RM';
            case 'acid':
                return 'ACD';
            case 'asid':
                return 'ACD';
            case 'packing':
                return 'PKN';
            default:
                return 'OTR';
        }
    }
}
