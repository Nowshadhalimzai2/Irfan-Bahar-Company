<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Custome\SHA;
use App\Models\Currency;
use App\Models\Expense;
use Carbon\Carbon;
use Error;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function index(): Response
    {
        $expenses = Expense::all();
        return Inertia::render('expenses/index', compact('expenses'));
    }

    public function create(): Response
    {
        $todaysExpenses = Expense::with('currency:id,name')
            ->select('id', 'amount', 'description', 'date', 'currency_id')
            ->whereDate('date', Carbon::today(config('app.timezone')))
            ->orderBy('id','desc')
            ->get();
        // dd(Carbon::today(config('app.timezone')));
        $currencies = Currency::select('id', 'name')->get();
        return Inertia::render('expenses/create', compact('currencies', 'todaysExpenses'));
    }

    public function store(Request $request)
    {

        $data = $request->validate([
            'amount' => 'required|min:10|numeric',
            'description' => 'required|max:300|string',
            'currency_id' => 'required|exists:currencies,id',
        ]);
        DB::beginTransaction();
        try {
            $account = new SHA();
            if (! $account->debit($data['amount'], $data['currency_id']))
                throw new Error('');
            Expense::create([...$data, 'date' => Carbon::now(config('app.timezone'))]);
            $log = new Log();
            $log->create('insert', $data['description']);
            Inertia::flash('toast', ['type' => 'error', 'message' => 'موفقانه داخل شد : '.$data["description"]]);
            DB::commit();
        } catch (\Throwable $th) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'ریکورد مصرف اضافه نشد. لامل  شاید بول کافی نه بودن باشه ' . $th->getMessage()]);
            DB::rollBack();
        }
        return redirect()->back();
    }
}
