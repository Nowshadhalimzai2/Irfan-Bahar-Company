import AppLayout from '@/layouts/app-layout';
import { ProductionInput, ProductionOrder } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SectionTitle } from '@/components/section-title';
import Bill from '@/components/bill/bill';
import Header from '@/components/bill/header';
import Content from '@/components/bill/content';
import Footer from '@/components/bill/footer';
import Overview from '@/components/bill/overveiw';
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
                { title: 'سفارش ' + production_order.ordered_by, href: '/factory/production-orders/' +production_order.id },
                { title: 'ترکیبات', href: '/factory/production-orders/' + production_order.id + '/production-inputs' },
            ]}
        >
            <div className='mt-10'>

                <Bill >
                    <Header logo={logo} title={' بل ترکیبات '} />
                    <Overview>
                            <p>فورمول : {production_order.bom.formula_name}</p>                     
                            <p>تاریخ سفارش : {new Date(production_order.order_date).toLocaleDateString()}</p>
                            <p> {production_order.reference_no} : سفارش نمبر </p>
                    </Overview>
                    <Content >
                        <div>
                            <Table className="border">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center">شماره</TableHead>
                                        <TableHead className="text-center">کود جنس/مواد</TableHead>
                                        <TableHead className="text-center">جنس</TableHead>
                                        <TableHead className="text-center">مقدار</TableHead>
                                        {/* <TableHead className="text-center">وزن</TableHead>
                                <TableHead className="text-center">دارای</TableHead> */}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {
                                        production_order.production_inputs.map((input, ind) =>
                                            <TableRow key={ind}>
                                                <TableCell className="text-center">{ind + 1}</TableCell>
                                                <TableCell className="text-center">{input.item.code ?? '_'}</TableCell>
                                                <TableCell className="text-center">{input.item.name}</TableCell>
                                                <TableCell className="text-center">{input.quantity_used}</TableCell>
                                                {/* <TableCell className="text-center">ګرام {((input.product.weight / input.product.per_pack) * 1000).toFixed()}</TableCell>
                                        <TableCell className="text-center"> دانه {input.product.per_pack}</TableCell> */}
                                            </TableRow>
                                        )
                                    }

                                </TableBody>
                            </Table>
                        </div>
                    </Content>

                    <Footer />
                </Bill>
            </div>


        </AppLayout>
    )
}

export default Ingredients