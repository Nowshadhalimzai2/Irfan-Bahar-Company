<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Models\BOM;
use App\Models\Category;
use App\Models\Item;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $categories = Category::all();
        $items = Item::whereNot('item_type', 'product')->get();
        return Inertia::render('bom/create', compact('categories', 'items'));
    }


    public function store(Request $request)
    {
        // dd($request->all());
        $data = $request->validate([
            'formula_name' => 'required|string|max:55',
            'category_id' => 'required|integer|exists:categories,id',
            'min_exp_qty' => 'numeric|required|gte:1',
            'max_exp_qty' => 'numeric|required|gte:1',
            'bomLines' => 'required|array|min:1',

            // each line validation
            'bomLines.*.item_id' => 'required|integer|exists:items,id|distinct',
            'bomLines.*.required_quantity' => 'required|numeric|gt:0',
        ]);
        $request->validate([
            'min_exp_qty' => 'required|lte:'.$data['max_exp_qty'],
            'max_exp_qty' => 'required|gte:'.$data['min_exp_qty'],
        ]);
        $log = new Log();
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
            // ===== CREATE THE BOM LINES =====
            foreach ($data['bomLines'] as $line) {
                $bom->bomLines()->create($line);
            }
            $des = $data['formula_name'] . ' در ثبت سیستم ثبت شد ';
            $log->create('insert', $des,null,'/boms/'.$bom->id);
            DB::commit();

            session()->flash('toast', ['type' => 'success', 'message' => $des]);

            if ($request->expectsJson()) {
                return response()->json(['status' => 'success', 'message' => $des, 'bom' => $bom], 201);
            }

            return redirect()->route('boms.index');
        } catch (\Throwable $th) {
            // Let validation exceptions bubble so Inertia/Laravel can return proper validation responses
            if ($th instanceof ValidationException) {
                throw $th;
            }
            $des = ' متاسفانه ' . ($data['formula_name'] ?? '') . 'در ثبت سیستم ثبت نشد ';
            $log->create('insert', $des);
            DB::rollBack();

            session()->flash('toast', ['type' => 'error', 'message' => $des . $th->getMessage()]);

            if ($request->expectsJson()) {
                return response()->json(['status' => 'error', 'message' => $des, 'error' => $th->getMessage()], 500);
            }

            return redirect()->back();
        }
    }

    public function show(BOM $bom)
    {
        $bom->load('bomLines:id,bom_id,item_id,required_quantity', 'bomLines.item:id,item_type,name,unit,default_sale_price,code,sku');
        $bom->load('category:id,name');
        return Inertia::render('bom/show', compact('bom'));
    }

    public function edit(BOM $bom)
    {

        $bom->load('bomLines:id,bom_id,item_id,required_quantity', 'bomLines.item:id,name');
        $bom->load('product:item_id,name');
        $products = Product::with('item:id,name,unit,item_type')->select('item_id', 'weight', 'per_pack')->get();
        $items = Item::whereNot('item_type', 'product')->get();
        return Inertia::render('bom/edit', compact('bom', 'items', 'products'));
    }
    public function update(Request $request, BOM $bom)
    {
        $data = $request->validate([
            'formula_name' => 'required|string|max:55',
            'product_id' => 'required|integer|exists:products,item_id',
            'min_exp_qty' => 'numeric|required|gte:1',
            'max_exp_qty' => 'numeric|required|gte:1',
            'bomLines' => 'required|array|min:1',

            // each line validation
            'bomLines.*.item_id' => 'required|integer|exists:items,id|distinct',
            'bomLines.*.required_quantity' => 'required|numeric|gt:0',
        ]);

        $log = new Log();
        DB::beginTransaction();
        try {
            // update BOM
            $bom->formula_name = $data['formula_name'];
            $bom->product_id = $data['product_id'];
            $bom->min_exp_qty = $data['min_exp_qty'];
            $bom->max_exp_qty = $data['max_exp_qty'];
            $bom->is_active = true;
            $bom->save();

            // remove existing lines to avoid unique-constraint conflicts, then recreate
            $bom->bomLines()->delete();
            foreach ($data['bomLines'] as $line) {
                $bom->bomLines()->create($line);
            }

            $des = $data['formula_name'] . ' بروزرسانی شد ';
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
            $des = ' متاسفانه ' . ($data['formula_name'] ?? '') . 'برروز رسانی نشد ';
            $log->create('insert', $des);
            DB::rollBack();

            Inertia::flash('toast', ['type' => 'error', 'message' => $des]);

            if ($request->expectsJson()) {
                return response()->json(['status' => 'error', 'message' => $des, 'error' => $th->getMessage()], 500);
            }

            return redirect()->back();
        }
    }

    public function destroy(BOM $bom): RedirectResponse
    {

        DB::beginTransaction();
        try {
            $log = new Log();
            $des = ' فورمول به نام ' . $bom->formula_name . ' حذف شد ';
            $log->create('delete', $des);
            Inertia::flash('toast', ['type' => 'success', 'message' => $des]);
            $bom->delete();
            DB::commit();
            return redirect()->to(route('boms.index'));
        } catch (\Throwable $th) {
            // if($th instanceof )
            DB::rollBack();
            $des = ' فورمول به نام ' . $bom->formula_name . ' حذف نشد ';
            Inertia::flash('toast', ['type' => 'success', 'message' => $des]);
            return redirect()->back();
        }
    }
}
