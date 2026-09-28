import LocationTranslator from '@/components/location-translator';
import { SectionTitle } from '@/components/section-title';
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { GoodsReceipt } from '@/types/item';
import React from 'react'
import { Line } from 'recharts';
interface Props {
    receipt: GoodsReceipt;
}
const Show = ({ receipt }: Props) => {
    console.log(receipt);

    return (
        <AppLayout breadcrumbs={[
            { title: 'انتقال اجناس', href: '/receipts' },
            { title: receipt.reference_no, href: '/receipts/' + receipt.id },
        ]}>
            <div>
                <section className="section">
                    <div className="max-w-4xl mx-auto">
                        <SectionTitle title={'جنس ' + receipt.reference_no} />

                        <div className="mt-5">
                            <div className="p-5">
                                <div dir='rtl' className="flex justify-end items-end bg-white dark:bg-accent-foreground rounded-md p-5 shadow py-3">
                                    <ul className="flex gap-5 justify-between w-full flex-wrap">
                                        <li className="font-medium">تامیین کننده : {receipt.supplier.name}</li>
                                        <li className="font-medium">رسید به :  {LocationTranslator(receipt.location.name)}</li>
                                        <li className="font-medium">تاریخ : {new Date(receipt.received_at).toLocaleDateString('fa-AF')}</li>
                                    </ul>
                                </div>
                            </div>
                            <div dir='rtl'>
                                <Table>
                                    {receipt.notes && <TableCaption>نوت : {receipt.notes}</TableCaption>}
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-center">
                                                شماره
                                            </TableHead>
                                            <TableHead className="text-center">
                                                جنس
                                            </TableHead>
                                            <TableHead className="text-center">
                                                مقدار
                                            </TableHead>
                                            <TableHead className="text-center">
                                                وزن
                                            </TableHead>
                                            <TableHead className="text-center">
                                                واحد جنس
                                            </TableHead>
                                            <TableHead className="text-center">
                                                قیمت فی عدد
                                            </TableHead>
                                            <TableHead className="text-center">
                                                فروش
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {receipt.receipt_lines.map((line, ind) =>
                                            <TableRow key={ind}>
                                                <TableCell className="text-center">{ind+1}</TableCell>
                                                <TableCell className="text-center">{line.item.name ?? '_'}</TableCell>
                                                <TableCell className="text-center">{line.quantity}</TableCell>
                                                <TableCell className="text-center">{line.item.product?.weight ?? 'N/A'}</TableCell>
                                                <TableCell className="text-center">{line.item.unit}</TableCell>
                                                <TableCell className="text-center">{line.unit_cost}</TableCell>
                                                <TableCell className="text-center">{line.item.default_sale_price}</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow>
                                            <TableHead colSpan={2} className='text-start'>
                                                جمله : {receipt.receipt_lines.reduce((acc,line)=>acc+=line.unit_cost*line.quantity,0)}
                                            </TableHead>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    )
}

export default Show