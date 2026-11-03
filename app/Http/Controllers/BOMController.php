<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Models\BOM;
use App\Models\Category;
use App\Models\Item;
use App\Models\ItemUnit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BOMController extends Controller
{
    public function index(): Response
    {

        $boms = BOM::with('category:id,name')->get();

        return Inertia::render('bom/index', compact('boms'));
    }

    public function create(): Response
    {
        $categories = Category::query()->select('id', 'name')->get();
        $items = $this->bomItems();

        return Inertia::render('bom/create', compact('categories', 'items'));
    }

    public function store(Request $request)
    {
        // dd($request->all());
        $data = $this->validateBomData($request, [
            'formula_name' => 'required|string|max:55',
            'category_id' => 'required|integer|exists:categories,id',
            'min_exp_qty' => 'numeric|required|gte:1',
            'max_exp_qty' => 'numeric|required|gte:1',
            'bomLines' => 'required|array|min:1',

            // each line validation
            'bomLines.*.item_id' => 'required|integer|exists:items,id|distinct',
            'bomLines.*.item_unit_id' => 'required|integer|exists:item_units,id',
            'bomLines.*.required_quantity' => 'required|numeric|gt:0',
        ]);
        $log = new Log;
        DB::beginTransaction();
        try {
            // create the goods receipt
            $bom = BOM::create([
                'formula_name' => $data['formula_name'],
                'category_id' => $data['category_id'],
                'min_exp_qty' => $data['min_exp_qty'],
                'max_exp_qty' => $data['max_exp_qty'],
                'is_active' => true,

            ]);
            $bom->code = str_pad('BOM-'.$bom->id + 1, 8, '0', STR_PAD_LEFT);
            $bom->save();
            // e.g. "BOM-261001-X7KQ"               // ===== CREATE THE BOM LINES =====
            foreach ($data['bomLines'] as $line) {
                $bom->bomLines()->create($line);
            }
            $des = $data['formula_name'].' در ثبت سیستم ثبت شد ';
            $log->create('insert', $des, null, '/boms/'.$bom->id);
            DB::commit();

            Inertia::flash('toast', ['type' => 'success', 'message' => $des]);

            if ($request->expectsJson()) {
                return response()->json(['status' => 'success', 'message' => $des, 'bom' => $bom], 201);
            }

            return redirect()->route('boms.index');
        } catch (\Throwable $th) {
            // Let validation exceptions bubble so Inertia/Laravel can return proper validation responses
            if ($th instanceof ValidationException) {
                throw $th;
            }
            $des = ' متاسفانه '.($data['formula_name'] ?? '').'در ثبت سیستم ثبت نشد ';
            $log->create('insert', $des);
            DB::rollBack();

            session()->flash('toast', ['type' => 'error', 'message' => $des.$th->getMessage()]);

            if ($request->expectsJson()) {
                return response()->json(['status' => 'error', 'message' => $des, 'error' => $th->getMessage()], 500);
            }

            return redirect()->back();
        }
    }

    public function show(BOM $bom)
    {
        $bom->load(
            'bomLines:id,bom_id,item_id,item_unit_id,required_quantity',
            'bomLines.item:id,item_type,name,unit,default_sale_price,code,sku',
            'bomLines.itemUnit:id,item_id,name,symbol,conversion_to_base',
        );
        $bom->load('category:id,name');

        return Inertia::render('bom/show', compact('bom'));
    }

    public function edit(BOM $bom)
    {
        $bom->load(
            'bomLines:id,bom_id,item_id,item_unit_id,required_quantity',
            'bomLines.item:id,name',
            'bomLines.itemUnit:id,item_id,name,symbol,conversion_to_base',
        );
        $categories = Category::query()->select('id', 'name')->get();
        $items = $this->bomItems(true);

        return Inertia::render('bom/edit', compact('bom', 'items', 'categories'));
    }

    public function update(Request $request, BOM $bom)
    {
        $data = $this->validateBomData($request, [
            'formula_name' => 'required|string|max:55',
            'category_id' => 'required|integer|exists:categories,id',
            'min_exp_qty' => 'numeric|required|gte:1',
            'max_exp_qty' => 'numeric|required|gte:1',
            'bomLines' => 'required|array|min:1',

            // each line validation
            'bomLines.*.item_id' => 'required|integer|exists:items,id|distinct',
            'bomLines.*.item_unit_id' => 'required|integer|exists:item_units,id',
            'bomLines.*.required_quantity' => 'required|numeric|gt:0',
        ]);

        $log = new Log;
        DB::beginTransaction();
        try {
            // update BOM
            $bom->formula_name = $data['formula_name'];
            $bom->category_id = $data['category_id'];
            $bom->min_exp_qty = $data['min_exp_qty'];
            $bom->max_exp_qty = $data['max_exp_qty'];
            $bom->is_active = true;
            $bom->save();

            // remove existing lines to avoid unique-constraint conflicts, then recreate
            $bom->bomLines()->delete();
            foreach ($data['bomLines'] as $line) {
                $bom->bomLines()->create($line);
            }

            $des = $data['formula_name'].' بروزرسانی شد ';
            $log->create('update', $des);
            DB::commit();

            Inertia::flash('toast', ['type' => 'success', 'message' => $des]);

            if ($request->expectsJson()) {
                return response()->json(['status' => 'success', 'message' => $des, 'bom' => $bom], 200);
            }

            return redirect()->route('boms.index');
        } catch (\Throwable $th) {
            // Let validation exceptions bubble so Inertia/Laravel can return proper validation responses
            if ($th instanceof ValidationException) {
                throw $th;
            }
            $des = ' متاسفانه '.($data['formula_name'] ?? '').'برروز رسانی نشد ';
            $log->create('insert', $des);
            DB::rollBack();

            Inertia::flash('toast', ['type' => 'error', 'message' => $des]);

            if ($request->expectsJson()) {
                return response()->json(['status' => 'error', 'message' => $des, 'error' => $th->getMessage()], 500);
            }

            return redirect()->back();
        }
    }

    public function block(BOM $bom): RedirectResponse
    {

        DB::beginTransaction();
        try {
            $log = new Log;
            $des = ' فورمول به نام '.$bom->formula_name.' بلاک شد ';
            $log->create('delete', $des);
            Inertia::flash('toast', ['type' => 'success', 'message' => $des]);
            $bom->is_active = ! $bom->is_active;
            $bom->save();
            DB::commit();

            return redirect()->to(route('boms.index'));
        } catch (\Throwable $th) {

            DB::rollBack();
            $des = ' فورمول به نام '.$bom->formula_name.' بلاک نشد ';
            Inertia::flash('toast', ['type' => 'success', 'message' => $des.$th->getMessage()]);

            return redirect()->back();
        }
    }

    private function bomItems(bool $includeInactiveUnits = false)
    {
        return Item::query()
            ->where('item_type', '!=', 'product')
            ->with([
                'units' => function ($query) use ($includeInactiveUnits): void {
                    $query->select('id', 'item_id', 'name', 'symbol', 'conversion_to_base', 'is_active');

                    if (! $includeInactiveUnits) {
                        $query->where('is_active', true);
                    }
                },
                'baseUnit:id,item_id,name,symbol,conversion_to_base,is_active',
            ])
            ->orderBy('name')
            ->get();
    }

    private function validateBomData(Request $request, array $rules): array
    {
        $validator = Validator::make($request->all(), $rules);
        $validator->after(function ($validator) use ($request): void {
            if (
                is_numeric($request->input('min_exp_qty'))
                && is_numeric($request->input('max_exp_qty'))
                && (float) $request->input('min_exp_qty') > (float) $request->input('max_exp_qty')
            ) {
                $validator->errors()->add('min_exp_qty', 'حداقل مقدار نمی‌تواند از حداکثر مقدار بیشتر باشد.');
            }

            $lines = $request->input('bomLines', []);
            if (! is_array($lines)) {
                return;
            }

            foreach ($lines as $index => $line) {
                if (! is_array($line) || ! isset($line['item_id'], $line['item_unit_id'])) {
                    continue;
                }

                $unit = ItemUnit::query()
                    ->whereKey($line['item_unit_id'])
                    ->where('item_id', $line['item_id'])
                    ->first();

                $wasAlreadyAssigned = $request->route('bom') instanceof BOM
                    && $request->route('bom')->bomLines()
                        ->where('item_id', $line['item_id'])
                        ->where('item_unit_id', $line['item_unit_id'])
                        ->exists();

                if (! $unit || (! $unit->is_active && ! $wasAlreadyAssigned)) {
                    $validator->errors()->add(
                        "bomLines.{$index}.item_unit_id",
                        'واحد انتخاب‌شده برای این جنس معتبر نیست.',
                    );
                }
            }
        });

        return $validator->validate();
    }
}
