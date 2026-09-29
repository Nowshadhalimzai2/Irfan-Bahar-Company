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
import { getDariCategory, getDariOrderStatus, getStatusColor } from '@/components/location-translator';
import { buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Recycle } from 'lucide-react';
import { statusController } from '@/components/status-controller';
import { router } from '@inertiajs/react';

interface Props {
    junkOrders: ProductionOrder[];
}

const Index = ({ junkOrders }: Props) => {

    const handleOrderStatus = (orderID: number, status: StatusType) => {
        router.put(`/factory/production-orders/${orderID}/change-status/${status}`);
    }
   
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'لیست سفارشات', href: '/factory/production-orders' },
                { title: 'لیست سفارشات آشغال', href: '/factory/junkOrders' },
            ]}
        >
            <div>
                <section className='section'>
                    <div>

                        <SectionTitle title='لیست سفارشات' description='تمام سفارشات ګرفته از مشتری ها اینجا دید میتانی' />
                        <section dir='rtl'>
                            <div className="max-w-4xl mx-auto px-8">
                                <Table>
                                    <TableCaption>(<span>{junkOrders.length}</span>)  <span>سفارشات آشغال </span> </TableCaption>
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
                                        {junkOrders.length > 0 ? junkOrders.map((order, ind) => (
                                            <TableRow aria-disabled={order.status === 'cancelled'} key={order.id} onDoubleClick={() => router.get('/factory/production-orders/' + order.id)}>
                                                <TableCell className="text-center">{ind + 1}</TableCell>
                                                <TableCell className="text-center">{order.ordered_by}</TableCell>
                                                <TableCell className="text-center">{getDariCategory(order.bom.category.name)}</TableCell>
                                                <TableCell className={`text-center font-medium ${getStatusColor(order.status)}`}>{getDariOrderStatus(order.status)}</TableCell>
                                                <TableCell className="text-center">{new Date(order.order_date).toDateString()}</TableCell>
                                                <TableCell className="text-center p-0">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger className='bg-teal-800 p-1 px-5 text-white'  asChild>
                                                            <Recycle />
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenu >
                                                               {statusController(order.status).map((status, ind) =>
                                                                    <div className='flex flex-col p-1' key={ind}>
                                                                        <DropdownMenuItem asChild disabled={status.value == order.status} className={`hover:bg-secondary ${status.value === order.status ? buttonVariants({ variant: 'default' }) : buttonVariants({ variant: 'secondary' })}`} onClick={() => handleOrderStatus(order.id, status.value)}>{status.label}</DropdownMenuItem>
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