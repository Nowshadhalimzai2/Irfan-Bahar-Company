import { Head, Link, router } from '@inertiajs/react';
import {
  
    CircleDollarSign,
    Filter,
    Printer,
    Receipt,
    Search,
    SlidersHorizontal,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { getDariCurrency } from '@/components/location-translator';
import AppLayout from '@/layouts/app-layout';
import PaymentDialog from '@/components/sale/payment-dialog';
import sales from '@/routes/sales';

type Payment = { id: number; amount: number; method: string; reference?: string; paidAt: string };
type Invoice = {
    id: number;
    invoice_number: string;
    customer: string;
    phone?: string;
    currency: string;
    total: number;
    paid: number;
    due: number;
    status: string;
    issued_on: Date;
    payments: Payment[];
    saleId: number;
    latest_payment: Payment;
};
type Props = { invoices: Invoice[] };
type QuickFilter = 'all' | 'due' | 'paid';

const money = (value: number, currency: string) =>
    `${value.toFixed(2)} ${getDariCurrency(currency)}`;

export default function AllPayment({ invoices }: Props) {

    const [query, setQuery] = useState('');
    const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
    const [currencyFilter, setCurrencyFilter] = useState('all');
    const [selected, setSelected] = useState<Invoice | null>(null);

    const currencies = useMemo(
        () => Array.from(new Set(invoices.map((invoice) => invoice.currency))),
        [invoices],
    );

    const summaryInvoices =
        currencyFilter === 'all'
            ? invoices
            : invoices.filter((invoice) => invoice.currency === currencyFilter);
    const summaryCurrency =
        currencyFilter === 'all'
            ? invoices[0]?.currency ?? 'AFG'
            : currencyFilter;

    const counts = useMemo(
        () => ({
            all: invoices.length,
            due: invoices.filter((invoice) => invoice.due > 0).length,
            paid: invoices.filter((invoice) => invoice.status === 'paid' || invoice.due <= 0).length,
        }),
        [invoices],
    );

    const filtered = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return invoices.filter((invoice) => {
            const matchesFilter =
                quickFilter === 'all' ||
                (quickFilter === 'due' && invoice.due > 0) ||
                (quickFilter === 'paid' && (invoice.status === 'paid' || invoice.due <= 0));
            const matchesCurrency =
                currencyFilter === 'all' || invoice.currency === currencyFilter;
            const matchesQuery = `${invoice.invoice_number} ${invoice.customer} ${invoice.phone ?? ''}`
                .toLowerCase()
                .includes(normalizedQuery);
            return matchesFilter && matchesCurrency && matchesQuery;
        });
    }, [currencyFilter, invoices, query, quickFilter]);

    const outstanding = summaryInvoices.reduce((sum, invoice) => sum + invoice.due, 0);
    const collected = summaryInvoices.reduce((sum, invoice) => sum + invoice.paid, 0);

    return (
        <AppLayout breadcrumbs={[
            { title: 'پرداخت‌ها', href: '/payments' }
            ,{ title: 'همه پرداخت‌ها', href: '/payments/all' }

        ]}>
            <Head title="مدیریت پرداخت‌ها" />
            <div dir="rtl" className=" space-y-5 bg-[#f6f9fc] px-1 pb-10 dark:bg-transparent">
                <div className="mx-auto max-w-7xl space-y-5">
                    <section className="relative overflow-hidden rounded-[1.75rem] bg-[#092b4c] px-6 py-7 text-white shadow-xl sm:px-8">
                        <div className="absolute -top-16 -left-10 h-48 w-48 rounded-full border-24 border-cyan-300/10" />
                        <div className="relative flex items-center justify-between gap-5">
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-sm text-cyan-200"><Receipt className="size-4" /> مرکز دریافت‌ها</div>
                                <h1 className="text-2xl font-bold sm:text-3xl">مدیریت پرداخت و رسید</h1>
                                <p className="mt-2 text-sm text-blue-100">پرداخت‌های فاکتورها را ثبت، پیگیری و رسید آن‌ها را چاپ کنید.</p>
                            </div>
                            {/* <Link href="/sales" className="hidden rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20 sm:block">بازگشت به فروشات</Link> */}
                        </div>
                    </section>

                    <section className="grid gap-4 sm:grid-cols-3">
                        <Summary title="جمع دریافت‌شده" value={money(collected, summaryCurrency)} icon={CircleDollarSign} tone="blue" />
                        <Summary title="بل‌های باقی‌مانده" value={summaryInvoices.filter((invoice) => invoice.due > 0).length.toString()} icon={Receipt} tone="green" />
                        <Summary title="باقی‌مانده قابل دریافت" value={money(outstanding, summaryCurrency)} icon={CircleDollarSign} tone="amber" />

                    </section>

                    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <div className="border-b border-slate-100 p-5 dark:border-slate-800">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <div className="flex items-center gap-2"><SlidersHorizontal className="size-5 text-primary" /><h2 className="text-lg font-bold">فاکتورها</h2></div>
                                    <p className="mt-1 text-xs text-slate-500">برای دسترسی سریع، یک وضعیت را انتخاب کنید یا جستجو نمایید.</p>
                                </div>
                                <div className="relative w-full lg:w-80">
                                    <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
                                    <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 border-slate-200 bg-slate-50 pr-10" placeholder="جستجوی شماره یا مشتری..." />
                                </div>
                            </div>

                            <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-slate-50 p-2 sm:flex-row sm:items-center dark:bg-slate-800/60">
                                <div className="flex items-center gap-2 px-2 text-xs font-semibold text-slate-500"><Filter className="size-4" /> دسترسی سریع</div>
                                <div className="grid flex-1 grid-cols-3 gap-2">
                                    <QuickFilterButton label="همه فاکتورها" count={counts.all} active={quickFilter === 'all'} onClick={() => setQuickFilter('all')} />
                                    <QuickFilterButton label="نیازمند دریافت" count={counts.due} active={quickFilter === 'due'} onClick={() => setQuickFilter('due')} tone="amber" />
                                    <QuickFilterButton label="تکمیل شده" count={counts.paid} active={quickFilter === 'paid'} onClick={() => setQuickFilter('paid')} tone="green" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 flex justify-between gap-2 px-2 sm:flex-row sm:items-center">
                            <div>
                                <label htmlFor="currency-filter" className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                    ارز پرداخت
                                </label>
                                <select
                                    id="currency-filter"
                                    value={currencyFilter}
                                    onChange={(event) => setCurrencyFilter(event.target.value)}
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 sm:w-56 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                >
                                    <option value="all">همه ارزها</option>
                                    {currencies.map((currency) => (
                                        <option key={currency} value={currency}>
                                            {getDariCurrency(currency)} ({currency})
                                        </option>
                                    ))}
                                </select>
                            </div>
                          
                        </div>

                        <div className="flex items-center justify-between px-5 py-3 text-xs text-slate-400">
                            <span>{filtered.length} فاکتور نمایش داده می‌شود</span>
                            {(query || quickFilter !== 'all' || currencyFilter !== 'all') && <button type="button" onClick={() => { setQuery(''); setQuickFilter('all'); setCurrencyFilter('all'); }} className="font-semibold text-primary hover:underline">پاک‌کردن فیلترها</button>}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-200 text-right text-sm">
                                <thead className="border-b text-xs text-slate-400"><tr><th className="px-5 py-3 font-medium">فاکتور</th><th className="py-3 font-medium">مشتری</th><th className="py-3 font-medium">کل</th><th className="py-3 font-medium">دریافت</th><th className="py-3 font-medium">باقی‌مانده</th><th className="py-3 font-medium">وضعیت</th><th className="py-3 font-medium">عملیات</th></tr></thead>
                                <tbody>
                                    {filtered.map((invoice) => <tr key={invoice.id} className="border-b last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                        <td className="px-5 py-4"><b className="text-primary hover:cursor-pointer hover:underline" title='تاریخ پرداخت ها را بل بیبنین' onClick={() => router.get(`/sales/invoice/${invoice.id}/payments`)}>{invoice.invoice_number}</b><small className="mt-1 block text-xs text-slate-400">{new Date(invoice.issued_on).toLocaleDateString('fa-AF')}</small></td>
                                        <td className="py-4 font-medium">{invoice.customer === 'مشتری ګذری' ? 'پرچون' : invoice.customer}<small className="mt-1 block text-xs text-slate-400">{invoice.phone ?? 'پرچون'}</small></td>
                                        <td className="py-4 font-semibold">{money(invoice.total, invoice.currency)}</td><td className="py-4 text-emerald-600">{money(invoice.paid, invoice.currency)}</td><td className="py-4 font-bold text-amber-600">{money(invoice.due, invoice.currency)}</td>
                                        <td className="py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] ${invoice.status === 'paid' || invoice.due <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{invoice.status === 'paid' || invoice.due <= 0 ? 'تکمیل شده' : 'نیازمند دریافت'}</span></td>
                                        <td className="py-4"><div className="flex items-center gap-3"><button type="button" disabled={invoice.due <= 0} onClick={() => setSelected(invoice)} className="text-xs font-semibold text-primary disabled:text-slate-300">ثبت دریافت</button><Link href={`/sales/${invoice.saleId}/invoice/print`} title="چاپ فاکتور" className="text-slate-400 hover:text-primary"><Printer className="size-4" /></Link></div></td>
                                    </tr>)}
                                </tbody>
                            </table>
                            {filtered.length === 0 && <div className="p-12 text-center text-sm text-slate-500">فاکتوری با این فیلتر پیدا نشد.</div>}
                        </div>
                    </section>
                </div>
            </div>
            {selected && <PaymentDialog invoice={selected} onClose={() => setSelected(null)} />}
        </AppLayout>
    );
}

function QuickFilterButton({ label, count, active, onClick, tone = 'blue' }: { label: string; count: number; active: boolean; onClick: () => void; tone?: 'blue' | 'amber' | 'green' }) {
    const accent = { blue: 'text-primary', amber: 'text-amber-700', green: 'text-emerald-700' }[tone];
    return <button type="button" onClick={onClick} className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${active ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/70'}`}><span>{label}</span><span className={`rounded-full px-2 py-0.5 text-[11px] ${active ? `bg-slate-100 ${accent}` : 'bg-slate-200/70 text-slate-500'}`}>{count}</span></button>;
}

function Summary({ title, value, icon: Icon, tone }: { title: string; value: string; icon: typeof CircleDollarSign; tone: 'blue' | 'green' | 'amber' }) {
    const colors = { blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600' };
    return <div className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-3"><div className={`rounded-xl p-2.5 ${colors[tone]}`}><Icon className="size-5" /></div><div><p className="text-xs text-slate-500">{title}</p><b className="mt-1 block text-xl">{value}</b></div></div></div>;
}
