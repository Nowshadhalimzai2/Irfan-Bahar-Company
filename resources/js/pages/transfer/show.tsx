import LocationTranslator, { getDariItemUnit } from '@/components/location-translator';
import { SectionTitle } from '@/components/section-title';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Transfer } from '@/types/item';
import React from 'react'
interface Props {
    transfer: Transfer;
}
const Show = ({ transfer }: Props) => {

    return (
        <AppLayout breadcrumbs={[
            { title: 'انتقال اجناس', href: '/receipts' },
            { title: transfer.reference_no, href: '/transfers/' + transfer.id },
        ]}>
            <div>
                <section className="section">
                    <div className="max-w-4xl mx-auto">
                        <SectionTitle title={'جنس ' + transfer.reference_no} />

                        <div className="mt-5">
                            <div className="p-5">
                                <div className="flex justify-end items-end bg-white dark:bg-accent-foreground rounded-md p-5 shadow py-3">
                                    <ul className="flex gap-5 justify-between w-full flex-wrap">
                                        <li className="font-medium">از : {LocationTranslator(transfer.source.name)}</li>
                                        <li className="font-medium">امد به :  {LocationTranslator(transfer.destination.name)}</li>
                                        <li className="font-medium">تاریخ : {new Date(transfer.transferred_at).toDateString()}</li>
                                    </ul>
                                </div>
                            </div>
                            <p className="text-end p-5 text-accent-foreground text-sm border-b">نوت : {transfer.notes}</p>
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
                                                واحد جنس
                                            </TableHead>
                                            <TableHead className="text-center">
                                                وزن
                                            </TableHead>
                                            <TableHead className="text-center">
                                                پر کارتن
                                            </TableHead>
                                            <TableHead className="text-center">
                                                قیمت
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transfer.transfer_lines.map((line, ind) =>
                                            <TableRow key={ind}>
                                                <TableCell className="text-center">{line.item.name}</TableCell>
                                                <TableCell className="text-center">{line.quantity}</TableCell>
                                                <TableCell className="text-center">{getDariItemUnit(line.item.unit)}</TableCell>
                                                <TableCell className="text-center">{line.item.product?.weight ?? 'N/A'}</TableCell>
                                                <TableCell className="text-center">{line.item.product?.per_pack ?? 'N/A'}</TableCell>
                                                <TableCell className="text-center">{line.unit_price}</TableCell>
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