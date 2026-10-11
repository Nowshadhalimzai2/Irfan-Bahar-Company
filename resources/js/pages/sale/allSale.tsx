import { getDariCurrency } from '@/components/location-translator';
import PageHead from '@/components/page-head';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import invoice from '@/routes/sales/invoice';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, CircleDollarSign, FileText, RotateCcw, Search, ShoppingBag, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
type Order = { invoice_id: number, isCancelable: boolean; saleId: number; id: string; hasInvoice: boolean; customer: string; date: string; amount: number; status: string, currency: 'AFG' | 'PKR' | 'USD' };
interface Props {
    orders: Order[];
}
const allSale = ({ orders }: Props) => {
    const statusLabels: Record<string, string> = { completed: 'تکمیل شده', draft: 'پیش‌نویس', cancelled: 'لغو شده', partially_returned: 'بازگشت جزئی', returned: 'بازگشت شده' };
    const statusClasses: Record<string, string> = { completed: 'bg-emerald-50 text-emerald-700', draft: 'bg-amber-50 text-amber-700', cancelled: 'bg-rose-50 text-rose-700', partially_returned: 'bg-orange-50 text-orange-700', returned: 'bg-slate-100 text-slate-700' };
    const [query, setQuery] = useState('');
    const filtered = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return orders.filter((order) => {

            const matchesQuery = `${order.id} ${order.customer}`
                .toLowerCase()
                .includes(normalizedQuery);
            return matchesQuery;
        });
    }, [query]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'فروشات', href: '/sales' },
                { title: 'همه فروشات', href: '/sales/all' }

            ]}
        >

            <div dir='rtl' className="grid grid-cols-1 gap-5 mt-2 px-1 md:px-3 pb-5">
                <PageHead
                    HeadIcon={ShoppingBag}
                    subtitle='فروشات '
                    title='لیست فروشات'
                    description='لیست همه فروشات تکمیل شده'
                />

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {/* <KpiCard
                        title="درآمد خالص"
                        value={orders.length.toString()}
                        unit={'AFG'}
                        detail="در مقایسه با ماه قبل"
                        icon={CircleDollarSign}
                        tone="blue"
                    /> */}
                    <KpiCard
                        title="تعداد سفارش‌ها"
                        value={orders.length.toString()}
                        unit="سفارش"
                        detail=""
                        icon={ShoppingBag}
                        tone="green"
                    />

                    {/* <KpiCard
                        title="مشتریان فعال"
                        value={customers.toString()}
                        unit="نفر"
                        detail="مشتری ثبت‌شده این ماه"
                        icon={Users}
                        tone="violet"
                    /> */}


                </section>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
                    <div className="relative w-full lg:w-80">
                        <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
                        <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 border-slate-200 bg-slate-50 pr-10" placeholder="جستجوی شماره یا مشتری..." />
                    </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                آخرین سفارش‌ها
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                آخرین فعالیت‌های ثبت‌شده در فروش
                            </p>
                        </div>
                        <Link
                            href={'/sales'}

                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"
                        >
                            {/* <Ellipsis className="h-5 w-5" /> */}
                            <ArrowLeft className="h-4 w-5" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-140 text-right text-sm">
                            <thead className="border-b border-slate-100 text-xs text-slate-400 dark:border-slate-800">
                                <tr>
                                    <th className="pb-3 font-medium">
                                        شماره سفارش
                                    </th>
                                    <th className="pb-3 font-medium">
                                        مشتری
                                    </th>
                                    <th className="pb-3 font-medium">
                                        زمان
                                    </th>
                                    <th className="pb-3 font-medium">
                                        مبلغ
                                    </th>
                                    <th className="pb-3 font-medium">
                                        وضعیت
                                    </th>
                                    <th className="pb-3 font-medium">بل</th>
                                    <th className="pb-3 font-medium">لغو</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="border-b border-slate-50 last:border-0 dark:border-slate-800/70"
                                    >
                                        <td className="px-5 py-4" >
                                            <b className="text-primary hover:cursor-pointer hover:underline" title='تاریخ پرداخت ها را بل بیبنین' onClick={() => order.id.startsWith('INV') && router.get(`/sales/invoice/${order.invoice_id}/payments`)}>
                                                {order.id}
                                            </b>
                                            {/* <small className="mt-1 block text-xs text-slate-400">{new Date(invoice.issued_on).toLocaleDateString('fa-AF')}</small> */}
                                        </td>

                                        <td className="py-3 font-medium text-slate-700 dark:text-slate-200">
                                            {order.customer}
                                        </td>
                                        <td className="py-3 text-xs text-slate-400">
                                            {order.date}
                                        </td>
                                        <td className="py-3 font-semibold text-slate-700 dark:text-slate-200">
                                            {order.amount} {getDariCurrency(order.currency)}
                                        </td>
                                        <td className="py-3">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClasses[order.status] ?? 'bg-slate-100 text-slate-700'}`}
                                            >
                                                {statusLabels[order.status] ?? order.status}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-3">
                                                {order.hasInvoice ? (
                                                    <button type="button" onClick={() => router.get(`/sales/${order.saleId}/invoice/print`)} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                                                        <FileText className="size-3.5" /> چاپ
                                                    </button>
                                                ) : (
                                                    <button type="button" onClick={() => router.post(`/sales/${order.saleId}/invoice`)} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-primary">
                                                        <FileText className="size-3.5" /> ایجاد
                                                    </button>
                                                )}
                                                {order.status !== 'cancelled' && (order.hasInvoice ? <button disabled={order.status == 'returned'} type="button" onClick={() => router.visit(`/sales/${order.saleId}/returns/create`)} className={`inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 ${order.status == 'returned' && 'text-gray-400 hover:text-gray-400'}`}>
                                                    <RotateCcw className="size-3.5" /> برگشت

                                                </button>
                                                    : <p className='text-xs text-gray-400 '>بل ندارد</p>
                                                )}
                                            </div>
                                        </td>

                                        {order.isCancelable && <td className="py-3 text-red-200 hover:text-red-400" dir='ltr'>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <button>لغو کنین</button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogTitle className='text-end mt-4'>ایا مطمین هستین که این فروش را لغو کنید؟</DialogTitle>
                                                    <DialogDescription className='text-end'>هشدار: لغو نمودن این فروش بازګشت نمی شه. لطفا احتیاط نماید</DialogDescription>
                                                    <div className="flex justify-between space-x-3 items-center">
                                                        <DialogClose className='w-full'>
                                                            <Button className='w-full' variant={'destructive'}>نخیر، </Button>
                                                        </DialogClose>
                                                        <Button className='w-full' onClick={() => router.put(`/sales/${order.saleId}/cancel`)}>فروش را لغو کنید</Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}


function KpiCard({
    title,
    value,
    unit,
    detail,
    icon: Icon,
    tone,
}: {
    title: string;
    value: string;
    unit: string;
    detail: string;
    icon: typeof CircleDollarSign;
    tone: 'blue' | 'green' | 'amber' | 'violet';
}) {
    const tones = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        violet: 'bg-violet-50 text-violet-600',
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-slate-500">
                        {title}
                    </p>
                    <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">
                            {value}
                        </span>
                        <span className="text-[11px] text-slate-400">
                            {unit}
                        </span>
                    </div>
                </div>
                <div className={`rounded-xl p-2.5 ${tones[tone]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">

                <span className="text-slate-400">{detail}</span>
            </div>
        </div>
    );
}

export default allSale