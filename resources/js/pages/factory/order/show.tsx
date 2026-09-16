import Content from "@/components/bill/content";
import Footer from "@/components/bill/footer";
import Header from "@/components/bill/header";
import { getDariItemUnit } from "@/components/location-translator";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, ProductionOrder } from "@/types";
import Bill from "../../../components/bill/bill";
import Overview from "@/components/bill/overveiw";
import { useMemo } from "react";

interface Props {
    productionOrder: ProductionOrder;
    logo: string;
}
const Show = ({ productionOrder, logo }: Props) => {
    let breadcrumbs: BreadcrumbItem[] = [
        { title: 'کارخانه', href: '/factory/home' },
        { title: 'لیست سفارشات', href: '/factory/production-orders' },
        { title: 'سفارش ' + productionOrder.ordered_by, href: '/factory/production-orders/' + productionOrder.id },
    ];
    if (productionOrder.status === 'cancelled' || productionOrder.status === 'drafted') {
        breadcrumbs = [
            { title: 'کارخانه', href: '/factory/home' },
            { title: 'لیست سفارشات', href: '/factory/production-orders' },
            { title: 'لیست سفارشات آشغال', href: '/factory/production-orders/junks' },
            { title: 'سفارش ' + productionOrder.ordered_by, href: '/factory/production-orders/' + productionOrder.id },
        ];
    }
    const totalOrderWeight = useMemo(() => {
        return productionOrder.production_outputs.reduce((acc, output) => acc += (output.quantity_produced * output.product.weight), 0)
    }, [[productionOrder]]);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>

            <div className="p-4">

                <Bill production_order_id={productionOrder.id} >
                    {/* BILL HEADER  */}
                    <Header logo={logo} title="بل سفارش" />
            
                    {/* BILL INFO */}
                    <Overview>
                        <p>سفارش توسط : {productionOrder.ordered_by}</p>
                        <p>تاریخ سفارش : {new Date(productionOrder.order_date).toLocaleDateString()}</p>
                        <p> {productionOrder.reference_no} : سفارش نمبر </p>
                    </Overview>

                    {/*  BILL CONTENT */}
                    <Content status={productionOrder.status} >
                        <div>
                            <Table className="border">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center">شماره</TableHead>
                                        <TableHead className="text-center">جنس</TableHead>
                                        <TableHead className="text-center">مقدار</TableHead>
                                        <TableHead className="text-center">وزن</TableHead>
                                        <TableHead className="text-center">دارای</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {
                                        productionOrder.production_outputs.map((output, ind) =>
                                            <TableRow key={ind}>
                                                <TableCell className="text-center">{ind + 1}</TableCell>
                                                <TableCell className="text-center">{output.product.item.name}</TableCell>
                                                <TableCell className="text-center">{output.quantity_produced} {getDariItemUnit(output.product.item.unit)}</TableCell>
                                                <TableCell className="text-center">ګرام {((output.product.weight / output.product.per_pack) * 1000).toFixed()}</TableCell>
                                                <TableCell className="text-center"> دانه {output.product.per_pack}</TableCell>
                                            </TableRow>
                                        )
                                    }

                                </TableBody>

                                <TableFooter>
                                    <TableRow>
                                        <TableCell>جمله وزن سفارش : </TableCell>
                                        <TableCell colSpan={4} className="text-center">{totalOrderWeight}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                        <div className="p-5 border text-muted-foreground mt-5">
                            <p>نوت : {productionOrder?.notes}</p>
                        </div>

                    </Content>

                    {/* BILL FOOTER */}
                    <Footer />

                </Bill>
            </div>
        </AppLayout>
    )
}

export default Show