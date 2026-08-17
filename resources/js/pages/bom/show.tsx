import { getDariCategory, getDariItemType, getDariItemUnit } from '@/components/location-translator';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BOM } from '@/types';
import { Minus, Plus } from 'lucide-react';
import { useMemo, useState } from 'react'

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { router } from '@inertiajs/core';
import { route } from 'ziggy-js';
import { Link } from '@inertiajs/react';

interface Props {
    bom: BOM;
}
const Show = ({ bom }: Props) => {
    // const productWeightPerUnit = bom.product.weight;
    // const productUnit = getDariItemUnit(bom.product.item.unit);
    const minqty = bom.min_exp_qty;
    const maxqty = bom.max_exp_qty;
    const [quantity, setQuantity] = useState<number>(maxqty);
    const quantityCalculator = (defaultQty: number) => {
        // maxqty     reqqty
        // unit      X
        // x = (unit*reqqty)/maxqty
        return useMemo(() => ((quantity * defaultQty) / maxqty).toFixed(3), [quantity, defaultQty, maxqty]);
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
                                        <h3 className="text-center text-lg font-semibold">{getDariCategory(bom.category.name)}</h3>
                                    </div>
                                    <div className="grid gap-5 grid-cols-2 place-items-end w-full">
                                        <div className=""> تخمین تولید حد اقل : <span>کیلو/لیتر</span> {minqty}</div>
                                        <div className=""> تخمین تولید حد اکثر : <span>کیلو/لیتر</span> {maxqty}</div>
                                        {/* <div className="">   <span>جمله وزن: </span>  {productWeightPerUnit * minqty} - {productWeightPerUnit * maxqty} کیلو/ لیتر</div> */}
                                        {/* <div className="">   <span>وزن یک <span>کیلو/لیتر</span> : </span>  {productWeightPerUnit} کیلو/ لیتر</div> */}
                                        {/* {bom.product.per_pack !== 1 && <div className=""> دارای {bom.product.per_pack} عدد در هر <span>کیلو/لیتر</span></div>} */}
                                    </div>
                                </div>
                            </div>
                            {/* <p className="text-end p-5 text-accent-foreground text-sm border-b">نوت : {bom.notes}</p>  */}
                            <div className='mt-3 border-t'>
                                <div className="QuantityCalculator bg-foreground py-5 rounded-md text-white  ">
                                    <h3 className='text-center font-semibold p-6'>کلکولیتر مواد خام</h3>
                                    <div className="flex justify-center items-start gap-5 max-w-xl mx-auto">
                                        <Button onClick={() => setQuantity(pre => pre - 1)}><Minus /></Button>
                                        <div className='space-y-1'>
                                            <Input className='font-bold' type='text' max={maxqty} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
                                            {/* <p className='text-sm text-muted-foreground'>ه{quantity} <span>کیلو/لیتر</span> که معادل {quantity * bom.product.weight} کیلو</p> */}
                                        </div>
                                        <Button onClick={() => setQuantity(pre => pre + 1)}><Plus /></Button>
                                    </div>
                                </div>
                               <div className="py-8 ">
                                 <h2 className='text-lg font-medium text-center text-secondary-foreground p-5'>مواد که در یک مکسر در  ساختن {getDariCategory(bom.category.name)} استفاده میشود</h2>
                                <Table >
                                    <TableCaption><Button variant={'secondary'} onClick={()=>alert('printed')}>پرینت کنید</Button> اجناس بالا در تولید جنس استفاده میشود  </TableCaption>
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
                    </div>
                </section>

                <section className="py-8 max-w-4xl mx-auto px-5 border-t ">
                    {/*  BOM LINE DELETION SECITON    ------ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <EditBom bomID={bom.id} />
                        <DeleteBomLIne bomID={bom.id} />
                    </div>
                </section>
            </div>
        </AppLayout>
    )
}

const DeleteBomLIne = ({ bomID }: { bomID: number }) => {
    return (
        <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
            <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                <p className="font-medium">هشدار</p>
                <p className="text-sm">
                    لطفا عمل را با احتیاط اجرا کنین
                </p>
            </div>

            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant="destructive"
                        data-test="delete-user-button"
                    >
                        فورمول را حذف کنین
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle>
                        مطمئین هستین که فورمول را حذف کنین؟
                    </DialogTitle>

                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button
                                variant="secondary"
                            >
                                لغوه حذف نمودن فورمول
                            </Button>
                        </DialogClose>

                        <Button
                            variant="destructive"
                            asChild
                            onClick={() => router.delete('/boms/' + bomID)}

                        >
                            <button
                                data-test="confirm-delete-bomline-button"
                            >
                                فورمول را حدف کنین
                            </button>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </div >
    )
}

const EditBom = ({ bomID }: { bomID: number }) => {
    return (
        <div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-200/10 dark:bg-slate-700/10">
            <div className="relative space-y-0.5 text-slate-600 dark:text-slate-100">
                <p className="font-medium">ویرایش نمودن </p>
                <p className="text-sm">
                    نیاز به بر رزو رسانی دارید . اینجا کلیک کنین
                </p>
            </div>

            <Link
                className={buttonVariants({variant:"secondary"})}
                data-test="edit-bom-test"
                href={'/boms/'+bomID+'/edit'}
            >
               ویرایش فورمول
            </Link>
        </div >
    )
}
export default Show

