import Bill from '@/components/bill/bill';
import Content from '@/components/bill/content';
import Footer from '@/components/bill/footer';
import Header from '@/components/bill/header';
import Overview from '@/components/bill/overveiw';
import {
    getDariItemType,
    getDariItemUnit,
} from '@/components/location-translator';
import { formatPersianDate } from '@/components/persian-date-picker';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { ProductionOrder } from '@/types';

interface Props {
    production_order: ProductionOrder;
    logo: string;
}

const Ingredients = ({ production_order, logo }: Props) => {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'لیست سفارشات', href: '/factory/production-orders' },
                {
                    title: `سفارش ${production_order.ordered_by}`,
                    href: `/factory/production-orders/${production_order.id}`,
                },
                {
                    title: 'ترکیبات',
                    href:
                        '/factory/production-orders/' +
                        production_order.id +
                        '/production-inputs',
                },
            ]}
        >
            <div className="mt-10">
                <Bill>
                    <Header logo={logo} title="بل ترکیبات" />
                    <Overview>
                        <p>فورمول: {production_order.bom.formula_name}</p>
                        <p>
                            تاریخ سفارش:{' '}
                            {formatPersianDate(
                                String(production_order.order_date),
                            )}
                        </p>
                        <p>شماره سفارش: {production_order.reference_no}</p>
                    </Overview>
                    <Content>
                        <div>
                            <Table className="border">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center">
                                            شماره
                                        </TableHead>
                                        <TableHead className="text-center">
                                            کود جنس/مواد
                                        </TableHead>
                                        <TableHead className="text-center">
                                            جنس
                                        </TableHead>
                                        <TableHead className="text-center">
                                            مقدار
                                        </TableHead>
                                        <TableHead className="text-center">
                                            واحد پایه
                                        </TableHead>
                                        <TableHead className="text-center">
                                            نوع جنس
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {production_order.production_inputs
                                        .length ? (
                                        production_order.production_inputs.map(
                                            (input, index) => (
                                                <TableRow key={input.id}>
                                                    <TableCell className="text-center">
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {input.item.code ?? '_'}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {input.item.name}
                                                    </TableCell>
                                                    <TableCell className="text-center font-semibold">
                                                        {Number(
                                                            input.quantity_used,
                                                        ).toLocaleString(
                                                            'en-US',
                                                            {
                                                                maximumFractionDigits: 3,
                                                            },
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {getDariItemUnit(
                                                            input.item.base_unit
                                                                ?.symbol ??
                                                                getDariItemUnit(input.item
                                                                    .base_unit
                                                                    ?.name ??
                                                                input.item.unit),
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {getDariItemType(
                                                            input.item
                                                                .item_type,
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                className="py-8 text-center text-muted-foreground"
                                                colSpan={6}
                                            >
                                                مواد مصرفی برای این سفارش ثبت
                                                نشده است.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Content>
                    <Footer />
                </Bill>
            </div>
        </AppLayout>
    );
};

export default Ingredients;
