<?php

namespace App\Http\Controllers;

use App\Models\Currency;
use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function index() : Response {
        $expenses = Expense::all();
        return Inertia::render('expenses/index',compact('expenses'));
        
    }

    public function create():Response{
        $todaysExpenses = Expense::with('currency:id,name')->select('id','amount','description','date','currency_id')->where('date',today(config('app.timezone')))->get();
        $currencies = Currency::select('id','name')->get();
        return Inertia::render('expenses/create',compact('currencies','todaysExpenses'));
    }

    public function store(Request $request){

        $request->validate([
            'amount' => 'required|min:10|numeric',
            'description' => 'required|max:300|string',
            'currency_id' => 'required|exists:currencies,id',
        ]);

        return $request->all();
    }
}
