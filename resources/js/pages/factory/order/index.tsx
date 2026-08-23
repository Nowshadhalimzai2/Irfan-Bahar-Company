import { SectionTitle } from '@/components/section-title';
import AppLayout from '@/layouts/app-layout';
import { ProductionOrder, StatusType } from '@/types';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { router } from '@inertiajs/core';
import { getDariCategory, getDariOrderStatus, getStatusColor } from '@/components/location-translator';
import { buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Recycle } from 'lucide-react';
import { CustomeDropDownMenu } from '@/components/customer-dropdwon';
import { statusController } from '@/components/status-controller';

interface Props {
    production_orders: ProductionOrder[];
}

const Index = ({ production_orders }: Props) => {

    const handleOrderStatus = (orderID: number, status: StatusType) => {
        router.put(`/factory/production-orders/${orderID}/change-status/${status}`);
    }

    const options = [
        { name: 'سفارشات آشغال ', url: '/factory/production-orders/junks' }
    ]
    let OrderStatus = [];
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'لیست سفارشات', href: '/factory/production_orders' },
            ]}
        >
            <div>
                <div className='flex justify-end items-end p-5'>
                    <CustomeDropDownMenu items={options} />
                </div>
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
                                            <TableRow aria-disabled={order.status === 'cancelled'} key={order.id} onDoubleClick={() => router.get('/factory/production-orders/' + order.id)}>
                                                <TableCell className="text-center">{ind + 1}</TableCell>
                                                <TableCell className="text-center">{order.ordered_by}</TableCell>
                                                <TableCell className="text-center">{getDariCategory(order.bom.category.name)}</TableCell>
                                                <TableCell className={`text-center ${getStatusColor(order.status)}`}>{getDariOrderStatus(order.status)}</TableCell>
                                                <TableCell className="text-center">{new Date(order.order_date).toDateString()}</TableCell>
                                                <TableCell className="text-center p-0">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger>
                                                            <Recycle />
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenu>
                                                                {statusController(order.status).map((status, ind) =>
                                                                    <div className='flex flex-col p-1' key={ind}>
                                                                        <DropdownMenuItem disabled={status.value == order.status} className={`hover:bg-secondary ${status.value === order.status ? buttonVariants({ variant: 'default' }) : buttonVariants({ variant: 'secondary' })}`} onClick={() => handleOrderStatus(order.id, status.value)}>{status.label}</DropdownMenuItem>
                                                                    </div>
                                                                )}
                                                            </DropdownMenu>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
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