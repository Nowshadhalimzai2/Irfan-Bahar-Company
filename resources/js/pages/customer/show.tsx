import { Link, router } from '@inertiajs/react';
import { Accessibility, ArrowLeft, ArrowRight, Banknote, CalendarDays, CheckCircle2, CircleDollarSign, CreditCard, Edit3, FileText, HandCoins, Mail, MapPin, Phone, Printer, Receipt, User, Wallet, XCircle } from 'lucide-react';
import { CustomeDropDownMenu } from '@/components/customer-dropdwon';
import { getDariCurrency } from '@/components/location-translator';
import AppLayout from '@/layouts/app-layout';
import type {  Customer } from '@/types';
import { useMemo, useState } from 'react';
import PaymentDialog from '@/components/sale/payment-dialog';

type Payment = { id: number; amount: number; method: string; reference?: string; paidAt: string };
type CustomerSale = { id: number; status: string; after_descount_total: number; amount_paid: number; sold_at: string; currency: { name: string }; invoice?: Invoice, sale_returns: { id: number; total: number; refund_amount: number }[] };
interface Props {
    customer: Customer;
    sales: CustomerSale[];
    invoices: Invoice[];
}

type Invoice = {
    id: number;
    invoice_number: string;
    customer: string;
    phone?: string;
    currency: string;
    total: number;
    paid: number;
    due: number;
    original_total: number;
    return_total: number;
    refunded_amount: number;
    status: string;
    issued_on: Date;
    payments: Payment[];
    saleId: number;
};

const money = (value: number, currency: string) => `${Number(value || 0).toFixed(2)} ${getDariCurrency(currency)}`;
const date = (value?: string) => value ? new Date(value).toLocaleDateString('fa-AF') : 'ثبت نشده';
const methodLabels: Record<string, string> = { cash: 'نقدی', bank_transfer: 'حواله بانکی', office: 'دفتر', teller: 'تحویل‌دار' };

export default function Show({ customer, sales, invoices }: Props) {
    console.log(sales);

    const accounts = useMemo(
        () => Array.from(new Set([
            ...invoices.map((invoice) => invoice.currency),
            ...sales.map((sale) => sale.currency?.name),
        ].filter(Boolean))),
        [invoices, sales],
    );
    const [selectedCurrency, setSelectedCurrency] = useState<'AFG' | 'PKR' | 'USD' | string>(accounts[0] ?? 'AFG');
    const [selected, setSelected] = useState<Invoice | null>(null);
    const payments = invoices.flatMap((invoice) => invoice.payments.map((payment) => ({ ...payment, invoice })));
    const latestPayment = [...payments].sort((left, right) => Date.parse(right.paidAt) - Date.parse(left.paidAt))[0];
    const invoiceBySaleId = new Map(invoices.map((invoice) => [invoice.saleId, invoice]));
    const currency = getDariCurrency(sales[0]?.currency?.name ?? invoices[0]?.currency ?? 'AFG');
    const currencySummaries = accounts.map((summaryCurrency) => {
        const currencySales = sales.filter((sale) => sale.status !== 'cancelled' && sale.currency?.name === summaryCurrency);
        const salesTotal = currencySales.reduce((sum, sale) => {
            const returned = sale.sale_returns.reduce((returnSum, saleReturn) => returnSum + Number(saleReturn.total || 0), 0);
            const invoice = invoiceBySaleId.get(sale.id);
            return sum + (invoice?.total ?? Math.max(0, Number(sale.after_descount_total || 0) - returned));
        }, 0);
        const refunded = currencySales.reduce((sum, sale) =>
            sum + sale.sale_returns.reduce((returnSum, saleReturn) => returnSum + Number(saleReturn.refund_amount || 0), 0), 0);
        const paid = currencySales.reduce((sum, sale) => {
            const refundedForSale = sale.sale_returns.reduce((returnSum, saleReturn) => returnSum + Number(saleReturn.refund_amount || 0), 0);
            const invoice = invoiceBySaleId.get(sale.id);
            return sum + (invoice?.paid ?? Math.max(0, Number(sale.amount_paid || 0) - refundedForSale));
        }, 0);
        const due = currencySales.reduce((sum, sale) => {
            const invoice = invoiceBySaleId.get(sale.id);
            if (invoice) return sum + Number(invoice.due || 0);
            const returned = sale.sale_returns.reduce((returnSum, saleReturn) => returnSum + Number(saleReturn.total || 0), 0);
            const refundedForSale = sale.sale_returns.reduce((returnSum, saleReturn) => returnSum + Number(saleReturn.refund_amount || 0), 0);
            const total = Math.max(0, Number(sale.after_descount_total || 0) - returned);
            const netPaid = Math.max(0, Number(sale.amount_paid || 0) - refundedForSale);
            return sum + Math.max(0, total - netPaid);
        }, 0);

        return {
            currency: summaryCurrency,
            sales: salesTotal,
            paid,
            due,
            refunded,
        };
    });
    const currentCards = currencySummaries.find((summary) => summary.currency === selectedCurrency) ?? {
        currency: selectedCurrency,
        sales: 0,
        paid: 0,
        due: 0,
        refunded: 0,
    };

    
    return <AppLayout breadcrumbs={[{ title: 'مشتریان', href: '/stackholders' }, { title: customer.name, href: `/customers/${customer.id}` }]}>
        <div dir="rtl" className="min-h-screen space-y-6 bg-[#f6f9fc] p-3 pb-10 md:p-6">
            <section className="relative overflow-hidden rounded-4xl bg-[#092b4c] p-6 text-white shadow-xl md:p-8">
                <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full border-28 border-cyan-300/10" />
                <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                            <User size={32} />
                        </div>
                        <div>
                            <p className="mb-1 text-sm text-cyan-200">پروفایل مشتری</p>
                            <h1 className="text-2xl font-bold md:text-3xl">{customer.name}</h1>
                            <p className="mt-1 text-blue-100">{customer.nick_name || 'بدون تخلص'}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${customer.is_active ? 'bg-emerald-400/15 text-emerald-200' : 'bg-red-400/15 text-red-200'}`}>
                            {customer.is_active ? <CheckCircle2 size={17} /> : <XCircle size={17} />
                            }{customer.is_active ? 'فعال' : 'بلاک'}</span>
                        <Link href={`/customers/${customer.id}/edit`} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#092b4c] transition hover:bg-cyan-50">
                            <Edit3 size={17} /> ویرایش مشتری
                        </Link>
                        <CustomeDropDownMenu items={[{ name: customer.is_active ? 'بلاک نمودن' : 'فعال نمودن', url: `/customers/status/${customer.id}` }]} method="put" />

                    </div>

                </div>
            </section>

            <div className=''>
                <select className='w-full bg-white shadow p-2 rounded-md' onChange={(e) => setSelectedCurrency(e.target.value as 'AFG' | 'PKR' | 'USD' | string)}>
                    {accounts.map(account => <option value={account} key={account}>{getDariCurrency(account)}</option>)}
                </select>
            </div>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div key={currentCards.currency} className="contents">
                    <StatCard title={`مجموع فروش (${getDariCurrency(currentCards.currency)})`} value={money(currentCards.sales, currentCards.currency)} icon={<CircleDollarSign />} tone="blue" />
                    <StatCard title={`دریافت‌ شده (${getDariCurrency(currentCards.currency)})`} value={money(currentCards.paid, currentCards.currency)} icon={<HandCoins />} tone="emerald" />
                    <StatCard title={`باقی‌ مانده (${getDariCurrency(currentCards.currency)})`} value={money(Math.max(currentCards.due, 0), currentCards.currency)} icon={<Wallet />} tone="amber" />
                </div>
                <StatCard title="مبلغ بازپرداخت‌شده" value={money(currentCards.refunded, currentCards.currency)} icon={<Receipt />} tone="violet" />
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
                <section className="min-w-0 rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 p-5">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">تاریخچه فروشات</h2>
                            <p className="mt-1 text-sm text-slate-500">تمام معاملات ثبت‌شده این مشتری</p>
                        </div>
                        <div className='space-y-1'>
                            <FileText className="text-cyan-600" />
                            <Link href={`/customers/${customer.id}/invoices`} className='hover:underline hover:shadow-xl hover:text-blue-500 '><ArrowLeft className='h-4 w-7 hover:h-5 transition-all' /></Link>
                        </div>

                    </div>
                    <div className="overflow-x-auto ">
                        <table className="w-full min-w-162.5 text-right text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500">
                                <tr>
                                    <th className="text-center px-5 py-3 font-medium">انوایس</th>
                                    <th className="text-center py-3 font-medium">مبلغ خالص</th>
                                    <th className="text-center py-3 font-medium">برگشت</th>
                                    <th className="text-center py-3 font-medium">باقی‌مانده</th>
                                    <th className="text-center py-3 font-medium">وضعیت</th>
                                    <th className="text-center py-3 font-medium">دربافت پرداخت</th>
                                </tr>
                            </thead><tbody>{sales.filter(sale => sale.currency.name === selectedCurrency).map((sale) => {
                                const returnTotal = sale.sale_returns.reduce((sum, saleReturn) => sum + Number(saleReturn.total || 0), 0);
                                const refundTotal = sale.sale_returns.reduce((sum, saleReturn) => sum + Number(saleReturn.refund_amount || 0), 0);
                                const customerInvoice = invoiceBySaleId.get(sale.id);
                                const saleTotal = customerInvoice?.total ?? Math.max(0, Number(sale.after_descount_total || 0) - returnTotal);
                                const invoicePaid = customerInvoice?.paid ?? Math.max(0, Number(sale.amount_paid || 0) - refundTotal);
                                const invoiceDue = customerInvoice?.due ?? Math.max(0, saleTotal - invoicePaid);
                                const invoice_id = sale.invoice ? sale.invoice.id : 0;
                                // const invoiceDate = new Date(sale.invoice?.issuedOn).toDateString();
                                return <tr title={`پرداخت : ${money(invoicePaid, sale.currency?.name || currency)}`} key={sale.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                                    <td className="px-5 py-4"><b className="text-primary hover:cursor-pointer hover:underline" title='تاریخ پرداخت ها را بل بیبنین' onClick={() => router.get(`/sales/invoice/${invoice_id}/payments`)}>{sale?.invoice?.invoice_number}</b><small className="mt-1 block text-xs text-slate-400">{new Date(sale?.invoice ? sale.invoice.issued_on : '').toLocaleDateString('fa-AF')}</small></td>
                                    <td className="text-center py-4 font-semibold">{money(saleTotal, sale.currency?.name || currency)}</td>
                                    <td className="text-center py-4 text-rose-600">{returnTotal}</td>
                                    <td className="text-center py-4 text-amber-700">{sale.status == 'cancelled' ? 0 : money(invoiceDue, sale.currency?.name || currency)}</td>
                                    <td className="text-center py-4"><Status status={sale.status === 'cancelled' ? sale.status : (sale.invoice?.status || sale.status)} /></td>
                                    <td className="text-center py-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                disabled={sale.status === 'cancelled' || !customerInvoice || customerInvoice.status === 'paid' || customerInvoice.due <= 0}
                                                onClick={() => setSelected(customerInvoice ?? null)}
                                                className="text-xs font-semibold text-primary disabled:text-slate-300"
                                            >
                                                ثبت دریافت
                                            </button>
                                            <Link
                                                href={`/sales/${sale.id}/invoice/print`}
                                                title="چاپ فاکتور"
                                                className="text-slate-400 hover:text-primary"
                                            >
                                                <Printer className="size-4" />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>;
                            })}</tbody></table>{!sales.length && <EmptyState text="هنوز هیچ فروشی برای این مشتری ثبت نشده است." />}</div></section>
                <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-5">
                        <h2 className="text-xl font-bold text-slate-800">پرداخت‌های اخیر</h2>
                        <p className="mt-1 text-sm text-slate-500">آخرین دریافت‌های ثبت‌شده</p>
                    </div>
                    <div className="divide-y divide-slate-100">{payments.slice(0, 5).map((payment) =>
                        <div key={payment.id} className="flex items-start gap-3 p-4">
                            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600"><Banknote size={19} /></div>
                            <div className="min-w-0 flex-1"><div className="flex justify-between gap-3">
                                <p className="font-semibold text-slate-800">{money(Number(payment.amount), payment.invoice.currency)}</p><span className="text-xs text-slate-400">{date(payment.paidAt)}</span>
                            </div>
                                <p className="mt-1 text-xs text-slate-500">{methodLabels[payment.method] || payment.method} · {payment.invoice.invoice_number}</p>
                            </div>
                        </div>)}
                        {!payments.length && <EmptyState text="هنوز هیچ پرداختی ثبت نشده است." />}</div>
                </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-4 text-xl font-bold text-slate-800">اطلاعات تماس</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Detail icon={<Phone />} label="شماره تماس" value={customer.phone || 'ثبت نشده'} />
                        <Detail icon={<Mail />} label="ایمیل" value={customer.email || 'ثبت نشده'} /><Detail icon={<MapPin />} label="آدرس" value={customer.address || 'ثبت نشده'} />
                        <Detail icon={<CalendarDays />} label="تاریخ عضویت" value={date(String(customer.created_at))} /></div></section><section className="rounded-3xl bg-[#092b4c] p-6 text-white shadow-lg"><div className="mb-6 flex items-center justify-between"><div><p className="text-sm text-cyan-200">خلاصه حساب</p><h2 className="mt-1 text-xl font-bold">وضعیت مالی</h2></div>
                            <CreditCard className="text-cyan-200" /></div><div className="space-y-4 text-sm">

                        <SummaryRow label="تعداد انوایسها" value={`${invoices.length}`} />
                        <SummaryRow label="آخرین پرداخت" value={latestPayment ? date(latestPayment.paidAt) : 'ثبت نشده'} />
                        <SummaryRow label="آخرین مبلغ دریافتی" value={latestPayment ? money(Number(latestPayment.amount), latestPayment.invoice.currency) : 'ثبت نشده'} />
                    </div>
                </section>
            </div>
            <Link href="/stackholders" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-900"><ArrowRight size={18} /> بازگشت به فهرست مشتریان</Link>
        </div>
        {selected && (
            <PaymentDialog
                invoice={selected}
                onClose={() => setSelected(null)}
            />
        )}
    </AppLayout>;
}

function StatCard({ title, value, icon, tone }: { title: string; value: string; icon: React.ReactNode; tone: 'blue' | 'emerald' | 'amber' | 'violet' }) {
    const tones = { blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', violet: 'bg-violet-50 text-violet-600' };

    return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`mb-4 flex size-11 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</div><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-lg font-bold text-slate-800">{value}</p></div>;
}
function Status({ status }: { status: string }) {
    const labels: Record<string, string> = { paid: 'تسویه شده', partially_paid: 'پرداخت ناقص', completed: 'تکمیل شده', cancelled: 'لغو شده', issued: 'صادر شده', draft: 'پیش‌نویس' };
    const positive = ['paid', 'completed'].includes(status);

    return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${positive ? 'bg-emerald-50 text-emerald-700' : status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{labels[status] || status}</span>;
}
function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><div className="rounded-xl bg-white p-2 text-cyan-700 shadow-sm">{icon}</div><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-800">{value}</p></div></div>;
}
function SummaryRow({ label, value }: { label: string; value: string }) {
    return <div className="flex items-center justify-between border-b border-white/15 pb-3 last:border-0 last:pb-0"><span className="text-blue-100">{label}</span><strong>{value}</strong></div>;
}
function EmptyState({ text }: { text: string }) {
    return <p className="p-8 text-center text-sm text-slate-400">{text}</p>;
}
