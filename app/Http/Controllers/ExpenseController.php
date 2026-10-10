<?php

namespace App\Http\Controllers;

use App\Custome\Log;
use App\Custome\SHA;
use App\Models\Currency;
use App\Models\Expense;
use App\Models\User;
use App\Services\PersianDateConverter;
use Carbon\Carbon;
use Error;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Morilog\Jalali\Jalalian;

class ExpenseController extends Controller
{
    public function index(): Response
    {
        $expenses = Expense::with('currency:id,name')->get();
        return Inertia::render('expenses/index', compact('expenses'));
    }

    public function create(): Response
    {
        $todaysExpenses = Expense::with('currency:id,name')
            ->select('id', 'amount', 'description', 'date', 'currency_id', 'is_editable')
            ->whereDate('date', Carbon::today(config('app.timezone')))
            ->orderBy('id', 'desc')
            ->get();
        $currencies = Currency::select('id', 'name')->get();
        return Inertia::render('expenses/create', compact('currencies', 'todaysExpenses'));
    }

    public function store(Request $request)
    {
        Gate::authorize('allow-shop-clerk');

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
            Inertia::flash('toast', ['type' => 'error', 'message' => 'موفقانه داخل شد : ' . $data["description"]]);
            DB::commit();
        } catch (\Throwable $th) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'ریکورد مصرف اضافه نشد. لامل  شاید بول کافی نه بودن باشه ' . $th->getMessage()]);
            DB::rollBack();
        }
        return redirect()->back();
    }

    public function update(Request $request, Expense $expense)
    {
        $user = Auth::user();
        DB::beginTransaction();
        try {

            if (! ($user instanceof User) || ! $user->hasRole('super_admin')) {
                abort(403);
            }

            if (! $expense->is_editable) {
                return response()->json(['message' => 'This expense is not editable.'], 403);
            }

            $data = $request->validate([
                'amount' => 'required|numeric|min:1',
            ]);
            // return response()->json('data');
            $oldAmount = $expense->amount;
            $currency_id = $expense->currency_id;
            $account = new SHA();
            $account->debit($data['amount'], $currency_id);
            $account->credit($oldAmount, $currency_id);
            $expense->forceFill([
                'amount' => $data['amount'],
                'is_editable' => false,
            ])->save();
            DB::commit();
            return response()->json([
                'id' => $expense->id,
                'amount' => $expense->amount,
                'is_editable' => $expense->is_editable,
            ]);
        } catch (\Exception $th) {

            DB::rollBack();
            Inertia::flash('toast', ['type' => 'success', 'message' => ' مشکل در وجود امد هنګام ویرایش ' . $th->getMessage()]);
            return redirect()->back();
        }
    }

    public function expensesRange(Request $request, PersianDateConverter $dateConverter)
    {

        $datType = $request->period == 'monthly' ? 'month' : 'date';
        $persianDate = $request->string('persionDate')->toString();
        $persianDate = $persianDate !== '' ? $persianDate : Jalalian::now()->format('Y/m');
        try {
            ['start' => $start, 'end' => $end] = $dateConverter->toGregorianRange($persianDate, $datType);
            // return response()->json($request->month);
        } catch (\InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
        // return response()->json($start);

        $expenses = Expense::with('currency:id,name')
            ->select('id', 'amount', 'description', 'date', 'currency_id', 'is_editable')
            ->whereBetween('date', [$start, $end])
            ->orderBy('id', 'desc')
            ->get();

        return response()->json(['expenses' => $expenses]);
    }

    public function toggleEditable(Request $request, Expense $expense)
    {

        Gate::authorize('allow-shop-clerk');

        $data = $request->validate([
            'is_editable' => 'required|boolean',
        ]);

        $expense->is_editable = !$data['is_editable'];
        $expense->save();

        return response()->json(['is_editable' => $expense->is_editable]);
    }
}
