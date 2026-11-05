<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Models\Category;
use App\Models\Item;
use App\Models\ItemUnit;
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

        $items = Item::with([
            'category:id,name',
            'product:item_id,weight,description',
            'baseUnit:id,item_id,name,symbol,conversion_to_base,selling_price,purchase_price,code,barcode,is_active',
            'units:id,item_id,name,symbol,conversion_to_base,selling_price,purchase_price,code,barcode,is_active',
        ])
            ->orderByDesc('id')
            ->paginate(10);

        return Inertia::render('item/index', compact('items'));
    }

    public function create(): Response
    {
        // Gate::authorize('manage-users');

        $categories = Category::select('id', 'name')->get();

        return Inertia::render('item/create', compact('categories'));
    }

    public function show(Item $item): Response
    {
        $item->load([
            'category:id,name',
            'product:item_id,weight,description',
            'baseUnit:id,item_id,name,symbol,conversion_to_base,selling_price,purchase_price,code,barcode,is_active',
            'units:id,item_id,name,symbol,conversion_to_base,selling_price,purchase_price,code,barcode,is_active',
            'inventoryBalances:id,item_id,location_id,quantity_on_hand,reserved',
            'inventoryBalances.location:id,name',
        ]);

        return Inertia::render('item/show', compact('item'));
    }

    public function destroy(Item $item): RedirectResponse
    {
        Gate::authorize('manage-users');

        $protectedReferences = [
            'sale_lines' => 'item_id',
            'sale_return_lines' => 'item_id',
            'goods_receipt_lines' => 'item_id',
            'inventory_balances' => 'item_id',
            'inventory_movements' => 'item_id',
            'transfer_lines' => 'item_id',
            'bom_lines' => 'item_id',
            'production_inputs' => 'item_id',
            'production_outputs' => 'product_id',
            'wastes' => 'item_id',
        ];

        foreach ($protectedReferences as $table => $column) {
            if (DB::table($table)->where($column, $item->id)->exists()) {
                return redirect()
                    ->back()
                    ->withErrors([
                        'item' => 'این جنس سابقه عملیاتی دارد و حذف نمی‌شود. واحدهای آن را غیرفعال کنید.',
                    ]);
            }
        }

        $item->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'جنس با موفقیت حذف شد.',
        ]);

        return redirect()->route('items.index');
    }

    public function store(Request $request): RedirectResponse
    {
        // Gate::authorize('manage-users');

        $itemData = $this->validateCreateItemData($request);
        $productData = $this->validateProductData($request, $itemData['item_type']);

        try {
            $item = DB::transaction(function () use ($itemData, $productData): Item {
                $item = Item::create([
                    'name' => $itemData['name'],
                    'code' => 'TMP-' . strtoupper(Str::random(8)),
                    'sku' => 'TMP-' . strtoupper(Str::random(8)),
                    'item_type' => $itemData['item_type'],
                    'default_sale_price' => $itemData['base_unit']['selling_price'],
                    'category_id' => $itemData['category_id'],
                    // Legacy compatibility; the canonical value is the
                    // related base unit row.
                    'unit' => $itemData['base_unit']['name'],
                ]);

                $this->syncProduct($item, $productData, true);
                $this->refreshIdentifiers($item, true);
                $this->syncUnits(
                    $item,
                    $itemData['base_unit'],
                    $itemData['additional_units'] ?? []
                );

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
        $item->load([
            'category:id,name',
            'product:item_id,weight,description',
            'baseUnit:id,item_id,name,symbol,conversion_to_base,selling_price,purchase_price,code,barcode,is_active',
            'units:id,item_id,name,symbol,conversion_to_base,selling_price,purchase_price,code,barcode,is_active',
        ]);

        return Inertia::render('item/edit', [
            'item' => $item,
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, Item $item): RedirectResponse
    {
        Gate::authorize('manage-users');

        $item->load(['product', 'baseUnit', 'units']);
        $itemData = $this->validateUpdateItemData($request, $item);
        $productData = $this->validateProductData($request, $itemData['item_type']);

        try {
            $updatedItem = DB::transaction(function () use ($item, $itemData, $productData): Item {
                $item->update([
                    'name' => $itemData['name'],
                    'item_type' => $itemData['item_type'],
                    'default_sale_price' => $itemData['base_unit']['selling_price'],
                    'category_id' => $itemData['category_id'],
                    // Legacy compatibility; the canonical value is the
                    // related base unit row.
                    'unit' => $itemData['base_unit']['name'],
                ]);

                $this->syncProduct($item, $productData, false);
                $this->refreshIdentifiers($item);
                $this->syncItemUnits(
                    $item,
                    $itemData['base_unit'],
                    $itemData['additional_units'] ?? []
                );

                $description = 'جنس ویرایش شد در سیستم ' . $itemData['name'];
                (new Log)->create('update', $description, null, '/items');

                return $item->fresh(['product', 'baseUnit', 'units']);
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
     * Validate the create form's canonical unit structure.
     *
     * The legacy unit and price columns remain on items temporarily, but new
     * records are sourced from the base unit row and item_units rows.
     *
     * @return array<string, mixed>
     */
    private function validateCreateItemData(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'item_type' => ['required', Rule::in(['product', 'raw_material', 'packing'])],
            'category_id' => ['required', 'integer', 'exists:categories,id'],

            'base_unit' => ['required', 'array'],
            'base_unit.name' => ['required', 'string', 'max:50'],
            'base_unit.symbol' => ['nullable', 'string', 'max:20'],
            'base_unit.conversion_to_base' => ['required', 'numeric', 'gt:0'],
            'base_unit.barcode' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('item_units', 'barcode'),
            ],
            'base_unit.selling_price' => ['required', 'numeric', 'min:0'],
            'base_unit.purchase_price' => ['nullable', 'numeric', 'min:0'],

            'additional_units' => ['nullable', 'array', 'max:20'],
            'additional_units.*.name' => ['required', 'string', 'max:50'],
            'additional_units.*.symbol' => ['nullable', 'string', 'max:20'],
            'additional_units.*.conversion_to_base' => ['required', 'numeric', 'gt:0'],
            'additional_units.*.barcode' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('item_units', 'barcode'),
            ],
            'additional_units.*.selling_price' => ['required', 'numeric', 'min:0'],
            'additional_units.*.purchase_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $units = collect([
            $data['base_unit'],
            ...($data['additional_units'] ?? []),
        ]);
        $duplicateName = $units
            ->map(fn (array $unit): string => Str::lower(trim($unit['name'])))
            ->duplicates()
            ->first();

        if ($duplicateName !== null) {
            throw ValidationException::withMessages([
                'additional_units' => 'هر واحد این جنس باید نام متفاوت داشته باشد.',
            ]);
        }

        $barcodes = $units
            ->pluck('barcode')
            ->filter(fn ($barcode): bool => filled($barcode))
            ->map(fn ($barcode): string => trim((string) $barcode));

        if ($barcodes->count() !== $barcodes->unique()->count()) {
            throw ValidationException::withMessages([
                'additional_units' => 'بارکد هر واحد باید متفاوت باشد.',
            ]);
        }

        // A base unit is always the inventory reference unit.
        $data['base_unit']['conversion_to_base'] = 1;
        $data['additional_units'] = array_values($data['additional_units'] ?? []);

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    private function validateUpdateItemData(Request $request, Item $item): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'item_type' => ['required', Rule::in(['product', 'raw_material', 'packing'])],
            'category_id' => ['required', 'integer', 'exists:categories,id'],

            'base_unit' => ['required', 'array'],
            'base_unit.id' => ['required', 'integer', 'exists:item_units,id'],
            'base_unit.name' => ['required', 'string', 'max:50'],
            'base_unit.symbol' => ['nullable', 'string', 'max:20'],
            'base_unit.conversion_to_base' => ['required', 'numeric', 'gt:0'],
            'base_unit.barcode' => ['nullable', 'string', 'max:50'],
            'base_unit.selling_price' => ['required', 'numeric', 'min:0'],
            'base_unit.purchase_price' => ['nullable', 'numeric', 'min:0'],

            'additional_units' => ['nullable', 'array', 'max:20'],
            'additional_units.*.id' => ['nullable', 'integer', 'exists:item_units,id'],
            'additional_units.*.name' => ['required', 'string', 'max:50'],
            'additional_units.*.symbol' => ['nullable', 'string', 'max:20'],
            'additional_units.*.conversion_to_base' => ['required', 'numeric', 'gt:0'],
            'additional_units.*.barcode' => ['nullable', 'string', 'max:50'],
            'additional_units.*.selling_price' => ['required', 'numeric', 'min:0'],
            'additional_units.*.purchase_price' => ['nullable', 'numeric', 'min:0'],
            'additional_units.*.is_active' => ['required', 'boolean'],
        ]);

        $allowedUnitIds = $item->units->pluck('id')->map(fn ($id): int => (int) $id);
        $submittedUnitIds = collect([
            $data['base_unit']['id'],
            ...collect($data['additional_units'] ?? [])
                ->pluck('id')
                ->filter()
                ->all(),
        ])->map(fn ($id): int => (int) $id);

        if (
            $submittedUnitIds->duplicates()->isNotEmpty()
            || $submittedUnitIds->diff($allowedUnitIds)->isNotEmpty()
            || ! $allowedUnitIds->contains((int) $data['base_unit']['id'])
        ) {
            throw ValidationException::withMessages([
                'base_unit.id' => 'واحد انتخاب‌شده مربوط به این جنس نیست.',
            ]);
        }

        $data['base_unit']['conversion_to_base'] = 1;
        $data['base_unit']['is_active'] = true;
        $data['additional_units'] = array_values($data['additional_units'] ?? []);

        $this->validateUnitNamesAndBarcodes([
            $data['base_unit'],
            ...$data['additional_units'],
        ], $item);

        return $data;
    }

    /**
     * @param array<int, array<string, mixed>> $units
     */
    private function validateUnitNamesAndBarcodes(array $units, ?Item $item = null): void
    {
        $names = collect($units)
            ->map(fn (array $unit): string => Str::lower(trim($unit['name'])));

        if ($names->duplicates()->isNotEmpty()) {
            throw ValidationException::withMessages([
                'additional_units' => 'هر واحد این جنس باید نام متفاوت داشته باشد.',
            ]);
        }

        $barcodes = collect($units)
            ->pluck('barcode')
            ->filter(fn ($barcode): bool => filled($barcode))
            ->map(fn ($barcode): string => trim((string) $barcode));

        if ($barcodes->count() !== $barcodes->unique()->count()) {
            throw ValidationException::withMessages([
                'additional_units' => 'بارکد هر واحد باید متفاوت باشد.',
            ]);
        }

        foreach ($barcodes as $barcode) {
            $query = ItemUnit::query()->where('barcode', $barcode);

            if ($item) {
                $submittedIds = collect($units)->pluck('id')->filter()->map(fn ($id): int => (int) $id);
                $query->whereNotIn('id', $submittedIds);
            }

            if ($query->exists()) {
                throw ValidationException::withMessages([
                    'additional_units' => 'یکی از بارکدها قبلاً ثبت شده است.',
                ]);
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function validateProductData(
        Request $request,
        string $itemType
    ): array {
        if ($itemType !== 'product') {
            return [];
        }

        return $request->validate([
            'weight' => ['required', 'numeric', 'gt:0'],
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

        if (!$product) {
            $item->product()->create([
                'weight' => $productData['weight'],
                'description' => $productData['description'] ?? null,
            ]);

            return;
        }

        $productAttributes = [
            'weight' => $productData['weight'],
            'description' => $productData['description'] ?? null,
        ];

        $product->update($productAttributes);
    }

    private function refreshIdentifiers(Item $item, bool $creating = false): void
    {
        $item->load(['category:id,name', 'product']);

        $item->update([
            'code' => $creating || ! filled($item->code)
                ? $this->generateItemCode($item)
                : $item->code,
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
                '%s-%s-%s-%s',
                $acronym,
                $weight,
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

    private function generateItemCode(Item $item): string
    {
        $prefix = $this->getCategoryAcronym($item->category?->name ?? '');

        return $prefix . '-' . str_pad((string) $item->id, 4, '0', STR_PAD_LEFT);
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

    /**
     * Generate a barcode unique to this unit while retaining the existing
     * numeric barcode format for the base unit.
     *
     * @param array<int, string> $reservedBarcodes
     */
    private function generateBarcode(Item $item, int $sequence = 1, array $reservedBarcodes = []): string
    {
        $payload = '200' . str_pad((string) $item->id, 9, '0', STR_PAD_LEFT);
        $sum = 0;

        foreach (str_split($payload) as $position => $digit) {
            $sum += (int) $digit * ($position % 2 === 0 ? 1 : 3);
        }

        $baseBarcode = $payload . ((10 - ($sum % 10)) % 10);
        $barcode = $sequence === 1 ? $baseBarcode : $baseBarcode . '-U' . $sequence;
        $attempt = 0;

        while (
            ItemUnit::query()->where('barcode', $barcode)->exists()
            || in_array($barcode, $reservedBarcodes, true)
        ) {
            $attempt++;
            $barcode = ($sequence === 1 ? $baseBarcode : $baseBarcode . '-U' . $sequence) . '-' . $attempt;
        }

        return $barcode;
    }

    /**
     * Create the base and optional sellable units for a new item.
     *
     * @param array<string, mixed> $baseUnit
     * @param array<int, array<string, mixed>> $additionalUnits
     */
    private function syncUnits(Item $item, array $baseUnit, array $additionalUnits): void
    {
        $reservedBarcodes = collect([$baseUnit, ...$additionalUnits])
            ->pluck('barcode')
            ->filter(fn ($barcode): bool => filled($barcode))
            ->map(fn ($barcode): string => trim((string) $barcode))
            ->all();

        $base = $item->units()->create([
            'name' => trim($baseUnit['name']),
            'symbol' => filled($baseUnit['symbol'] ?? null) ? trim($baseUnit['symbol']) : null,
            'conversion_to_base' => 1,
            'barcode' => filled($baseUnit['barcode'] ?? null)
                ? trim($baseUnit['barcode'])
                : $this->generateBarcode($item, 1, $reservedBarcodes),
            'code' => $this->generateUnitCode($item, 1),
            'selling_price' => $baseUnit['selling_price'],
            'purchase_price' => $baseUnit['purchase_price'] ?? null,
            'is_active' => true,
        ]);

        $item->update(['base_unit_id' => $base->id]);

        foreach (array_values($additionalUnits) as $index => $unitData) {
            $item->units()->create([
                'name' => trim($unitData['name']),
                'symbol' => filled($unitData['symbol'] ?? null) ? trim($unitData['symbol']) : null,
                'conversion_to_base' => $unitData['conversion_to_base'],
                'barcode' => filled($unitData['barcode'] ?? null)
                    ? trim($unitData['barcode'])
                    : $this->generateBarcode($item, $index + 2, $reservedBarcodes),
                'code' => $this->generateUnitCode($item, $index + 2),
                'selling_price' => $unitData['selling_price'],
                'purchase_price' => $unitData['purchase_price'] ?? null,
                'is_active' => true,
            ]);
        }
    }

    /**
     * Update existing units in place and create newly added units.
     *
     * Existing units are never deleted here. The edit screen deactivates them
     * instead, preserving sale history and foreign-key references.
     *
     * @param array<string, mixed> $baseUnit
     * @param array<int, array<string, mixed>> $additionalUnits
     */
    private function syncItemUnits(Item $item, array $baseUnit, array $additionalUnits): void
    {
        $base = $item->units()->whereKey($baseUnit['id'])->firstOrFail();
        $reservedBarcodes = collect([$baseUnit, ...$additionalUnits])
            ->pluck('barcode')
            ->filter(fn ($barcode): bool => filled($barcode))
            ->map(fn ($barcode): string => trim((string) $barcode))
            ->all();
        $base->update([
            'name' => trim($baseUnit['name']),
            'symbol' => filled($baseUnit['symbol'] ?? null) ? trim($baseUnit['symbol']) : null,
            'conversion_to_base' => 1,
            'barcode' => filled($baseUnit['barcode'] ?? null)
                ? trim($baseUnit['barcode'])
                : ($base->barcode ?: $this->generateBarcode($item, 1, $reservedBarcodes)),
            'selling_price' => $baseUnit['selling_price'],
            'purchase_price' => $baseUnit['purchase_price'] ?? null,
            'is_active' => true,
        ]);

        $item->update(['base_unit_id' => $base->id]);

        foreach (array_values($additionalUnits) as $index => $unitData) {
            $existingUnit = ! empty($unitData['id'])
                ? $item->units()->whereKey($unitData['id'])->firstOrFail()
                : null;
            $attributes = [
                'name' => trim($unitData['name']),
                'symbol' => filled($unitData['symbol'] ?? null) ? trim($unitData['symbol']) : null,
                'conversion_to_base' => $unitData['conversion_to_base'],
                'barcode' => filled($unitData['barcode'] ?? null)
                    ? trim($unitData['barcode'])
                    : ($existingUnit?->barcode ?: $this->generateBarcode(
                        $item,
                        $item->units()->count() + $index + 1,
                        $reservedBarcodes
                    )),
                'selling_price' => $unitData['selling_price'],
                'purchase_price' => $unitData['purchase_price'] ?? null,
                'is_active' => (bool) $unitData['is_active'],
            ];

            if (! empty($unitData['id'])) {
                $existingUnit->update($attributes);
                continue;
            }

            $attributes['code'] = $this->generateUnitCode(
                $item,
                $item->units()->count() + $index + 1
            );
            $item->units()->create($attributes);
        }
    }

    private function generateUnitCode(Item $item, int $sequence): string
    {
        $suffix = $sequence === 1 ? '' : '-U' . $sequence;
        $attempt = 0;

        do {
            $attemptSuffix = $suffix . ($attempt === 0 ? '' : '-' . $attempt);
            $prefixLength = max(1, 50 - Str::length($attemptSuffix));
            $code = Str::substr($item->code ?: $item->sku, 0, $prefixLength) . $attemptSuffix;
            $attempt++;
        } while (ItemUnit::query()->where('code', $code)->exists());

        return $code;
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
