import { Link, router } from '@inertiajs/react';
import { File, HandCoins, Printer, ReceiptText, Search, ShoppingCart, Wallet } from 'lucide-react';
import { useState  } from 'react';
import type {ReactNode} from 'react';
import { getDariCurrency } from '@/components/location-translator';
import PageHead from '@/components/page-head';
import PaymentDialog from '@/components/sale/payment-dialog';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

type Payment = { id: number; amount: number; method: string; reference?: string; paidAt: string, notes?: string; number: string; currency: { id: number; name: string; } };

type Invoice = {
    id: number;
    invoice_number: string;
    customer: string;
    currency: string;
    total: number;
    paid: number;
    due: number;
    status: string;
    issued_on: Date;
    saleId: number;
};
type CustomerSale = { id: number; status: string; subTotal: number; grandTotal: number; returnTotal: number, refundTotal: number; sold_at: string; currency: { name: string }; payments?: Payment[], sale_returns: { id: number; total: number; refund_amount: number }[], invoice: Invoice };

interface Props {
    customer: { id: number, name: string, joined: Date; }
    orders: CustomerSale[];
}
const Invoice = ({ customer, orders }: Props) => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selected, setSelected] = useState<Invoice | null>(null);
    const filteredOrders = orders.filter(order => order.invoice.invoice_number.toLowerCase().includes(searchTerm.trim().toLowerCase()));
    const activeOrders = orders.filter(order => order.status !== 'cancelled');
    const billedByCurrency = sumByCurrency(activeOrders, order => order.invoice.total);
    const paidByCurrency = sumByCurrency(activeOrders, order => Number(order.invoice.paid));
    const dueByCurrency = sumByCurrency(activeOrders, order => Math.max(0, Number(order.invoice.due)));

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'مشتریان', href: '/stackholders' },
                { title: customer.name, href: `/customers/${customer.id}` },
                { title: 'کل فکتور ها', href: `/customers/${customer.id}/invoices` },
            ]}
        >
            <main className='px-1 md:px-3 py-2'>
                <PageHead
                    HeadIcon={File}
                    subtitle={` فاکتور ها ${customer.name}`}
                    title={'فاکتور ها'}
                    description={` کل فکتورها ${customer.name} از تاریخ ${new Date(customer.joined).toLocaleDateString('fa-AF')}  تا  ${new Date().toLocaleDateString('fa-AF')} `}

                />
                <div className="mx-auto w-full max-w-6xl">
                    <div className='mt-6 grid w-full grid-cols-1 gap-5' dir='rtl'>
                        <section aria-label="خلاصه فاکتورها" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <QuickStat title="تعداد فاکتورها" icon={<ReceiptText className="size-5" />} tone="blue" value={`${orders.length} فاکتور`} />
                            <QuickStat title="مجموع مبلغ خالص" icon={<File className="size-5" />} tone="cyan" value={billedByCurrency} />
                            <QuickStat title="دریافت‌شده" icon={<HandCoins className="size-5" />} tone="emerald" value={paidByCurrency} />
                            <QuickStat title="باقی‌مانده قابل پرداخت" icon={<Wallet className="size-5" />} tone="amber" value={dueByCurrency} />
                        </section>

                        <section className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-800">فهرست فاکتورها</h2>
                                <p className="mt-1 text-sm text-slate-500">{filteredOrders.length} از {orders.length} فاکتور</p>
                            </div>
                            <div className="relative w-full overflow-hidden rounded-md border border-slate-200 bg-white sm:max-w-sm">
                                <Input className='h-10 pr-9 shadow-none' placeholder='جستجوی شماره فاکتور' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                <Search className='absolute right-3 top-3 size-4 text-slate-400' />
                            </div>
                        </section>

                        <section className='w-full'>
                            <div className='overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm'>
                                <div className="overflow-x-auto">
                                <table className='w-full min-w-[850px] text-sm'>
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className='px-5 py-3 text-start text-xs font-semibold text-slate-500'>انوایس نمبر</th>
                                            <th className='py-3 text-center text-xs font-semibold text-slate-500'>مبلغ</th>
                                            <th className='py-3 text-center text-xs font-semibold text-slate-500'>برگشت</th>
                                            <th className='py-3 text-center text-xs font-semibold text-slate-500'>پرداخت</th>
                                            <th className='py-3 text-center text-xs font-semibold text-slate-500'>باقی مانده</th>
                                            <th className='py-3 text-center text-xs font-semibold text-slate-500'>وضعیت</th>
                                            <th className='py-3 text-center text-xs font-semibold text-slate-500'>دریافت پرداخت</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.length === 0 ? <tr><td colSpan={7} className='py-12 text-center text-slate-400'><ShoppingCart className='mb-2 inline size-8 text-slate-300' /><span className="block">فروشاتی وجود ندارد</span></td></tr> :
                                            filteredOrders.map(order =>
                                                <tr key={order.id} className='border-t border-slate-100 text-sm transition-colors hover:bg-slate-50/70'>
                                                    <td className="px-5 py-4"><b className="cursor-pointer text-primary hover:underline" title='تاریخ پرداخت ها را ببینید' onClick={() => router.get(`/sales/invoice/${order.invoice.id}/payments`)}>{order.invoice.invoice_number}</b><small className="mt-1 block text-xs text-slate-400">{new Date(order.invoice.issued_on).toLocaleDateString('fa-AF')}</small></td>
                                                    <td className='text-center font-medium'>{order.invoice.total} {getDariCurrency(order.currency.name)}</td>
                                                    <td className='text-center text-rose-600'>{order.returnTotal}</td>
                                                    <td className='text-center '>{order.invoice.paid}</td>
                                                    <td className='text-center font-medium text-amber-700'>{(order.invoice.due).toFixed(2)}</td>
                                                    <td className="py-4 text-center"><Status status={order.status === 'cancelled' ? order.status : (order.invoice?.status || order.status)} /></td>
                                                    <td className='py-4'>
                                                        <div className="flex items-center justify-center gap-3">
                                                            <button
                                                                type="button"
                                                                disabled={order.status === 'cancelled' || order.invoice.status === 'paid'}
                                                                onClick={() => setSelected(order.invoice ?? null)}
                                                                className="text-xs font-semibold text-primary disabled:text-slate-300"
                                                            >
                                                                ثبت دریافت
                                                            </button>
                                                            <Link
                                                                href={`/sales/${order.id}/invoice/print`}
                                                                title="چاپ فاکتور"
                                                                className="text-slate-400 hover:text-primary"
                                                            >
                                                                <Printer className="size-4" />
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {selected && (
                <PaymentDialog
                    invoice={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </AppLayout>
    )
}

function sumByCurrency(orders: CustomerSale[], amountForOrder: (order: CustomerSale) => number) {
    const totals = new Map<string, number>();
    orders.forEach(order => {
        const currency = order.currency?.name || '---';
        totals.set(currency, (totals.get(currency) || 0) + amountForOrder(order));
    });

    return Array.from(totals, ([currency, amount]) => ({ currency, amount }));
}

function QuickStat({ title, icon, tone, value }: { title: string; icon: ReactNode; tone: 'blue' | 'cyan' | 'emerald' | 'amber'; value: string | { currency: string; amount: number }[] }) {
    const tones = {
        blue: 'bg-blue-50 text-blue-700',
        cyan: 'bg-cyan-50 text-cyan-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        amber: 'bg-amber-50 text-amber-700',
    };

    return (
        <div className="min-h-32 border-y border-slate-200 bg-white px-4 py-4 sm:border-x">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm text-slate-500">{title}</p>
                    {typeof value === 'string' ? (
                        <p className="mt-3 text-xl font-bold text-slate-800">{value}</p>
                    ) : value.length ? (
                        <div className="mt-2 space-y-1">
                            {value.map(item => <p key={item.currency} className="text-sm font-bold text-slate-800">{item.amount} <span className="font-medium text-slate-500">{item.currency}</span></p>)}
                        </div>
                    ) : <p className="mt-3 text-sm font-semibold text-slate-400">ثبت نشده</p>}
                </div>
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-md ${tones[tone]}`}>{icon}</div>
            </div>
        </div>
    );
}

function Status({ status }: { status: string }) {
    const labels: Record<string, string> = { paid: 'تسویه شده', partially_paid: 'پرداخت ناقص', completed: 'تکمیل شده', cancelled: 'لغو شده', issued: 'صادر شده', draft: 'پیش‌نویس', returned: 'برګشت شده', partially_returned: 'برګشت جزیی', refunded: 'باز پرداخت', partially_refunded: 'باز پرداخت جزیی', };
    const positive = ['paid', 'completed'].includes(status);

    return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${positive ? 'bg-emerald-50 text-emerald-700' : status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{labels[status] || status}</span>;
}
export default Invoice