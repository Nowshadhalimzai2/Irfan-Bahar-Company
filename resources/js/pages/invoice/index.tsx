import { router } from '@inertiajs/react';
import { Clock12, PercentDiamondIcon, Printer, SearchXIcon, User } from 'lucide-react';
import React from 'react'
import PageHead from '@/components/page-head';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

type Payment = { id: number, amount: number, method: string, paid_at: Date, reference: string; notes: string, currency_id: number, payment_number: string, }
type Invoice = { id: number, status: string, issued_on: Date, sold_at: Date, bill_to_name: string; invoice_number: string, total: number, discount_total: number, after_descount_total: number, payments: Payment[], total_paid_amount: number, total_due: number, return_total: number, refunded_amount: number, sale_id: number }
interface Props {
    invoice: Invoice;
}
const Index = ({ invoice }: Props) => {
    console.log('payments::: ', invoice.payments);


    return (
        <AppLayout breadcrumbs={[
            { title: 'پرداخت ها', href: '/payments' },
            { title: 'پرداخت ها', href: `/sales/invoice/${invoice.id}/payments` },
        ]}>
            <div className="p-2">
                <PageHead
                    HeadIcon={Clock12}
                    title='تاریخ پرداخت ها'
                    subtitle={` ${invoice.invoice_number} بل نمبر`}
                    description={`بل به نام ${invoice.bill_to_name ?? 'مشتری ګذری'} که فروش آن به تاریخ ${new Date(invoice.sold_at).toLocaleDateString('fa-AF')} و صدور آن ${new Date(invoice.issued_on).toLocaleDateString('fa-AF')}`}
                />
                <section dir='rtl' className='mt-3 p-3 grid grid-cols-1 gap-5'>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
                        <div className='bg-white p-4 rounded-lg flex justify-between shadow-lg font-medium '>
                            <div className='flex flex-col'>
                                <p className='text-xs text-gray-400'>جمله بل</p>
                                <h3 className='text-lg text-slate-800'>{(invoice.total ?? 0).toFixed(1)}</h3>
                            </div>
                            <User className='text-emerald-200' />
                        </div>
                        <div className='bg-white p-4 rounded-lg flex justify-between shadow-lg font-medium '>
                            <div className='flex flex-col'>
                                <p className='text-xs text-gray-400'>تخفیف</p>
                                <h3 className='text-lg text-slate-800'>{invoice.discount_total}</h3>
                            </div>
                            <PercentDiamondIcon className='text-emerald-200' />
                        </div>
                        <div className='bg-white p-4 rounded-lg flex justify-between shadow-lg font-medium '>
                            <div className='flex flex-col'>
                                <p className='text-xs text-gray-400'>پرداخت شده</p>
                                <h3 className='text-lg text-slate-800'>{invoice.total_paid_amount}</h3>
                            </div>
                            <User className='text-emerald-200' />
                        </div>
                        <div className='bg-white p-4 rounded-lg flex justify-between shadow-lg font-medium '>
                            <div className='flex flex-col'>
                                <p className='text-xs text-gray-400'>بقایه</p>
                                <h3 className='text-lg text-slate-800'>{invoice.total_due.toFixed(2)}</h3>
                            </div>
                            <User className='text-emerald-200' />
                        </div>
                    </div>
                    <div>
                        <div className='bg-white rounded-xl shadow-xl p-2'>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className='text-center'>شماره</TableHead>
                                        <TableHead className='text-center'>پرداخت نمبر</TableHead>
                                        <TableHead className='text-center'>مبلغ</TableHead>
                                        <TableHead className='text-center'>روش پرداخت</TableHead>
                                        <TableHead className='text-center'>تاریخ پرداخت</TableHead>
                                        <TableHead className='text-center'>یادداشت</TableHead>
                                        <TableHead className='text-center'>پرینت</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoice.payments.length > 0 ? invoice.payments.reverse().map((payment, ind) => <TableRow key={ind}>
                                        <TableCell className='text-center'>{ind + 1}</TableCell>
                                        <TableCell className='text-center'>{payment.payment_number ?? 'RCT-'+payment.id}</TableCell>
                                        <TableCell className='text-center'>{payment.amount}</TableCell>
                                        <TableCell className='text-center'>
                                            {payment.method ==='cash'? 'نغده':payment.method==='bank_transfer'? 'بانګ/ صراف':payment.method==='card'?'کارت':"سایر"}
                                            </TableCell>
                                        <TableCell className='text-center'>{new Date(payment.paid_at).toLocaleString('fa-AF')}</TableCell>
                                        <TableCell className='text-center w-14 text-wrap'>{payment.notes?.slice(0,25)?? '_'}</TableCell>
                                        <TableCell className='flex justify-center items-center'><Printer className='text-blue-500 size-5 hover:text-blue-400' onClick={() => router.get(`/payments/${payment.id}/receipt`)} /></TableCell>

                                    </TableRow>) : <TableRow>
                                        <TableCell colSpan={5} className='text-gray-400 py-5 text-sm text-center'>کدام پرداخت ندارد <SearchXIcon className='text-gray-400 font-medium size-10 inline' /></TableCell>
                                    </TableRow>}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </section>

            </div>

        </AppLayout>
    )
}

export default Index