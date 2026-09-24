<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SupplierController extends Controller
{

    public function create()
    {

        return inertia('supplier/create');
    }

    public function store(Request $request): RedirectResponse
    {

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|numeric|starts_with:07',
            'email' => 'nullable|email|max:255|unique:suppliers,email,except:id',
            'address' => 'required|string|max:255',
        ]);
        DB::beginTransaction();
        try {
            Supplier::create([
                'name' => $data['name'],
                'phone' => $data['phone'],
                'email' => $data['email'],
                'address' => $data['address'],
            ]);
            $log = new Log();
            $log->create('insert', 'تأمین کننده نو ' . $data['name']);
            DB::commit();
            Inertia::flash('toast', ['type' => 'success', 'message' => 'تأمین کننده با موفقیت ایجاد شد.']);
            return redirect()->to(route('employees.index'));
        } catch (\Throwable $th) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'تأمین کننده ایجاد نشد.']);

            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'یک مشکل را در وجود امد. لطفا دوباره امتحان کنین']);
        }
    }

    public function show(Supplier $supplier){

        return Inertia::render('supplier/show',[
            'supplier' => $supplier,
        ]);
    }

    public function edit(Supplier $supplier)
    {
        return inertia('supplier/edit', [
            'supplier' => $supplier,
        ]);
    }

    public function update(Request $request, Supplier $supplier): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|numeric|starts_with:07',
            'email' => 'nullable|email|max:255|unique:suppliers,email,' . $supplier->id,
            'address' => 'required|string|max:255',
        ]);
        DB::beginTransaction();
        try {
            $supplier->update($data);
            $log = new Log();
            $log->create('update', 'تأمین کننده ' . $supplier->name);
            DB::commit();
            Inertia::flash('toast', ['type' => 'success', 'message' => 'تأمین کننده با موفقیت ویرایش شد.']);
            return redirect()->to(route('employees.index'));
        } catch (\Throwable $th) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'تأمین کننده ویرایش نشد.'.$th->getMessage()]);
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'یک مشکل را در وجود امد. لطفا دوباره امتحان کنین']);
        }
    }

    public function destroy(Supplier $supplier): RedirectResponse{
        
        DB::beginTransaction();
        try {
            $supplier->delete();
            $log = new Log();
            $log->create('delete', 'تأمین کننده ' . $supplier->name);
            DB::commit();
            Inertia::flash('toast', ['type' => 'success', 'message' => 'تأمین کننده با موفقیت حذف شد.']);
            return redirect()->to(route('employees.index'));
        } catch (\Throwable $th) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'تأمین کننده حذف نشد.'.$th->getMessage()]);
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'یک مشکل را در وجود امد. لطفا دوباره امتحان کنین']);
        }
    }
}
