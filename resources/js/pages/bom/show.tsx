import LocationTranslator, { getDariItemType, getDariItemUnit } from '@/components/location-translator';
import { SectionTitle } from '@/components/section-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BOM, BOMLine } from '@/types';
import { Minus, Plus } from 'lucide-react';
import React, { useMemo, useState } from 'react'
interface Props {
    bom: BOM;
}
const Show = ({ bom }: Props) => {
    const productWeightPerUnit = bom.product.weight;
    const productUnit = getDariItemUnit(bom.product.item.unit);
    const minqty = bom.min_exp_qty;
    const maxqty = bom.max_exp_qty;
    const [quantity, setQuantity] = useState<number>(maxqty);
    const quantityCalculator = (defaultQty: number) => {
        // maxqty     reqqty
        // unit      X
        // x = (unit*reqqty)/maxqty
        return useMemo(() => ((quantity * defaultQty) / maxqty).toFixed(2), [quantity, defaultQty, maxqty]);
    }
    console.log('rendered');


    return (
        <AppLayout
            breadcrumbs={[
                { title: 'دشبورد', href: '/dashbaord' },
                { title: 'لیست فورموله ها', href: '/boms' },
                { title: bom.formula_name, href: '/boms/' + bom.id },


            ]}
        >
            <div>
                <section className=" py-8">
                    <div className="max-w-4xl mx-auto">
                        {/* <SectionTitle title={'bom'} /> */}

                        <div className="mt-5 px-2 md:px-4 lg:px-6">
                            <div className="">
                                <h2 className='text-xl font-semibold text-center text-secondary-foreground p-5'>خلص فورمول</h2>
                                <div className="flex flex-col justify-end items-end bg-white dark:bg-accent-foreground rounded-md p-5 shadow py-3">
                                    <div className="flex justify-center items-center w-full p-5 text-accent">
                                        <h3 className="text-center text-lg font-semibold">{bom.product.item.name}</h3>
                                    </div>
                                    <div className="grid gap-5 grid-cols-2 place-items-end w-full">
                                        <div className=""> تخمین تولید حد اقل : {productUnit} {minqty}</div>
                                        <div className=""> تخمین تولید حد اکثر : {productUnit} {maxqty}</div>
                                        <div className="">   <span>جمله وزن: </span>  {productWeightPerUnit * minqty} - {productWeightPerUnit * maxqty} کیلو/ لیتر</div>
                                        <div className="">   <span>وزن یک {productUnit} : </span>  {productWeightPerUnit} کیلو/ لیتر</div>
                                        {bom.product.per_pack !== 1 && <div className=""> دارای {bom.product.per_pack} عدد در هر {productUnit}</div>}
                                    </div>
                                </div>
                            </div>
                            {/* <p className="text-end p-5 text-accent-foreground text-sm border-b">نوت : {bom.notes}</p>  */}
                            <div className='mt-3 border-t '>
                                <div className="QuantityCalculator bg-foreground py-5 rounded-md text-white  ">
                                    <h3 className='text-center font-semibold p-6'>کلکولیتر مواد خام</h3>
                                    <div className="flex justify-center items-start gap-5 max-w-xl mx-auto">
                                        <Button onClick={() => setQuantity(pre => pre - 1)}><Minus /></Button>
                                        <div className='space-y-1'>
                                            <Input className='font-bold' type='text' max={maxqty} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
                                            <p className='text-sm text-muted-foreground'>ه{quantity} {productUnit} که معادل {quantity*bom.product.weight} کیلو</p>
                                        </div>
                                        <Button onClick={() => setQuantity(pre => pre + 1)}><Plus /></Button>
                                    </div>
                                </div>
                                <h2 className='text-lg font-medium text-center text-secondary-foreground p-5'>مواد که در یک مکسر در  ساختن {bom.product.item.name} استفاده میشود</h2>
                                <Table>
                                    <TableCaption>اجناس بالا در تولید جنس استفاده میشود</TableCaption>
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
                                                واحد جنس
                                            </TableHead>
                                            <TableHead className="text-center">
                                                نوع جنس
                                            </TableHead>

                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bom.bom_lines.map((line, ind) =>
                                            <TableRow key={ind}>
                                                <TableCell className="text-center">{ind + 1}</TableCell>
                                                <TableCell className="text-center">{line.item.name}</TableCell>
                                                <TableCell className="text-center">{quantityCalculator(line.required_quantity)}</TableCell>
                                                <TableCell className="text-center">{getDariItemUnit(line.item.unit)}</TableCell>
                                                <TableCell className="text-center">{getDariItemType(line.item.item_type)}</TableCell>
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