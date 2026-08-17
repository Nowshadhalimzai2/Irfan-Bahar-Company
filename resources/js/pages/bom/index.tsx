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
import { Link, router } from "@inertiajs/react";
import { buttonVariants } from "@/components/ui/button";
import { getDariCategory, getDariItemType } from "@/components/location-translator";


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
                <div className="flex justify-end items-end p-5">
                    <Link href={'/boms/create'} className={`${buttonVariants({variant:'default'})}`}>فورمول جدید </Link>
                </div>
                <div className="max-w-4xl mx-auto px-8">
                    <Table>
                        <TableCaption>لیست فورموله ها برای اجناس</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-20 text-center">شماره</TableHead>
                                <TableHead className="text-center">فورموله</TableHead>
                                <TableHead className="text-center">جنس</TableHead>
                                <TableHead className="text-center">مقدار حداقل</TableHead>
                                <TableHead className="text-center">مقدار حداکثر</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {boms.length > 0 ? boms.map((bom, ind) => (
                                <TableRow key={bom.id} onClick={()=>router.get('/boms/'+bom.id)}>
                                    <TableCell className="text-center">{ind+1}</TableCell>
                                    <TableCell className="text-center">{bom.formula_name}</TableCell>
                                    <TableCell className="text-center">{getDariCategory(bom.category.name)}</TableCell>
                                    <TableCell className="text-center">{bom.min_exp_qty}</TableCell>
                                    <TableCell className="text-center">{bom.max_exp_qty}</TableCell>

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