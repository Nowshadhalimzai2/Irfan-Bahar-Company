import { getDariCurrency } from '@/components/location-translator';
import PageHead from '@/components/page-head';
import AppLayout from '@/layouts/app-layout';
import { Supplier } from '@/types';
import { Link, router } from '@inertiajs/react';
import { CircleDollarSign, Coins, FileText, Gift, HandCoins, Printer, Wallet, } from 'lucide-react';
import { useMemo, useState } from 'react';
type ReceiptLine = { id: number, item: string, quantity: number, unit_cost: number, subTotal: number }
type Receipt = { id: number; reference_no: string, notes: string, distination: string, total_amount: number; amount_paid: number; received_at: string; currency: string; lines: ReceiptLine[] };
interface Props {
    supplier: Supplier;
    receipts: Receipt[];
}

const money = (value: number, currency: string) => `${Number(value || 0).toFixed(2)} ${getDariCurrency(currency)}`;
const date = (value?: string) => value ? new Date(value).toLocaleDateString('fa-AF') : 'ثبت نشده';


const Show = ({ supplier, receipts }: Props) => {
    console.log(receipts);
    const accounts = useMemo(
        () => Array.from(new Set(receipts.map((receipt) => receipt.currency))),
        [receipts],
    );

    const [selectedCurrency, setSelectedCurrency] = useState<'AFG' | 'PKR' | 'USD' | string>(accounts[0] ?? 'AFG');
    const currency = getDariCurrency(receipts[0].currency ?? 'AFG');
    const [selected, setSelected] = useState<Receipt | null>(null);

    const currencySummaries = [...new Set(receipts.map((receipt) => receipt.currency).filter(Boolean))].map((summaryCurrency) => {
        const currencyReceipts = receipts.filter((receipt) => receipt.currency === summaryCurrency);
        const paid = receipts.filter(rcpt => rcpt.currency == summaryCurrency).reduce((acc, rcpt) => acc += rcpt.amount_paid, 0);


        const due = receipts.reduce((sum, receipt) => sum + Number(receipt.total_amount || 0), 0) - paid;

        return {
            currency: summaryCurrency,
            receipts: currencyReceipts.reduce((sum, receipt) =>
                sum += receipt.total_amount, 0),
            paid,
            due
        };
    });

    const currentCards = currencySummaries.filter(sum => sum.currency == selectedCurrency)[0];

    return (

        <AppLayout
            breadcrumbs={[
                { title: 'تامیین کننده ګان', href: '/stackholders' },
                { title: supplier.name, href: `/suppliers/${supplier.id}` }]}
        >
            <div className='px-1 md:px-3'>
                {supplier.has_account ? <PageHead
                    subtitle={" حساب " + supplier.name}
                    title="تامیین کننده"
                    description="بیشتر معلومات تامیین کننده و اجناس که امده به شرکت"
                    HeadIcon={Gift}
                    tone={'yellow'}
                    ActionIcon={Coins}
                    actionTitle='پرداخت پول'
                    actionURL="#"
                // menuItems={[{ name: supplier.status ? 'بلاک نمودن' : 'فعال نمودن', url: `/suppliers/status/${supplier.id}` }]}
                /> :
                    <PageHead
                        subtitle={" حساب " + supplier.name}
                        title="تامیین کننده"
                        description="بیشتر معلومات تامیین کننده و اجناس که امده به شرکت"
                        HeadIcon={Gift}
                        // menuItems={[{ name: supplier.status ? 'بلاک نمودن' : 'فعال نمودن', url: `/suppliers/status/${supplier.id}` }]}
                        tone={'yellow'}
                    />

                }

                <div dir="rtl" className="min-h-screen space-y-6 bg-[#f6f9fc] p-3 pb-10 md:p-6">

                    <div className=''>
                        <select className='w-full bg-white shadow p-2 rounded-md' onChange={(e) => setSelectedCurrency(e.target.value as 'AFG' | 'PKR' | 'USD' | string)}>
                            {accounts.map(account => <option value={account} key={account}>{getDariCurrency(account)}</option>)}
                        </select>
                    </div>

                    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div key={currentCards.currency} className="contents">
                            <StatCard title={`مجموع خرید (${getDariCurrency(currentCards.currency)})`} value={money(currentCards.receipts, currentCards.currency)} icon={<CircleDollarSign />} tone="blue" />
                            <StatCard title={`وصول شده (${getDariCurrency(currentCards.currency)})`} value={money(currentCards.paid, currentCards.currency)} icon={<HandCoins />} tone="emerald" />
                            <StatCard title={`باقی‌ مانده (${getDariCurrency(currentCards.currency)})`} value={money(Math.max(currentCards.due, 0), currentCards.currency)} icon={<Wallet />} tone="amber" />
                        </div>
                        {/* <StatCard title="تعداد فروش" value={`${sales.length} فروش`} icon={<Receipt />} tone="violet" /> */}
                    </section>
                    {/* HISTORY OF RECEIPTS */}
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
                        <section className="min-w-0 rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-100 p-5">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">تاریخچه فروشات</h2>
                                    <p className="mt-1 text-sm text-slate-500">تمام معاملات ثبت‌شده این مشتری</p>
                                </div>
                                <FileText className="text-cyan-600" /></div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-162.5 text-right text-sm">
                                    <thead className="bg-slate-50 text-xs text-slate-500">
                                        <tr>
                                            <th className="px-5 py-3 font-medium">انوایس</th>
                                            <th className="py-3 font-medium">تاریخ</th>
                                            <th className="py-3 font-medium">مبلغ</th>
                                            <th className="py-3 font-medium">پرداخت</th>
                                            <th className="py-3 font-medium">دربافت پرداخت</th>
                                        </tr>
                                    </thead>
                                    <tbody>{receipts.reverse().map((receipt) => {
                                        const invoicePaid = Number(receipt.amount_paid || 0);

                                        return <tr  key={receipt.id} onDoubleClick={()=>router.get('/receipts/'+receipt.id)} className="border-t border-slate-100 transition hover:bg-slate-50">
                                            <td className="px-5 py-4 font-semibold text-cyan-700">{receipt.reference_no ?? `خرید #${receipt.id}`}</td>
                                            <td className="py-4 text-slate-500">{date(receipt.received_at)}</td>
                                            <td className="py-4 font-semibold">{money(Number(receipt.total_amount), currency)}</td>
                                            <td className="py-4 text-emerald-700">{money(invoicePaid, currency)}</td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            receipt.total_amount === receipt.amount_paid
                                                        }
                                                        onClick={() => {

                                                            setSelected(receipts.filter(rcpt => rcpt.id == receipt.id)[0])
                                                        }
                                                        }
                                                        className="text-xs font-semibold text-primary disabled:text-slate-300"
                                                    >
                                                        ثبت دریافت
                                                    </button>
                                                    <Link
                                                        href={`/receipts/${receipt.id}/invoice/print`}
                                                        title="چاپ فاکتور"
                                                        className="text-slate-400 hover:text-primary"
                                                    >
                                                        <Printer className="size-4" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>;
                                    })}</tbody></table>{!receipts.length && <EmptyState text="هنوز هیچ فروشی برای این مشتری ثبت نشده است." />}</div></section>
                        {/* <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 p-5">
                                <h2 className="text-xl font-bold text-slate-800">پرداخت‌های اخیر</h2>
                                <p className="mt-1 text-sm text-slate-500">آخرین دریافت‌های ثبت‌شده</p>
                            </div>
                            <div className="divide-y divide-slate-100">{lines.slice(0, 5).map((line) =>
                                <div key={line.id} className="flex items-start gap-3 p-4">
                                    <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600"><Banknote size={19} /></div>
                                    <div className="min-w-0 flex-1"><div className="flex justify-between gap-3">
                                        <p className="font-semibold text-slate-800">{money(Number(line.amount), line.invoice.currency)}</p><span className="text-xs text-slate-400">{date(line.paidAt)}</span>
                                    </div>
                                        <p className="mt-1 text-xs text-slate-500">{methodLabels[line.method] || line.method} · {line.invoice.invoice_number}</p>
                                    </div>
                                </div>)}
                                {!lines.length && <EmptyState text="هنوز هیچ پرداختی ثبت نشده است." />}</div>
                        </section> */}
                    </div>
                    {/* history of receipts */}
                </div>
            </div>
        </AppLayout>
    )
}


function StatCard({ title, value, icon, tone }: { title: string; value: string; icon: React.ReactNode; tone: 'blue' | 'emerald' | 'amber' | 'violet' }) {
    const tones = { blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', violet: 'bg-violet-50 text-violet-600' };

    return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`mb-4 flex size-11 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</div><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-lg font-bold text-slate-800">{value}</p></div>;
}

function EmptyState({ text }: { text: string }) {
    return <p className="p-8 text-center text-sm text-slate-400">{text}</p>;
}

function Status({ status }: { status: string }) {
    const labels: Record<string, string> = { paid: 'تسویه شده', partially_paid: 'پرداخت ناقص', completed: 'تکمیل شده', cancelled: 'لغو شده', issued: 'صادر شده', draft: 'پیش‌نویس' }; const positive = ['paid', 'completed'].includes(status);

    return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${positive ? 'bg-emerald-50 text-emerald-700' : status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{labels[status] || status}</span>;
}

export default Show