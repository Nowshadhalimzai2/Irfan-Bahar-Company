import { Head, router } from '@inertiajs/react';
import {
    Activity,
    ArrowDownLeft,
    ArrowUpRight,
    BarChart3,
    Boxes,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Coins,
    CreditCard,
    Factory,
    FileBarChart,
    RefreshCcw,
    Users,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';

type ReportProps = {
    filters: { period: 'daily' | 'monthly'; date: string };
    range: { start: string; end: string; label: string };
    summary: {
        sales: { total: number; count: number };
        expenses: { total: number; count: number };
        payments: { total: number };
        refunds: { total: number };
        attendance: { present: number; absent: number };
        movements: number;
        production: number;
        activity: number;
    };
    dailySales: { label: string; date: string; sales: number; count: number }[];
    expenseByCurrency: { currency: string; amount: number; count: number }[];
    movementSummary: { type: string; movements: number; quantity: number }[];
    productionSummary: { status: string; total: number }[];
};

const movementLabels: Record<string, string> = {
    receipt: 'Receipts',
    transferred_out: 'Transferred out',
    transferred_in: 'Transferred in',
    production_consumption: 'Production consumption',
    production_output: 'Production output',
    sale: 'Sales',
    sale_return: 'Sale returns',
    adjustment_in: 'Positive adjustments',
    adjustment_out: 'Negative adjustments',
};

const statusLabels: Record<string, string> = {
    pending: 'Pending',
    progress: 'In progress',
    completed: 'Completed',
    drafted: 'Drafted',
    cancelled: 'Cancelled',
};

const money = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function Reports({ filters, range, summary, dailySales, expenseByCurrency, movementSummary, productionSummary }: ReportProps) {
    const [period, setPeriod] = useState(filters.period);
    const [date, setDate] = useState(filters.date);
    const maxSales = useMemo(() => Math.max(...dailySales.map((item) => item.sales), 1), [dailySales]);
    
    const applyFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get('/reports', { period, date }, { preserveState: true, preserveScroll: true });
    };

    const cards = [
        { label: 'Sales', value: money(summary.sales.total), detail: `${summary.sales.count} transactions`, icon: ArrowUpRight, tone: 'emerald' },
        { label: 'Expenses', value: money(summary.expenses.total), detail: `${summary.expenses.count} entries`, icon: ArrowDownLeft, tone: 'rose' },
        { label: 'Payments collected', value: money(summary.payments.total), detail: 'Across all methods', icon: CreditCard, tone: 'sky' },
        { label: 'Refunds', value: money(summary.refunds.total), detail: 'Requested in period', icon: RefreshCcw, tone: 'amber' },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'مرکز راپورها', href: '/reports' }]}>
            <Head title="Report Center" />
            <div className="min-h-full space-y-5 bg-slate-50/60 px-4 py-5 dark:bg-slate-950/50 lg:px-6">
                <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-primary"><FileBarChart className="h-4 w-4" /> Report center</div>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">System reports</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A clear view of financial, operational, and activity performance.</p>
                    </div>
                    <form onSubmit={applyFilters} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <label className="text-xs font-semibold text-slate-500">Report period
                            <select value={period} onChange={(event) => setPeriod(event.target.value as 'daily' | 'monthly')} className="mt-1 block h-10 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none ring-primary focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                <option value="daily">Daily</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </label>
                        <label className="text-xs font-semibold text-slate-500">Date
                            <input type={period === 'monthly' ? 'month' : 'date'} value={period === 'monthly' ? date.slice(0, 7) : date} onChange={(event) => setDate(event.target.value)} className="mt-1 block h-10 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none ring-primary focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                        </label>
                        <button type="submit" className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">Run report</button>
                    </form>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-500"><CalendarDays className="h-4 w-4" /> Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{range.label}</span> <span className="text-slate-300">|</span> {range.start} to {range.end}</div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map(({ label, value, detail, icon: Icon, tone }) => (
                        <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><Icon className={`h-5 w-5 ${tone === 'emerald' ? 'text-emerald-500' : tone === 'rose' ? 'text-rose-500' : tone === 'sky' ? 'text-sky-500' : 'text-amber-500'}`} /></div>
                            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                            <p className="mt-1 text-xs text-slate-500">{detail}</p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-900 dark:text-white">Sales activity</h2><p className="mt-1 text-xs text-slate-500">Revenue recorded in the selected period</p></div><BarChart3 className="h-5 w-5 text-primary" /></div>
                        <div className="mt-6 flex h-48 items-end gap-2 border-b border-slate-100 pb-0 dark:border-slate-800">
                            {dailySales.length === 0 ? <p className="w-full pb-8 text-center text-sm text-slate-400">No sales recorded in this period.</p> : dailySales.map((item) => <div key={item.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="relative w-full max-w-10 rounded-t-lg bg-emerald-400/80 transition hover:bg-emerald-500" style={{ height: `${Math.max((item.sales / maxSales) * 100, 4)}%` }} title={`${money(item.sales)} · ${item.count} sales`} /><span className="text-[10px] text-slate-400">{item.label}</span></div>)}
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2"><Coins className="h-5 w-5 text-amber-500" /><h2 className="font-bold text-slate-900 dark:text-white">Expenses by currency</h2></div>
                        <div className="mt-5 space-y-3">{expenseByCurrency.length === 0 ? <p className="text-sm text-slate-400">No expenses recorded in this period.</p> : expenseByCurrency.map((item) => <div key={item.currency} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800"><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.currency}<span className="ml-2 text-xs font-normal text-slate-400">{item.count} entries</span></span><span className="font-bold text-slate-900 dark:text-white">{money(item.amount)}</span></div>)}</div>
                    </section>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    <SummaryPanel title="People & activity" icon={Users} rows={[['Present', summary.attendance.present], ['Absent', summary.attendance.absent], ['System actions', summary.activity]]} />
                    <SummaryPanel title="Inventory movements" icon={Boxes} rows={movementSummary.map((item) => [movementLabels[item.type] ?? item.type, `${item.movements} · ${money(item.quantity)} qty`])} empty="No inventory movement recorded." />
                    <SummaryPanel title="Production orders" icon={Factory} rows={productionSummary.map((item) => [statusLabels[item.status] ?? item.status, item.total])} empty="No production order recorded." />
                </div>

                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3">
                    <MiniMetric icon={ClipboardList} label="Inventory movements" value={summary.movements} />
                    <MiniMetric icon={Factory} label="Production orders" value={summary.production} />
                    <MiniMetric icon={Activity} label="System activity" value={summary.activity} />
                </div>
            </div>
        </AppLayout>
    );
}

function SummaryPanel({ title, icon: Icon, rows, empty = 'No data recorded.' }: { title: string; icon: typeof Users; rows: [string, string | number][]; empty?: string }) {
    return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /><h2 className="font-bold text-slate-900 dark:text-white">{title}</h2></div><div className="mt-4 space-y-2">{rows.length === 0 ? <p className="text-sm text-slate-400">{empty}</p> : rows.map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0 dark:border-slate-800"><span className="text-slate-500">{label}</span><span className="font-semibold text-slate-800 dark:text-slate-100">{value}</span></div>)}</div></section>;
}

function MiniMetric({ icon: Icon, label, value }: { icon: typeof CheckCircle2; label: string; value: number }) {
    return <div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div><div><p className="text-xs text-slate-500">{label}</p><p className="font-bold text-slate-800 dark:text-slate-100">{value}</p></div></div>;
}