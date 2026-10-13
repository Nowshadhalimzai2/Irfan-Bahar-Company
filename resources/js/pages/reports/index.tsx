import { Head, router } from '@inertiajs/react';
import {
    Activity,
    ArrowDownLeft,
    ArrowUpRight,
    BarChart3,
    Boxes,
    CalendarDays,
    ClipboardList,
    Coins,
    CreditCard,
    Factory,
    FileBarChart,
    FileSpreadsheet,
    Printer,
    TriangleAlert,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import PersionDatePicker from '@/components/persion-date-picker';
import AppLayout from '@/layouts/app-layout';

type CatalogItem = { id: number | string; name: string };
type ShopInventoryRow = { product: string; quantity: number; value: number; is_low_stock?: boolean };

type ReportProps = {
    filters: {
        period: 'daily' | 'monthly'; date: string; dateGregorian?: string; preset?: string; business_unit?: string;
        product?: string | number | null; category?: string | number | null;
        vendor?: string | number | null; customer?: string | number | null;
    };
    range: { start: string; end: string; label: string };
    summary: {
        sales: { total: number; count: number }; expenses: { total: number; count: number };
        payments: { total: number }; refunds: { total: number };
        attendance: { present: number; absent: number }; movements: number; production: number; activity: number;
        cost_of_goods_sold?: number; gross_profit?: number; raw_material_purchase_cost?: number;
        production_quantity_completed?: number; production_cost?: number; shop_stock_value?: number;
        factory_stock_value?: number; low_stock_items_count?: number; internal_transfers?: number;
        low_stock_items?: { item: { id: number, name: string, code: string }, quantity: number, total_cost: number }[]
    };
    dailySales: { label: string; date: string; sales: number; count: number }[];
    expenseByCurrency: { currency: string; amount: number; count: number }[];
    currencySummary: { currency: string; sales_total: number; refund_total: number; net_total: number; expenses_total: number; sales_count: number; refund_count: number; expense_count: number }[];
    movementSummary: { type: string; movements: number; quantity: number }[];
    productionSummary: { status: string; total: number }[];
    topProducts: { name: string; total: number; quantity: number }[];
    customerSales: { customer: string; total: number; orders: number }[];
    vendorPurchases: { vendor: string; total: number; count: number }[];
    internalTransfers: { date: string; product: string; quantity: number; value: number }[];
    shopInventory: ShopInventoryRow[];
    catalog?: { products?: CatalogItem[]; categories?: CatalogItem[]; customers?: CatalogItem[]; suppliers?: CatalogItem[] };
};

const movementLabels: Record<string, string> = {
    receipt: 'دریافت', transferred_out: 'انتقال به بیرون', transferred_in: 'انتقال به داخل',
    production_consumption: 'مصرف در تولید', production_output: 'خروجی تولید', sale: 'فروش',
    sale_return: 'برگشت فروش', adjustment_in: 'تعدیل مثبت', adjustment_out: 'تعدیل منفی',
};
const statusLabels: Record<string, string> = {
    pending: 'در انتظار', progress: 'در جریان', completed: 'تکمیل‌شده', drafted: 'پیش‌نویس', cancelled: 'لغوشده',
};
const presetLabels: Record<string, string> = { custom: 'دلخواه', today: 'امروز', yesterday: 'دیروز', this_month: 'این ماه', last_month: 'ماه گذشته' };
const businessUnitLabels: Record<string, string> = { consolidated: 'مجموعی', factory: 'کارخانه', shop: 'فروشگاه' };
const money = (value: number) => Number.isFinite(value) ? value.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '0';
const formatPersianDate = (date: Date, period: 'daily' | 'monthly') => {
    const parts = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {
        year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const month = values.month.padStart(2, '0');

    return period === 'monthly' ? `${values.year}/${month}` : `${values.year}/${month}/${values.day.padStart(2, '0')}`;
};

export default function Reports({ filters, range, summary, dailySales, expenseByCurrency, currencySummary, movementSummary, productionSummary, topProducts, customerSales, vendorPurchases, internalTransfers, catalog }: ReportProps) {

    const applyPresetValue = (nextPreset: string, nextPeriod: 'daily' | 'monthly') => {
        const today = new Date();
        let presetDate = today;

        if (nextPreset === 'yesterday') {
            presetDate = new Date(today);
            presetDate.setDate(today.getDate() - 1);
        }

        if (nextPreset === 'last_month') {
            presetDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        }

        setPickerDate(presetDate);
        setDate(formatPersianDate(presetDate, nextPeriod));
    };

    const changePeriod = (value: string) => {
        const nextPeriod = value as 'daily' | 'monthly';
        setPeriod(nextPeriod);
        setPreset('custom');
        setDate(formatPersianDate(pickerDate, nextPeriod));
    };

    const [period, setPeriod] = useState(filters.period);
    const [preset, setPreset] = useState(filters.preset ?? 'custom');
    const [businessUnit, setBusinessUnit] = useState(filters.business_unit ?? 'consolidated');
    const [product, setProduct] = useState(String(filters.product ?? ''));
    const [category, setCategory] = useState(String(filters.category ?? ''));
    const [vendor, setVendor] = useState(String(filters.vendor ?? ''));
    const [customer, setCustomer] = useState(String(filters.customer ?? ''));
    const [date, setDate] = useState(filters.date);
    const [pickerDate, setPickerDate] = useState(() => new Date(`${filters.dateGregorian ?? new Date().toISOString().slice(0, 10)}T12:00:00`));
    const maxSales = useMemo(() => Math.max(...dailySales.map((item) => item.sales), 1), [dailySales]);

    const applyFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get('/reports', { period, preset, business_unit: businessUnit, product: product || undefined, category: category || undefined, vendor: vendor || undefined, customer: customer || undefined, date }, { preserveState: true, preserveScroll: true });
    };
    const exportExcel = (language = 'english') => {
        const params = new URLSearchParams({
            period,
            preset,
            business_unit: businessUnit,
            date,
            language,
            ...(product ? { product } : {}),
            ...(category ? { category } : {}),
            ...(vendor ? { vendor } : {}),
            ...(customer ? { customer } : {}),
        });

        window.location.href = `/reports/export?${params.toString()}`;
    };
    const printReport = () => window.print();
    const cards = [
        ['عاید فروش بیرونی', summary.sales.total, `${summary.sales.count} فروش / سفارش`, ArrowUpRight, 'emerald'],
        ['بهای تمام‌شده کالای فروخته‌شده', summary.cost_of_goods_sold ?? 0, 'مبنای هزینهٔ تولید', ArrowDownLeft, 'rose'],
        ['سود ناخالص', summary.gross_profit ?? 0, 'عاید منهای بهای تمام‌شده', Coins, 'sky'],
        ['هزینهٔ خرید مواد خام', summary.raw_material_purchase_cost ?? 0, 'هزینهٔ خرید خارجی', CreditCard, 'amber'],
        ['مصارف شرکت', summary.expenses.total, `${summary.expenses.count} ثبت هزینه`, CreditCard, 'rose'],
        ['پرداخت‌های دریافتی', summary.payments.total, 'پرداخت ثبت‌شده در دوره', Coins, 'emerald'],
        ['برگشت فروش', summary.refunds.total, 'مبالغ برگشتی در دوره', ArrowDownLeft, 'rose'],
        ['تولید تکمیل‌شده', summary.production_quantity_completed ?? 0, 'خروجی در دوره', Factory, 'violet'],
        ['هزینهٔ تولید', summary.production_cost ?? 0, 'مبنای هزینهٔ عملیات', Activity, 'indigo'],
        ['ارزش موجودی فروشگاه', summary.shop_stock_value ?? 0, 'ارزش‌گذاری موجودی', Boxes, 'sky'],
        ['ارزش موجودی کارخانه', summary.factory_stock_value ?? 0, 'کالای نهایی در کارخانه', Boxes, 'emerald'],
        ['اقلام کم‌موجودی', summary.low_stock_items_count ?? 0, 'نیازمند تأمین مجدد', TriangleAlert, 'amber'],
    ] as const;

    return (
        <AppLayout breadcrumbs={[{ title: 'مرکز راپورها', href: '/reports' }]}>
            <Head title="مرکز راپورها" />
            <div id="printArea" dir="rtl" lang="fa" className="report-print-area space-y-5 bg-slate-50/60 px-4 py-5 text-right dark:bg-slate-950/50 lg:px-6">
                <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-end">
                    <div><div className="flex items-center gap-2 text-sm font-medium text-primary"><FileBarChart className="h-4 w-4" /> مرکز راپورها</div><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">راپورهای کارخانه و فروشگاه</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">راپور عملیاتی؛ فروش بیرونی از انتقالات داخلی جدا محاسبه می‌شود.</p></div>
                    <div className="flex min-w-0 flex-col gap-3">
                        <form onSubmit={applyFilters} className="min-w-0 space-y-3">
                            <div className="space-y-2">
                                <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200">زمان راپور</h2>
                                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                    <Select label="بازهٔ آماده" value={preset} onChange={(value) => {
                                        setPreset(value);
                                        const presetPeriod = ['this_month', 'last_month'].includes(value) ? 'monthly' : 'daily';
                                        setPeriod(presetPeriod);

                                        if (['today', 'yesterday', 'this_month', 'last_month'].includes(value)) {
                                            applyPresetValue(value, presetPeriod);
                                        }
                                    }} options={[[ 'custom', 'دلخواه'], ['today', 'امروز'], ['yesterday', 'دیروز'], ['this_month', 'این ماه'], ['last_month', 'ماه گذشته']]} />
                                    <Select label="نمایش بر اساس" value={period} onChange={changePeriod} options={[[ 'daily', 'روزانه'], ['monthly', 'ماهانه']]} />
                                    <div className="w-full">
                                        <PersionDatePicker
                                            id="report-date"
                                            label={period === 'monthly' ? 'ماه فارسی' : 'تاریخ فارسی'}
                                            type={period === 'monthly' ? 'month' : 'date'}
                                            value={pickerDate}
                                            onChange={(gregorianDate, persianDate) => {
                                                setPreset('custom');

                                                if (gregorianDate) {
                                                    setPickerDate(gregorianDate);
                                                }

                                                if (persianDate) {
                                                    setDate(persianDate);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                                <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200">دامنهٔ کاری</h2>
                                <Select label="بخش کاری" value={businessUnit} onChange={setBusinessUnit} options={[[ 'consolidated', 'مجموعی'], ['factory', 'کارخانه'], ['shop', 'فروشگاه']]} />
                            </div>
                            <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                                <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200">محدودسازی نتایج</h2>
                                <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                                    <CatalogSelect label="محصول" value={product} onChange={setProduct} items={catalog?.products} />
                                    <CatalogSelect label="دسته‌بندی" value={category} onChange={setCategory} items={catalog?.categories} />
                                    <CatalogSelect label="تأمین‌کننده" value={vendor} onChange={setVendor} items={catalog?.suppliers} />
                                    <CatalogSelect label="مشتری" value={customer} onChange={setCustomer} items={catalog?.customers} />
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                                <button type="submit" className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900">نمایش راپور</button>
                                <button type="button" onClick={printReport} className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"><Printer className="h-4 w-4" /> چاپ / ذخیره به‌صورت PDF</button>
                                <button type="button" onClick={()=>exportExcel()} className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"><FileSpreadsheet className="h-4 w-4" /> Excel</button>
                                {/* <button type="button" onClick={() => exportExcel('dari')} className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"><FileSpreadsheet className="h-4 w-4" /> Excel دری</button> */}
                            </div>
                        </form>
                    </div>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100"><div className="flex items-center gap-2"><TriangleAlert className="h-4 w-4" /><span>انتقالات داخلی کارخانه به فروشگاه در راپور عملیاتی دیده می‌شود، اما در عاید بیرونی و سود ناخالص مجموعی محاسبه نمی‌گردد.</span></div></div>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-2 text-sm text-slate-500"><CalendarDays className="h-4 w-4" /> نمایش <span className="font-semibold text-slate-700 dark:text-slate-200">{range.label}</span><span className="text-slate-300">|</span>{range.start} تا {range.end}</div><div className="flex flex-wrap gap-2 text-xs text-slate-500"><span className="rounded-full border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900">بخش: {businessUnitLabels[businessUnit] ?? businessUnit}</span><span className="rounded-full border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900">بازه: {presetLabels[preset] ?? preset}</span></div></div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, detail, Icon, tone]) => <MetricCard key={label} label={label} value={money(value)} detail={detail} icon={Icon} tone={tone} />)}</div>
                <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]"><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-900 dark:text-white">فعالیت فروش</h2><p className="mt-1 text-xs text-slate-500">عاید بیرونی در دورهٔ انتخاب‌شده</p></div><BarChart3 className="h-5 w-5 text-primary" /></div><div className="mt-6 flex h-48 items-end gap-2 border-b border-slate-100 pb-0 dark:border-slate-800">{dailySales.length === 0 ? <p className="w-full pb-8 text-center text-sm text-slate-400">در این دوره فروشی ثبت نشده است.</p> : dailySales.map((item) => <div key={item.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="relative w-full max-w-10 rounded-t-lg bg-emerald-400/80 transition hover:bg-emerald-500" style={{ height: `${Math.max((item.sales / maxSales) * 100, 4)}%` }} title={`${money(item.sales)} · ${item.count} فروش`} /><span className="text-[10px] text-slate-400">{item.label}</span></div>)}</div></section><SummaryPanel title="خلاصهٔ هزینه‌ها" icon={Coins} rows={expenseByCurrency.map((item) => [item.currency, `${money(item.amount)} — ${item.count} ثبت`])} empty="در این دوره هزینه‌ای ثبت نشده است." /></div>
                <div className="grid gap-5 lg:grid-cols-3"><SummaryPanel title="کارکنان و فعالیت" icon={Users} rows={[['حاضر', summary.attendance.present], ['غایب', summary.attendance.absent], ['عملیات سیستم', summary.activity]]} /><SummaryPanel title="حرکت‌های موجودی" icon={Boxes} rows={movementSummary.map((item) => [movementLabels[item.type] ?? item.type, `${item.movements} حرکت ${money(item.quantity)} مقدار`])} empty="هیچ حرکت موجودی ثبت نشده است." /><SummaryPanel title="سفارش‌های تولید" icon={Factory} rows={productionSummary.map((item) => [statusLabels[item.status] ?? item.status, item.total])} empty="هیچ سفارش تولید ثبت نشده است." /></div>
                <div className="grid gap-5 xl:grid-cols-2"><TableCard title="محصولات پرفروش" columns={['محصول', 'مقدار', 'ارزش']} rows={topProducts.map((row) => [row.name, money(row.quantity), money(row.total)])} empty="در این دوره فروشی ثبت نشده است." /><TableCard title="فروش مشتریان" columns={['#','مشتری', 'سفارش‌ها', 'مجموع']} rows={customerSales.map((row,ind) => [(ind+1).toString(),row.customer, String(row.orders), money(row.total)])} empty="فروشی برای مشتریان یافت نشد." /></div>
                <div className="grid gap-5 xl:grid-cols-2"><TableCard title="خرید از تأمین‌کنندگان" columns={['تأمین‌کننده', 'ثبت‌ها', 'مجموع']} rows={vendorPurchases.map((row) => [row.vendor, String(row.count), money(row.total)])} empty="در این دوره خریدی از تأمین‌کننده ثبت نشده است." /><TableCard title="انتقالات داخلی" columns={['تاریخ', 'محصول', 'مقدار', 'ارزش']} rows={internalTransfers.map((row) => [row.date, row.product, money(row.quantity), money(row.value)])} empty="انتقال داخلی ثبت نشده است." /></div>
                <div className="grid gap-5 xl:grid-cols-1"><TableCard title="خلاصهٔ ارزها" columns={['ارز', 'فروش', 'برگشت', 'خالص', 'هزینه‌ها']} rows={currencySummary.map((row) => [row.currency, money(row.sales_total), money(row.refund_total), money(row.net_total), money(row.expenses_total)])} empty="برای این دوره خلاصهٔ ارزی وجود ندارد." /></div>
                <div className="grid gap-5 xl:grid-cols-2"><TableCard title="اقلام کم‌موجودی" columns={['محصول', 'کود جنس', 'مقدار', 'ارزش']} rows={summary.low_stock_items ? summary.low_stock_items?.map((row) => [row.item.name, row.item.code, money(row.quantity), money(row.total_cost)]) : []} empty="هیچ قلم کم‌موجودی گزارش نشده است." /><TableCard title="یادداشت‌های عملیاتی" columns={['مورد', 'مقدار']} rows={[[`عاید بیرونی`, money(summary.sales.total)], [`برگشت فروش`, money(summary.refunds.total ?? 0)], [`بهای تمام‌شده`, money(summary.cost_of_goods_sold ?? 0)], [`سود ناخالص`, money(summary.gross_profit ?? 0)], [`ارزش انتقالات داخلی`, money(summary.internal_transfers ?? 0)]]} empty="خلاصهٔ عملیاتی موجود نیست." /></div>
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3"><MiniMetric icon={ClipboardList} label="حرکت‌های موجودی" value={summary.movements} /><MiniMetric icon={Factory} label="سفارش‌های تولید" value={summary.production} /><MiniMetric icon={Activity} label="فعالیت سیستم" value={summary.activity} /></div>
            </div>
        </AppLayout>
    );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
    return (
        <label className="text-xs font-semibold text-slate-500">
            {label}
            <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block h-10 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none ring-primary focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
        </label>
    );
}
function CatalogSelect({ label, value, onChange, items = [] }: { label: string; value: string; onChange: (value: string) => void; items?: CatalogItem[] }) {
    return (
        <label className="text-xs font-semibold text-slate-500">
            {label}
            <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block h-10 max-w-40 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none ring-primary focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="">همه</option>
                {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
        </label>
    );
}
function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: LucideIcon; tone: string }) {
    const colors: Record<string, string> = { emerald: 'text-emerald-500', rose: 'text-rose-500', sky: 'text-sky-500', amber: 'text-amber-500', violet: 'text-violet-500', indigo: 'text-indigo-500' };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <Icon className={`h-5 w-5 ${colors[tone] ?? 'text-slate-500'}`} />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white" dir="ltr">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
    );
}

function SummaryPanel({ title, icon: Icon, rows, empty = 'داده‌ای ثبت نشده است.' }: { title: string; icon: LucideIcon; rows: [string, string | number][]; empty?: string }) {
    return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-slate-900 dark:text-white">{title}</h2>
        </div>
        <div className="mt-4 space-y-2">{rows.length === 0 ?
            <p className="text-sm text-slate-400">
                {empty}
            </p> : rows.map(([label, value]) =>
                <div key={label} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0 dark:border-slate-800" >
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100" >{value}</span>
                </div>)}
        </div>
    </section>;
}
function MiniMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
    return (
        <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div>
            <div><p className="text-xs text-slate-500">{label}</p><p className="font-bold text-slate-800 dark:text-slate-100">{value}</p></div>
        </div>
    );
}
function TableCard({ title, columns, rows, empty }: { title: string; columns: string[]; rows: string[][]; empty: string }) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-bold text-slate-900 dark:text-white">{title}</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="min-w-full text-right text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>{columns.map((column) => <th key={column} className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-200">{column}</th>)}</tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-slate-400">{empty}</td></tr> : rows.map((row, index) => <tr key={`${title}-${index}`} className="border-t border-slate-100 dark:border-slate-800">{row.map((cell, cellIndex) => <td key={`${title}-${index}-${cellIndex}`} className="px-3 py-2 text-slate-600 dark:text-slate-200">{cell}</td>)}</tr>)}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
