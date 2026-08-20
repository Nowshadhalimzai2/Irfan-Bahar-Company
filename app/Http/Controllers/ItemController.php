<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Models\Category;
use App\Models\Item;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ItemController extends Controller
{
    public function index(): Response
    {
        $items = Item::with('product')->orderBy('id','desc')->paginate(10);

        return Inertia::render('item/index', compact('items'));
    }

    public function create(): Response
    {

        $categories = Category::select('id', 'name')->get();

        return Inertia::render('item/create', compact('categories'));
    }

    public function store(Request $request): RedirectResponse
    {
        $itemData = $request->validate([
            'name' => 'required|string|max:255',
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
        DB::beginTransaction();
        try {

            $item = Item::create([
                'name' => $itemData['name'],
                'code' => '',
                'sku' => 'TMP-'.strtoupper(Str::random(8)),
                'item_type' => $itemData['item_type'],
                'default_sale_price' => $itemData['price'],
                'category_id' => $itemData['category_id'],
                'unit' => $itemData['unit'],
            ]);

            $item->code = $this->generateItemCode($item);
            $item->save();

            if ($itemData['item_type'] === 'product') {
                $item->product()->create([
                    'barcode' => filled($productData['barcode'] ?? null)
                        ? trim($productData['barcode'])
                        : $this->generateBarcode($item),
                    'weight' => $productData['weight'],
                    'per_pack' => $productData['per_pack'],
                    'description' => $productData['description'] ?? null,
                ]);
                $item->load('product');
            }

            $item->sku = $this->generateSKU($item);
            $item->save();

            (new Log)->create('insert', 'جنس نو ثبت شد در سیستم '.$itemData['name'], null, '/items');

            DB::commit();
            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'جنس نو ثبت شد در سیستم '.$itemData['name'],
            ]);

            return redirect()->route('items.index');
        } catch (\Throwable $th) {
            DB::rollBack();
            report($th);
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'جنس نو ثبت نشد در سیستم.'.$th->getMessage(),
            ]);

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
        if ($item->item_type == 'product') {
            return sprintf('%s-%d-%d-%s-%s', $acronym, $item->product->weight, $item->product->per_pack, str(Carbon::now(config('app.timezone'))->year), str_pad($item->id, 3, '0', STR_PAD_LEFT));
        }

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
            case 'raw_material':
                return 'RM';
            case 'raw_materail':
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

    private function generateBarcode(Item $item): string
    {
        $payload = '200'.str_pad((string) $item->id, 9, '0', STR_PAD_LEFT);
        $sum = 0;

        foreach (str_split($payload) as $position => $digit) {
            $sum += (int) $digit * ($position % 2 === 0 ? 1 : 3);
        }

        $checkDigit = (10 - ($sum % 10)) % 10;

        return $payload.$checkDigit;
    }

    private function generateItemCode(Item $item): string
    {
        $item->loadMissing('category:id,name');
        $prefix = $this->getCategoryAcronym($item->category->name ?? '');

        return $prefix.'-'.str_pad((string) $item->id, 6, '0', STR_PAD_LEFT);
    }
}
