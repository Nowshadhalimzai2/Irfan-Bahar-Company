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
import { SectionTitle } from '@/components/section-title';
import AppLayout from '@/layouts/app-layout';
import { BOM } from "@/types";


interface Props {
    boms: BOM[];
}
const Index = ({ boms }: Props) => {
    return (
        <AppLayout breadcrumbs={[
            { title: 'دشبورد', href: "/dashboard" },
            { title: 'فورموله ها', href: "/boms" },

        ]}>
            <div className="section">
                <SectionTitle title="فورموله ها" description="در این بخش کله فورموله ها تنظیم میشه" />
                <div className="max-w-4xl mx-auto px-8">
                    <Table>
                        <TableCaption>لیست فورموله ها برای اجناس</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-20 text-center">شماره</TableHead>
                                <TableHead className="text-center">فورموله</TableHead>
                                <TableHead className="text-center">جنس</TableHead>
                                <TableHead className="text-center">کتګوری</TableHead>
                                <TableHead className="text-center">مقدار حداقل</TableHead>
                                <TableHead className="text-center">مقدار حداکثر</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {boms.length > 0 ? boms.map((bom, ind) => (
                                <TableRow key={bom.id}>
                                    <TableCell className="text-center">{ind}</TableCell>
                                    <TableCell className="text-center">{bom.formula_name}</TableCell>
                                    <TableCell className="text-center">{bom.product.item.name}</TableCell>
                                    <TableCell className="text-center">{bom.min_exp_qty}</TableCell>
                                    <TableCell className="text-center">{bom.max_exp_qty}</TableCell>
                                    <TableCell className="text-center">{bom.product.item.category.name}</TableCell>

                                </TableRow>
                            )) : <TableRow>
                                <TableCell colSpan={6} className="text-center text-gray-500 text-sm p-5"> کدام فورموله ثبت نشده</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    )
}

export default Index