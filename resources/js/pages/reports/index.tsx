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
    Download,
    Factory,
    FileBarChart,
    Printer,
    RefreshCcw,
    TriangleAlert,
    Users,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';

type CatalogItem = { id: number | string; name: string };

type ReportProps = {
    filters: {
        period: 'daily' | 'monthly';
        date: string;
        preset?: string;
        businessUnit?: string;
        product?: string | number | null;
        category?: string | number | null;
        vendor?: string | number | null;
        customer?: string | number | null;
    };
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
        cost_of_goods_sold?: number;
        gross_profit?: number;
        raw_material_purchase_cost?: number;
        production_quantity_completed?: number;
        production_cost?: number;
        shop_stock_value?: number;
        factory_stock_value?: number;
        low_stock_items?: number;
        internal_transfers?: number;
    };
    dailySales: { label: string; date: string; sales: number; count: number }[];
    expenseByCurrency: { currency: string; amount: number; count: number }[];
    movementSummary: { type: string; movements: number; quantity: number }[];
    productionSummary: { status: string; total: number }[];
    topProducts: { name: string; total: number; quantity: number }[];
    customerSales: { customer: string; total: number; orders: number }[];
    vendorPurchases: { vendor: string; total: number; count: number }[];
    internalTransfers: { date: string; product: string; quantity: number; value: number }[];
    shopInventory: { product: string; quantity: number; value: number }[];
    catalog?: {
        products?: CatalogItem[];
        categories?: CatalogItem[];
        customers?: CatalogItem[];
        suppliers?: CatalogItem[];
    };
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

const money = (value: number) => (Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0');

export default function Reports({ filters, range, summary, dailySales, expenseByCurrency, movementSummary, productionSummary, topProducts, customerSales, vendorPurchases, internalTransfers, shopInventory, catalog }: ReportProps) {
    const [period, setPeriod] = useState(filters.period);
    const [preset, setPreset] = useState(filters.preset ?? 'custom');
    const [businessUnit, setBusinessUnit] = useState(filters.businessUnit ?? 'consolidated');
    const [product, setProduct] = useState(String(filters.product ?? ''));
    const [category, setCategory] = useState(String(filters.category ?? ''));
    const [vendor, setVendor] = useState(String(filters.vendor ?? ''));
    const [customer, setCustomer] = useState(String(filters.customer ?? ''));
    const [date, setDate] = useState(filters.date);
    const maxSales = useMemo(() => Math.max(...dailySales.map((item) => item.sales), 1), [dailySales]);

    const applyFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get('/reports', { period, preset, business_unit: businessUnit, product: product || undefined, category: category || undefined, vendor: vendor || undefined, customer: customer || undefined, date }, { preserveState: true, preserveScroll: true });
    };

    const printReport = () => {
        window.print();
    };

    const cards = [
        { label: 'External sales revenue', value: money(summary.sales.total), detail: `${summary.sales.count} sales/orders`, icon: ArrowUpRight, tone: 'emerald' },
        { label: 'Cost of goods sold', value: money(summary.cost_of_goods_sold ?? 0), detail: 'Factory cost basis', icon: ArrowDownLeft, tone: 'rose' },
        { label: 'Gross profit', value: money(summary.gross_profit ?? 0), detail: 'Revenue minus COGS', icon: Coins, tone: 'sky' },
        { label: 'Raw material purchase cost', value: money(summary.raw_material_purchase_cost ?? 0), detail: 'External buying cost', icon: CreditCard, tone: 'amber' },
        { label: 'Production quantity completed', value: money(summary.production_quantity_completed ?? 0), detail: 'Output in period', icon: Factory, tone: 'violet' },
        { label: 'Production cost', value: money(summary.production_cost ?? 0), detail: 'Operational cost basis', icon: Activity, tone: 'indigo' },
        { label: 'Shop stock value', value: money(summary.shop_stock_value ?? 0), detail: 'Inventory valuation', icon: Boxes, tone: 'sky' },
        { label: 'Factory stock value', value: money(summary.factory_stock_value ?? 0), detail: 'Finished goods stock', icon: WarehouseMetric, tone: 'emerald' },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'مرکز راپورها', href: '/reports' }]}>
            <Head title="Report Center" />
            <div id="printArea" className="min-h-full space-y-5 bg-slate-50/60 px-4 py-5 dark:bg-slate-950/50 lg:px-6">
                <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-primary"><FileBarChart className="h-4 w-4" /> Report center</div>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Factory + shop reports</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Operational reporting with external sales kept separate from internal transfers.</p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <form onSubmit={applyFilters} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <label className="text-xs font-semibold text-slate-500">
                                Preset
                                <select value={preset} onChange={(event) => setPreset(event.target.value)} className="mt-1 block h-10 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none ring-primary focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                    <option value="custom">Custom</option>
                                    <option value="today">Today</option>
                                    <option value="yesterday">Yesterday</option>
                                    <option value="this_month">This month</option>
                                    <option value="last_month">Last month</option>
                                </select>
                            </label>
                            <label className="text-xs font-semibold text-slate-500">
                                Period
                                <select value={period} onChange={(event) => setPeriod(event.target.value as 'daily' | 'monthly')} className="mt-1 block h-10 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none ring-primary focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                    <option value="daily">Daily</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </label>
                            <label className="text-xs font-semibold text-slate-500">
                                Business unit
                                <select value={businessUnit} onChange={(event) => setBusinessUnit(event.target.value)} className="mt-1 block h-10 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none ring-primary focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                    <option value="consolidated">Consolidated</option>
                                    <option value="factory">Factory</option>
                                    <option value="shop">Shop</option>
                                </select>
                            </label>
                            <label className="text-xs font-semibold text-slate-500">
                                Date
                                <input type={period === 'monthly' ? 'month' : 'date'} value={period === 'monthly' ? date.slice(0, 7) : date} onChange={(event) => setDate(event.target.value)} className="mt-1 block h-10 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none ring-primary focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                            </label>
                            <button type="submit" className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">Run report</button>
                        </form>
                        <div className="flex gap-2">
                            <button type="button" onClick={printReport} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"><Printer className="h-4 w-4" /> Print</button>
                            <button type="button" onClick={printReport} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-white hover:opacity-95"><Download className="h-4 w-4" /> Download PDF</button>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                    <div className="flex items-center gap-2"><TriangleAlert className="h-4 w-4" /> <span>Internal factory-to-shop transfers are included in operational reporting but are excluded from consolidated external revenue and gross-profit totals.</span></div>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-500"><CalendarDays className="h-4 w-4" /> Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{range.label}</span> <span className="text-slate-300">|</span> {range.start} to {range.end}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900">Business unit: {businessUnit}</span>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900">Preset: {preset}</span>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map(({ label, value, detail, icon: Icon, tone }) => (
                        <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><Icon className={`h-5 w-5 ${tone === 'emerald' ? 'text-emerald-500' : tone === 'rose' ? 'text-rose-500' : tone === 'sky' ? 'text-sky-500' : tone === 'amber' ? 'text-amber-500' : tone === 'violet' ? 'text-violet-500' : tone === 'indigo' ? 'text-indigo-500' : 'text-slate-500'}`} /></div>
                            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                            <p className="mt-1 text-xs text-slate-500">{detail}</p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-900 dark:text-white">Sales activity</h2><p className="mt-1 text-xs text-slate-500">External revenue in the selected period</p></div><BarChart3 className="h-5 w-5 text-primary" /></div>
                        <div className="mt-6 flex h-48 items-end gap-2 border-b border-slate-100 pb-0 dark:border-slate-800">
                            {dailySales.length === 0 ? <p className="w-full pb-8 text-center text-sm text-slate-400">No sales recorded in this period.</p> : dailySales.map((item) => <div key={item.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="relative w-full max-w-10 rounded-t-lg bg-emerald-400/80 transition hover:bg-emerald-500" style={{ height: `${Math.max((item.sales / maxSales) * 100, 4)}%` }} title={`${money(item.sales)} · ${item.count} sales`} /><span className="text-[10px] text-slate-400">{item.label}</span></div>)}
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2"><Coins className="h-5 w-5 text-amber-500" /><h2 className="font-bold text-slate-900 dark:text-white">Expense overview</h2></div>
                        <div className="mt-5 space-y-3">{expenseByCurrency.length === 0 ? <p className="text-sm text-slate-400">No expenses recorded in this period.</p> : expenseByCurrency.map((item) => <div key={item.currency} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800"><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.currency}<span className="ml-2 text-xs font-normal text-slate-400">{item.count} entries</span></span><span className="font-bold text-slate-900 dark:text-white">{money(item.amount)}</span></div>)}</div>
                    </section>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    <SummaryPanel title="People & activity" icon={Users} rows={[['Present', summary.attendance.present], ['Absent', summary.attendance.absent], ['System actions', summary.activity]]} />
                    <SummaryPanel title="Inventory movements" icon={Boxes} rows={movementSummary.map((item) => [movementLabels[item.type] ?? item.type, `${item.movements} · ${money(item.quantity)} qty`])} empty="No inventory movement recorded." />
                    <SummaryPanel title="Production orders" icon={Factory} rows={productionSummary.map((item) => [statusLabels[item.status] ?? item.status, item.total])} empty="No production order recorded." />
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                    <TableCard title="Top-selling products" columns={['Product', 'Qty', 'Value']} rows={topProducts.length === 0 ? [] : topProducts.map((row) => [row.name, `${money(row.quantity)}`, money(row.total)])} empty="No sales recorded for this period." />
                    <TableCard title="Customer sales" columns={['Customer', 'Orders', 'Total']} rows={customerSales.length === 0 ? [] : customerSales.map((row) => [row.customer, String(row.orders), money(row.total)])} empty="No customer sales found." />
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                    <TableCard title="Vendor purchases" columns={['Vendor', 'Entries', 'Total']} rows={vendorPurchases.length === 0 ? [] : vendorPurchases.map((row) => [row.vendor, String(row.count), money(row.total)])} empty="No vendor purchases for this period." />
                    <TableCard title="Internal transfers" columns={['Date', 'Product', 'Qty', 'Value']} rows={internalTransfers.length === 0 ? [] : internalTransfers.map((row) => [row.date, row.product, money(row.quantity), money(row.value)])} empty="No internal transfers recorded." />
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                    <TableCard title="Low-stock and replenishment" columns={['Product', 'Qty', 'Value']} rows={shopInventory.length === 0 ? [] : shopInventory.map((row) => [row.product, `${money(row.quantity)}`, money(row.value)])} empty="No shop inventory data available." />
                    <TableCard title="Operational notes" columns={['Item', 'Value']} rows={[[`External revenue`, money(summary.sales.total)], [`COGS`, money(summary.cost_of_goods_sold ?? 0)], [`Gross profit`, money(summary.gross_profit ?? 0)], [`Internal transfer value`, money(summary.internal_transfers ?? 0)]]} empty="No operational summary data." />
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

function TableCard({ title, columns, rows, empty }: { title: string; columns: string[]; rows: string[][]; empty: string }) {
    return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-bold text-slate-900 dark:text-white">{title}</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                        {columns.map((column) => <th key={column} className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-200">{column}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-slate-400">{empty}</td></tr> : rows.map((row, index) => <tr key={`${title}-${index}`} className="border-t border-slate-100 dark:border-slate-800"><td className="px-3 py-2 text-slate-700 dark:text-slate-100">{row[0]}</td>{row.slice(1).map((cell, cellIndex) => <td key={`${title}-${index}-${cellIndex}`} className="px-3 py-2 text-slate-600 dark:text-slate-200">{cell}</td>)}</tr>)}
                </tbody>
            </table>
        </div>
    </section>;
}

function WarehouseMetric(props: React.ComponentProps<typeof Boxes>) {
    return <Boxes {...props} />;
}
