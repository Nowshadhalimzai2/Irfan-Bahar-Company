import { SectionTitle } from '@/components/section-title';
import AppLayout from '@/layouts/app-layout';
import { ProductionOrder } from '@/types';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { router } from '@inertiajs/core';
import { getDariCategory, getDariOrderStatus, getStatusColor } from '@/components/location-translator';
import orders from '@/routes/orders';
import { Button } from '@/components/ui/button';

interface Props {
    production_orders: ProductionOrder[];
}
const Index = ({ production_orders }: Props) => {
    console.log(production_orders);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'لیست سفارشات', href: '/factory/production_orders' },
            ]}
        >
            <div>
                <section className='section'>
                    <div>
                        <SectionTitle title='لیست سفارشات' description='تمام سفارشات ګرفته از مشتری ها اینجا دید میتانی' />
                        <section>
                            <div className="max-w-4xl mx-auto px-8">
                                <Table>
                                    <TableCaption>(<span>{production_orders.length}</span>)  <span>سفارشات که باید انجام شود</span> </TableCaption>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-20 text-center">شماره</TableHead>
                                            <TableHead className="text-center">سفارش کننده</TableHead>
                                            <TableHead className="text-center">جنس</TableHead>
                                            <TableHead className="text-center">حالت سفارش</TableHead>
                                            <TableHead className="text-center">تاریخ سفارش</TableHead>
                                            <TableHead className="text-center">تغیر حالت</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {production_orders.length > 0 ? production_orders.map((order, ind) => (
                                            <TableRow key={order.id} onClick={() => router.get('/factory/production-orders/' + order.id)}>
                                                <TableCell className="text-center">{ind + 1}</TableCell>
                                                <TableCell className="text-center">{order.ordered_by}</TableCell>
                                                <TableCell className="text-center">{getDariCategory(order.bom.category.name)}</TableCell>
                                                <TableCell className={`text-center ${getStatusColor(order.status)}`}>{getDariOrderStatus(order.status)}</TableCell>
                                                <TableCell className="text-center">{new Date(order.order_date).toDateString()}</TableCell>
                                                <TableCell className="text-center p-0">
                                                    <button className='bg-emerald-900 text-secondary w-full py-2'>جریان</button>
                                                </TableCell>
                                            </TableRow>
                                        )) : <TableRow>
                                            <TableCell colSpan={6} className="text-center text-gray-500 text-sm p-5"> سفارش موجود نیست</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </div>
                        </section>
                    </div>
                </section>
            </div>
        </AppLayout>
    )
}

export default Index