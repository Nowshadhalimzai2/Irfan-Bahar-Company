import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { getDariCurrency, getDariItemUnit } from '@/components/location-translator';
import Bill from '@/components/bill/bill';
import Header from '@/components/bill/header';
import Footer from '@/components/bill/footer';
import Overview from '@/components/bill/overveiw';
import Content from '@/components/bill/content';

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
            <div dir="rtl" className="bg-slate-100 px-2 py-6 dark:bg-slate-950 print:bg-white print:p-0">
                <div className="mx-auto max-w-3xl space-y-4 print:max-w-none">
                    {/* ================================= buttons ===========================*/}
                    <div className="flex items-center justify-end">
                        <Button variant="ghost" onClick={() => router.visit('/sales')}>
                            برگشت به فروشات
                            <ArrowLeft className="size-4" />
                        </Button>
                    </div>

                    <Bill className="">
                        <Header
                            logo={usePage().props.logo as string}
                            key={'header'}

                        />

                        <Overview>
                            <div className='grow '>
                                <div className='flex justify-between items-center px-2'>
                                    <div>
                                        <p className="text-center text-xs text-slate-400">صورتحساب برای</p>
                                        <p className="text-center mt-1 font-bold text-slate-800">{sale.customer}</p>
                                    </div>
                                    <div>
                                        {sale.phone && <p className="mt-1 text-sm text-center text-slate-500">{sale.phone}</p>}
                                        {sale.address && <p className="mt-1 text-sm text-center text-slate-500">{sale.address}</p>}
                                    </div>
                                    <div className="sm:text-left">
                                        <p className="text-center text-xs text-slate-400">زمان فروش</p>
                                        <p className="mt-1 text-center font-medium text-slate-700">{new Date(sale.soldAt).toLocaleDateString('fa-IR')}</p>
                                    </div>
                                    <div>
                                        <p className="mt-1 text-xs text-slate-400 text-center">وضعیت</p>
                                        <span className={`${statusStyle(invoice.status)} text-center mt-1 inline-flex rounded-full  px-3 py-1 text-xs font-semibold`}>{invoice.status === 'paid' ? 'پرداخت شده' : invoice.status === 'partially_paid' ? 'پرداخت جزئی' : invoice.status === 'refunded' ? 'بازګشت شد' : invoice.status === 'partially_refunded' ? 'باز ګشت شده جزیی' : 'صادر شده'}</span>
                                    </div>
                                </div>
                                <div className="flex px-2 justify-between mt-1 items-center gap-x-2">
                                    <div>
                                        <p className='text-start text-xs font-normal text-gray-400'>بل نمبر</p>
                                        <p className='text-center '>{invoice.number}</p>
                                    </div>
                                    <div>
                                        <p className='text-xs text-center font-normal text-gray-400'>تاریخ صدور</p>
                                        <p className=' text-center text-gray-600'>{new Date(invoice.issuedOn).toLocaleDateString('fa-AF')}</p>
                                    </div>

                                </div>
                            </div>
                        </Overview>
                        <Content className='h-145!' status={(invoice.status == 'refunded' || invoice.status == 'partially_refunded') ? 'cancelled' : 'pending'} title='بل بازګشت شده'>

                            <div className="px-8 pb-3 relative">
                                <table className="w-full text-right text-sm">
                                    <thead className="border-b-2 border-slate-200 text-xs text-slate-400">
                                        <tr>
                                            <th className="pb-3 font-medium">شماره</th>
                                            <th className="pb-3 font-medium">شرح جنس</th>
                                            <th className="pb-3 text-center font-medium">تعداد</th>
                                            <th className="pb-3 text-left font-medium">قیمت واحد</th>
                                            <th className="pb-3 text-left font-medium">مجموع</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sale.lines.map((line, index) =>
                                            <tr key={`${line.name}-${index}`} className="border-b border-slate-100">
                                                <td className="py-1.5 font-medium text-slate-800">{index + 1}</td>
                                                <td className="py-1.5 font-medium text-slate-800">{line.name}</td>
                                                <td className="py-1.5 text-center text-slate-600">{line.quantity} {getDariItemUnit(line.unit)}</td>
                                                <td className="py-1.5 text-left text-slate-600">{formatMoney(line.unitPrice, invoice.currency)}</td>
                                                <td className="py-1.5 text-left font-semibold text-slate-800">{formatMoney(line.total, invoice.currency)}</td>
                                            </tr>)}

                                       
                                    </tbody>
                                </table>
                                <div className="mt-3 pt-3 border-t-2 border-slate-200">
                                    <div className="w-full flex justify-between space-y-3 text-sm">
                                        <div className="flex items-center flex-col text-slate-500">
                                            <span>جمله پول </span>
                                            <span>{formatMoney(invoice.subtotal, invoice.currency)}</span>
                                        </div>
                                        <div className="flex items-center  flex-col text-slate-500">
                                            <span>تخفیف</span>
                                            <span>{formatMoney(invoice.discount, invoice.currency)}</span>
                                        </div>
                                        <div className="flex items-start justify-center flex-col  text-lg  font-semibold text-[#092b4c]">
                                            <span>قابل پرداخت</span>
                                            <span>{formatMoney(invoice.total, invoice.currency)}</span>
                                        </div>
                                        <div className="flex items-center  flex-col text-slate-500">
                                            <span>پرداخت شده</span>
                                            <span>{formatMoney(sale.amount_paid, invoice.currency)}</span>
                                        </div>
                                        <div className="flex items-center  flex-col text-slate-500">
                                            <span>بقایه در بل</span>
                                            <span>{(invoice.total - sale.amount_paid).toFixed(2)} {getDariCurrency(invoice.currency)}</span>
                                        </div>
                                    </div>

                                </div>{invoice.notes && <div className="mt-8 rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><b>یادداشت:
                                </b> {invoice.notes}</div>}

                            </div>
                        </Content>
                        {/* <footer className="border-t border-slate-200 px-8 py-5 text-center text-xs text-slate-400">از خرید شما سپاسگزاریم · این بلبر اساس اطلاعات ثبت‌شده در سیستم صادر شده است.</footer> */}
                        <Footer />
                    </Bill>
                </div>
            </div>
        </AppLayout>);
}
