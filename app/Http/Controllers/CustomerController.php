<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function create()
    {
        return Inertia::render('customer/create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'nick_name' => 'nullable|string|max:255',
            'phone' => 'string|max:10|starts_with:07',
            'address' => 'string|max:500',
            'email' => 'nullable|email|max:255',
        ]);
        return DB::transaction(function () use ($data) {
            $customer = Customer::create($data);
            $log = new Log();
            $description = "مشتری جدید به نام {$customer->name} ایجاد شد";
            $log->create('insert', $description, null, "/customers/{$customer->id}");

            // NOTIFY EACH USER 
            $users = User::with('role:id,name')->whereHas('role', function ($q) {
                $q->where('name', 'admin')
                    ->orWhere('name', 'super_admin')
                    ->orWhere('name', 'shop_clerk')
                ;
            })->get();
            foreach ($users as $user) {
                $user->notify(new \App\Notifications\CustomerCreated($customer));
            }

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => $description,
            ]);
            return redirect()->to(route('employees.index'));
        }, 3);
    }

    public function show(Customer $customer)
    {
        return Inertia::render('customer/show', compact('customer'));
    }
    public function edit(Customer $customer)
    {

        return Inertia::render('customer/edit', compact('customer'));
    }
    public function update(Request $request, Customer $customer)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'nick_name' => 'nullable|string|max:255',
            'phone' => 'string|max:10|starts_with:07',
            'address' => 'string|max:500',
            'email' => 'nullable|email|max:255',
        ]);

        return DB::transaction(function () use ($data, $customer) {
            $customer->update($data);
            $log = new Log();
            $description = "مشتری به نام {$data['name']} ویرایش شد";
            $log->create('insert', $description, $customer->name, "/customers/{$customer->id}");

            // NOTIFY EACH USER 
            $users = User::with('role:id,name')->whereHas('role', function ($q) {
                $q->where('name', 'admin')
                    ->orWhere('name', 'super_admin')
                    ->orWhere('name', 'shop_clerk')
                ;
            })->get();
            foreach ($users as $user) {
                $user->notify(new \App\Notifications\CustomerCreated($customer));
            }

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => $description,
            ]);
            return redirect()->to(route('customers.show', $customer->id));
        }, 3);
    }

   
    public function status(Customer $customer)
    {
        return DB::transaction(function () use ($customer) {
            $customer->is_active = !$customer->is_active;
            $customer->save();
            $des = "اکونت {$customer->name} " . (!$customer->is_active ? 'بلاک شد' : 'خارج از بلاک لیست شد');
            (new Log())->create('update', $des, $customer->name, route('customers.show', $customer->id));
            Inertia::flash('toast', ['type' => "success", 'message' => $des]);
            return redirect()->back();
        }, 3);
    }
}
