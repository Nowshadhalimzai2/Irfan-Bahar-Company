import React from 'react';
import LocationTranslator from '@/components/location-translator';
import { formatPersianDate } from '@/components/persian-date-picker';
import { SectionTitle } from '@/components/section-title';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { GoodsReceipt } from '@/types/item';

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
                                <div className="flex justify-end items-end bg-white dark:bg-accent-foreground rounded-md p-5 shadow py-3">
                                    <ul className="flex gap-5 justify-between w-full flex-wrap">
                                        <li className="font-medium">نام کننده : {receipt.supplier.name}</li>
                                        <li className="font-medium">امد به :  {LocationTranslator(receipt.location.name)}</li>
                                        <li className="font-medium">تاریخ : {formatPersianDate(String(receipt.received_at))}</li>
                                    </ul>
                                </div>
                            </div>
                            <p className="text-end p-5 text-accent-foreground text-sm border-b">نوت : {receipt.notes}</p>
                            <div >

                                <Table>
                                        <TableCaption>اجناس بالا امد به کارخانه</TableCaption>
                                    <TableHeader>
                                        <TableRow>
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
                                                واحد پول
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {receipt.receipt_lines.map((line, ind) =>
                                            <TableRow key={ind}>
                                                <TableCell className="text-center">{line.item.name}</TableCell>
                                                <TableCell className="text-center">{line.quantity}</TableCell>
                                                <TableCell className="text-center">{line.item.product?.weight ?? 'N/A'}</TableCell>
                                                <TableCell className="text-center">{line.item.unit}</TableCell>
                                                <TableCell className="text-center">{line.unit_cost}</TableCell>
                                                {/* <TableCell className="text-center">{line.currency.name}</TableCell> */}
                                            </TableRow>
                                        )}
                                    </TableBody>
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