import { Head, router, usePage } from '@inertiajs/react';
import { ArrowRight, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { getDariCurrency, getDariItemUnit } from '@/components/location-translator';

type SaleLine = { name: string; unit: string; quantity: number; unitPrice: number; total: number };
type InvoicePageProps = {
    sale: { id: number; customer: string; phone?: string; address?: string; soldAt: Date; lines: SaleLine[], amount_paid: number };
    invoice: {
        number: string; issuedOn: Date;
        status: 'paid' | 'partially_paid' | 'refunded' | 'partially_refunded';
        currency: string; subtotal: number; discount: number; total: number; notes?: string
    };
};

const formatMoney = (value: number, currency: string) => `${value.toString()} ${getDariCurrency(currency)}`;

export default function Invoice({ sale, invoice }: InvoicePageProps) {

    const statusStyle = (status: 'paid' | 'partially_paid' | 'refunded' | 'partially_refunded') => {
        switch (status) {
            case 'paid':
                return 'bg-emerald-50 text-emerald-700';
            case 'partially_paid':
                return 'bg-yellow-50 text-yellow-700';
            case 'refunded':
                return 'bg-red-50 text-red-700';
            case 'partially_refunded':
                return 'bg-sky-50 text-sky-700';

            default:
                return 'bg-cyan-50 text-cyan-700';
        }
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'فروشات', href: '/sales' }, { title: `بل${invoice.number}`, href: `/sales/${sale.id}/invoice/print` }]}>
            <Head title={`بل${invoice.number}`} />
            <div dir="rtl" className="min-h-full bg-slate-100 px-2 py-6 dark:bg-slate-950 print:bg-white print:p-0">
                <div className="mx-auto max-w-3xl space-y-4 print:max-w-none">
                    {/* ================================= buttons ===========================*/}
                    <div className="flex items-center justify-between print:hidden">
                        <Button variant="ghost" onClick={() => router.visit('/sales')}><ArrowRight className="size-4" /> برگشت به فروشات</Button>
                        <Button onClick={() => window.print()}><Printer className="size-4" /> چاپ بل</Button>
                    </div>

                    <article id="printArea" className="overflow-hidden rounded-2xl bg-white shadow-xl print:rounded-none print:shadow-none">
                        <header className="relative overflow-hidden bg-[#092b4c] px-8 py-8 text-white"><div className="absolute -left-12 -top-16 h-48 w-48 rounded-full border-24 border-cyan-300/10" /><div className="relative flex items-start justify-between gap-6"><div><p className="text-sm font-medium text-cyan-200">بلفروش</p><h1 className="mt-2 text-3xl font-bold">عرفان بهار</h1><p className="mt-2 text-sm text-blue-100">مدیریت فروش و موجودی</p></div><div className="text-left"><p className="text-xs text-blue-200">شماره بل</p><p className="mt-1 text-xl font-bold tracking-wide">{invoice.number}</p><p className="mt-2 text-xs text-blue-200">تاریخ صدور: {new Date(invoice.issuedOn).toLocaleDateString('fa-IR')}</p></div></div></header>
                        <div className="grid gap-4 border-b border-slate-200 px-8 py-6 sm:grid-cols-2"><div><p className="text-xs text-slate-400">صورتحساب برای</p><p className="mt-1 font-bold text-slate-800">{sale.customer}</p>{sale.phone && <p className="mt-1 text-sm text-slate-500">{sale.phone}</p>}{sale.address && <p className="mt-1 text-sm text-slate-500">{sale.address}</p>}</div><div className="sm:text-left"><p className="text-xs text-slate-400">زمان فروش</p><p className="mt-1 font-medium text-slate-700">{new Date(sale.soldAt).toLocaleDateString('fa-IR')}</p><p className="mt-2 text-xs text-slate-400">وضعیت</p><span className={`${statusStyle(invoice.status)} mt-1 inline-flex rounded-full  px-3 py-1 text-xs font-semibold`}>{invoice.status === 'paid' ? 'پرداخت شده' : invoice.status === 'partially_paid' ? 'پرداخت جزئی' : invoice.status === 'refunded' ? 'بازګشت شد' : invoice.status === 'partially_refunded' ? 'باز ګشت شده جزیی' : 'صادر شده'}</span></div></div>
                        <div className="px-8 py-6 relative">
                            <table className="w-full text-right text-sm">
                                <thead className="border-b-2 border-slate-200 text-xs text-slate-400">
                                    <tr>
                                        <th className="pb-3 font-medium">شرح جنس</th>

                                        <th className="pb-3 text-center font-medium">تعداد</th>
                                        <th className="pb-3 text-left font-medium">قیمت واحد</th>
                                        <th className="pb-3 text-left font-medium">مجموع</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sale.lines.map((line, index) =>
                                        <tr key={`${line.name}-${index}`} className="border-b border-slate-100">
                                            <td className="py-4 font-medium text-slate-800">{line.name}</td>
                                            <td className="py-4 text-center text-slate-600">{line.quantity} {getDariItemUnit(line.unit)}</td>
                                            <td className="py-4 text-left text-slate-600">{formatMoney(line.unitPrice, invoice.currency)}</td>
                                            <td className="py-4 text-left font-semibold text-slate-800">{formatMoney(line.total, invoice.currency)}</td>
                                        </tr>)}
                                </tbody>
                            </table>
                            <div className="mt-6 flex justify-end">
                                <div className="w-full max-w-xs space-y-3 text-sm">
                                    <div className="flex justify-between text-slate-500">
                                        <span>جمله پول </span>
                                        <span>{formatMoney(invoice.subtotal, invoice.currency)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>تخفیف</span><span>{formatMoney(invoice.discount, invoice.currency)}</span>
                                    </div>
                                    <div className="flex justify-between border-t-2 border-slate-200 pt-3 text-lg font-bold text-[#092b4c]">
                                        <span>قابل پرداخت</span><span>{formatMoney(invoice.total, invoice.currency)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>پرداخت شده</span><span>{formatMoney(sale.amount_paid, invoice.currency)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>بقایه در بل</span><span>{(invoice.total - sale.amount_paid).toFixed(2)} {getDariCurrency(invoice.currency)}</span>
                                    </div>
                                </div>

                            </div>{invoice.notes && <div className="mt-8 rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><b>یادداشت:
                            </b> {invoice.notes}</div>}
                            <h2 className="absolute z-10 top-0 left-50 text-6xl opacity-10 -rotate-45 font-bold text-primary">
                                <img className='h-100 w-80' src={usePage().props.logo as string} alt="شرکت عرفان بهار" />
                            </h2>
                        </div>
                        <footer className="border-t border-slate-200 px-8 py-5 text-center text-xs text-slate-400">از خرید شما سپاسگزاریم · این بلبر اساس اطلاعات ثبت‌شده در سیستم صادر شده است.</footer>
                    </article>
                </div>
            </div>
        </AppLayout>);
}
