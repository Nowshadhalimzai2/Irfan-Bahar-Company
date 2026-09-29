<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Models\Category;
use App\Models\Item;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ItemController extends Controller
{
    public function index(): Response
    {
        // Gate::authorize('manage-users');

        $items = Item::with('product')
            ->orderByDesc('id')
            ->paginate(10);

        return Inertia::render('item/index', compact('items'));
    }

    public function create(): Response
    {
        Gate::authorize('manage-users');

        $categories = Category::select('id', 'name')->get();

        return Inertia::render('item/create', compact('categories'));
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('manage-users');

        $itemData = $this->validateItemData($request);
        $productData = $this->validateProductData($request, null, $itemData['item_type'], null);

        try {
            $item = DB::transaction(function () use ($itemData, $productData): Item {
                $item = Item::create([
                    'name' => $itemData['name'],
                    'code' => '',
                    'sku' => 'TMP-' . strtoupper(Str::random(8)),
                    'item_type' => $itemData['item_type'],
                    'default_sale_price' => $itemData['price'],
                    'category_id' => $itemData['category_id'],
                    'unit' => $itemData['unit'],
                ]);

                $this->syncProduct($item, $productData, true);
                $this->refreshIdentifiers($item);

                (new Log)->create(
                    'insert',
                    'جنس نو ثبت شد در سیستم ' . $itemData['name'],
                    null,
                    '/items'
                );

                return $item;
            });

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'جنس نو ثبت شد در سیستم ' . $item->name,
            ]);

            return redirect()->route('items.index');
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (QueryException $exception) {
            report($exception);

            return $this->failure('جنس نو ثبت نشد در سیستم. مقدار تکراری وارد شده است.');
        } catch (\Throwable $exception) {
            report($exception);

            return $this->failure('جنس نو ثبت نشد در سیستم.');
        }
    }

    public function edit(Item $item): Response
    {
        Gate::authorize('manage-users');

        $categories = Category::select('id', 'name')->get();
        $item->load('product:item_id,weight,barcode,per_pack,description');

        return Inertia::render('item/edit', [
            'item' => $item,
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, Item $item): RedirectResponse
    {
        Gate::authorize('manage-users');

        $item->load('product');
        $itemData = $this->validateItemData($request);
        $productData = $this->validateProductData($request, $item->product?->item_id, $itemData['item_type'], $item->product?->barcode);

        try {
            $updatedItem = DB::transaction(function () use ($item, $itemData, $productData): Item {
                $item->update([
                    'name' => $itemData['name'],
                    'item_type' => $itemData['item_type'],
                    'default_sale_price' => $itemData['price'],
                    'category_id' => $itemData['category_id'],
                    'unit' => $itemData['unit'],
                ]);

                $this->syncProduct($item, $productData, false);
                $this->refreshIdentifiers($item);

                $description = 'جنس ویرایش شد در سیستم ' . $itemData['name'];
                (new Log)->create('update', $description, null, '/items');

                return $item->fresh(['product']);
            });

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'جنس ویرایش شد در سیستم ' . $updatedItem->name,
            ]);

            return redirect()->route('items.index');
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (QueryException $exception) {
            report($exception);

            return $this->failure('جنس ویرایش نشد در سیستم. مقدار تکراری وارد شده است.');
        } catch (\Throwable $exception) {
            report($exception);

            return $this->failure('جنس ویرایش نشد در سیستم.');
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function validateItemData(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            // Keep non-product item types open because the original application
            // may use more than one non-product value.
            'item_type' => ['required', 'string', 'max:50'],
            'price' => ['required', 'numeric', 'min:0'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'unit' => ['required', 'string', 'max:50'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateProductData(
        Request $request,
        ?int $productId,
        string $itemType,
        ?string $currentBarcode
    ): array {
        if ($itemType !== 'product') {
            return [];
        }

        $incomingBarcode = $request->input('barcode');

        $incomingBarcode = filled($incomingBarcode)
            ? trim((string) $incomingBarcode)
            : null;

        $currentBarcode = filled($currentBarcode)
            ? trim((string) $currentBarcode)
            : null;

        $request->merge([
            'barcode' => $incomingBarcode,
        ]);

        $barcodeRules = [
            'nullable',
            'string',
            'max:16',
        ];

        // Only apply unique validation if the barcode actually changed.
        if ($incomingBarcode !== null && $incomingBarcode !== $currentBarcode) {
            $barcodeRules[] = Rule::unique('products', 'barcode')
                ->ignore($productId, 'item_id');
        }

        return $request->validate([
            'barcode' => $barcodeRules,
            'weight' => ['required', 'numeric', 'gt:0'],
            'per_pack' => ['required', 'integer', 'min:1'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);
    }
    /**
     * Creates, updates, or removes the product relation to match item_type.
     *
     * @param array<string, mixed> $productData
     */
    private function syncProduct(Item $item, array $productData, bool $creating): void
    {
        if ($item->item_type !== 'product') {
            if (!$creating) {
                $item->product()->delete();
            }

            return;
        }

        $product = $item->product;
        $barcode = $productData['barcode'] ?? null;

        if (!$product) {
            $item->product()->create([
                'barcode' => $barcode ?? $this->generateBarcode($item),
                'weight' => $productData['weight'],
                'per_pack' => $productData['per_pack'],
                'description' => $productData['description'] ?? null,
            ]);

            return;
        }

        $newBarcode = $barcode ?? $this->generateBarcode($item);

        $productAttributes = [
            'weight' => $productData['weight'],
            'per_pack' => $productData['per_pack'],
            'description' => $productData['description'] ?? null,
        ];

        if ($product->barcode !== $newBarcode) {
            $duplicate = Product::where('barcode', $newBarcode)
                ->where('item_id', '!=', $product->getKey())
                ->exists();

            if ($duplicate) {
                throw ValidationException::withMessages([
                    'barcode' => 'This barcode is already assigned to another product.',
                ]);
            }

            $productAttributes['barcode'] = $newBarcode;
        }

        $product->update($productAttributes);
    }

    private function refreshIdentifiers(Item $item): void
    {
        $item->load(['category:id,name', 'product']);

        $item->update([
            'code' => $this->generateItemCode($item),
            'sku' => $this->generateSKU($item),
        ]);
    }

    private function generateSKU(Item $item): string
    {
        $acronym = $this->getCategoryAcronym($item->category?->name ?? '');
        $year = (string) Carbon::now(config('app.timezone'))->year;
        $itemNumber = str_pad((string) $item->id, 3, '0', STR_PAD_LEFT);

        if ($item->item_type === 'product' && $item->product) {
            $weight = $this->formatNumber($item->product->weight);

            return sprintf(
                '%s-%s-%d-%s-%s',
                $acronym,
                $weight,
                $item->product->per_pack,
                $year,
                $itemNumber
            );
        }

        return sprintf('%s-%s-%s', $acronym, $year, $itemNumber);
    }

    private function formatNumber(float|int|string $value): string
    {
        return rtrim(rtrim(number_format((float) $value, 6, '.', ''), '0'), '.') ?: '0';
    }

    private function getCategoryAcronym(string $name): string
    {
        return match (Str::lower(trim($name))) {
            'soap' => 'SP',
            'powder' => 'PDR',
            'vaseline' => 'VSL',
            'shampoo' => 'SMP',
            'raw_material', 'raw_materail' => 'RM',
            'acid', 'asid' => 'ACD',
            'packing' => 'PKN',
            default => $this->fallbackAcronym($name),
        };
    }

    private function fallbackAcronym(string $name): string
    {
        $name = trim($name);

        return $name === ''
            ? 'OTR'
            : Str::upper(Str::substr($name, 0, 3));
    }

    private function generateBarcode(Item $item): string
    {
        $payload = '200' . str_pad((string) $item->id, 9, '0', STR_PAD_LEFT);
        $sum = 0;

        foreach (str_split($payload) as $position => $digit) {
            $sum += (int) $digit * ($position % 2 === 0 ? 1 : 3);
        }

        return $payload . ((10 - ($sum % 10)) % 10);
    }

    private function generateItemCode(Item $item): string
    {
        $prefix = $this->getCategoryAcronym($item->category?->name ?? '');

        return $prefix . '-' . str_pad((string) $item->id, 6, '0', STR_PAD_LEFT);
    }

    private function failure(string $message): RedirectResponse
    {
        Inertia::flash('toast', [
            'type' => 'error',
            'message' => $message,
        ]);

        return redirect()->back();
    }
}
