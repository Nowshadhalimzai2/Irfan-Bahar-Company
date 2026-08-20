import Content from "@/components/bill/content";
import Footer from "@/components/bill/footer";
import Header from "@/components/bill/header";
import { getDariCategory, getDariItemUnit } from "@/components/location-translator";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";
import { ProductionOrder } from "@/types";
import { Printer } from "lucide-react";
import { useRef } from "react";
import Bill from "../../../components/bill/bill";
import Overview from "@/components/bill/overveiw";

interface Props {
    productionOrder: ProductionOrder;
    logo: string;
}
const Show = ({ productionOrder, logo }: Props) => {


    return (
        <AppLayout breadcrumbs={[
            { title: 'کارخانه', href: '/factory/home' },
            { title: 'لیست سفارشات', href: '/factory/production-orders' },
            { title: 'سفارش ' + productionOrder.ordered_by, href: '/factory/production-orders/' + productionOrder.id },
        ]}>

            <Bill >
                {/* BILL HEADER  */}
                <Header logo={logo} title="بل سفارش" />

                {/* BILL INFO */}
                <Overview>
                    <p>سفارش توسط : {productionOrder.ordered_by}</p>
                    <p>تاریخ سفارش : {new Date(productionOrder.order_date).toLocaleDateString()}</p>
                    <p> {productionOrder.reference_no} : سفارش نمبر </p>
                </Overview>

                {/*  BILL CONTENT */}
                <Content>
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
                        </Table>
                    </div>
                    <div className="p-5 bg-muted">
                        <p>{productionOrder?.notes}</p>
                    </div>
                </Content>

                {/* BILL FOOTER */}
                <Footer />

            </Bill>
        </AppLayout>
    )
}

export default Show