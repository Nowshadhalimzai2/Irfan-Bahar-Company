import { SectionTitle } from '@/components/section-title';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';

import {  getDariItemUnit } from '@/components/location-translator';
import {  Item } from '@/types/item';
import { ProductionOrder } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {  DeleteIcon, LockKeyholeOpen } from 'lucide-react';
import PageHead from '@/components/page-head';

interface Props {
    items: Item[];
    production_order: ProductionOrder;
    status: 'completed';
}

type output = {
    item_id: number;
    quantity_produced: number;
}

type Order = {
    status: string;
    production_order_id: number;
    outputs: output[];

}

const Create = ({ items, status, production_order }: Props) => {
    
    const [output, setOutput] = useState<output[]>(() =>
        production_order.production_outputs.map((output) => ({
            item_id: output.product.item_id,
            quantity_produced: output.quantity_produced,
        })),
    );
    
    const [lineError, setLineError] = useState<string | null>(null);
    const [currentLine, setCurrentLine] = useState<output>(() => ({
        item_id: items[0]?.id ?? 0,
        quantity_produced: 1,
    }));

    const { data, setData, errors, put, processing } = useForm<Order>({
        'production_order_id': production_order.id,
        'status': status,
        'outputs': [],

    });

    useEffect(() => {
        setData('outputs', output);
    }, [output, setData]);

    const handleProductionInput = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        //   /factory/production-orders/{production_order}/{status}/confirm-order-outputs
        if(status!=='completed'){
            console.log('could not proceed with status: ',status);
            
            return ;
        }
        put(`/factory/production-orders/${production_order.id}/${status}/confirm-order-outputs`, {
            onFinish: () => {
                setOutput([]);
                setCurrentLine({
                    item_id: items[0]?.id ?? 1,
                    quantity_produced: 1,
                });
            },
        });
    };

    const handleAddLine = () => {

        if (!currentLine.item_id || currentLine.quantity_produced <= 0) {
            return;
        }

        // prevent adding the same item twice
        if (output.some((l) => l.item_id === currentLine.item_id)) {
            setLineError('این جنس قبلا اضافه شده است');
            return;
        }

        setOutput((prev) => [...prev, currentLine]);
        setCurrentLine((prev) => ({
            ...prev,
            quantity_produced: 1,
        }));
        setLineError(null);
    };

    const removeItem = (index: number) => {
        setOutput((prev) => prev.filter((_, i) => i !== index));
    };

    const itemUnit = useMemo(() => {
        if (items.length === 0)
            return 'unit';
        return items.filter(item => item.id === currentLine.item_id)[0].unit;

    }, [currentLine]);
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'لیست سفارشات', href: '/factory/production-orders' },
                { title: production_order.ordered_by, href: '/factory/production-orders/' + production_order.id },
                { title: 'تائید محصولات', href: '/factory/production-orders/'+production_order.id+'/'+status+'/confirm-order-outputs' },
            ]}
        >
            <div className="px-1 md:px-3">
                <section>
                    <div className="max-w-3xl mx-auto p-5">
                    <PageHead
                        HeadIcon={LockKeyholeOpen}
                        subtitle={'سفارش '+production_order.ordered_by}
                        title="تائید محصولات"
                        description={`لطف نموده محصولات که در سفارش تولید شده قبل از پیش رفتن یک بار تائید کنید. مرحله:  1/3`}
                        tone={'pink'}
                    />
                        <div className="" dir='rtl'>
                            <form onSubmit={handleProductionInput} name="boms" id="boms">

                                <section className=" ITEMSection mt-8">
                                    <div>
                                        <div className="grid gap-6   grid-cols-1 md:grid-cols-2 ">

                                            <div className="grid gap-2">
                                                <Label htmlFor="item_id">محصولات</Label>
                                                <select
                                                    className="border p-1.5 rounded-md"
                                                    name="item_id"
                                                    tabIndex={5}
                                                    value={currentLine.item_id}
                                                    onChange={(e) =>
                                                        setCurrentLine((prev) => ({
                                                            ...prev,
                                                            item_id: Number(e.target.value),
                                                        }))
                                                    }
                                                >
                                                    {items.map((item) => (
                                                        <option value={item.id} key={item.id}>
                                                            {item.name} {' '}{item.code}
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError message={errors.outputs} className="mt-2" />

                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="quantity" className="flex justify-between">
                                                    <span>  مقدار  </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {currentLine.quantity_produced} {getDariItemUnit(itemUnit)}
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="quantity"
                                                    type="number"
                                                    min={1}
                                                    dir='ltr'
                                                    // max={items[currentLine.item_id]}
                                                    value={currentLine.quantity_produced}
                                                    onChange={(e) =>
                                                        setCurrentLine((prev) => ({
                                                            ...prev,
                                                            quantity_produced: Number(e.target.value),
                                                        }))
                                                    }
                                                    placeholder="مقدار"
                                                    className="border p-1.5 rounded-md"
                                                />
                                                <InputError message={errors.outputs} className="mt-2" />

                                            </div>


                                        </div>

                                        <div className="mt-4">
                                            <Button
                                                type="button"
                                                className="w-full"
                                                variant={'secondary'}
                                                tabIndex={6}
                                                onClick={handleAddLine}
                                            >
                                                اضافه کردن جنس
                                            </Button>
                                        </div>
                                        {lineError && <div className="mt-2"><InputError message={lineError} /></div>}
                                    </div>
                                </section>



                                {/* ================================  RESULTS  =============================================== */}
                                <h3 className='text-xl font-medium text-center p-3 text-accent mt-3'>لیست محصولات</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className='text-center'>شماره</TableHead>
                                            <TableHead className='text-center'>کود جنس</TableHead>
                                            <TableHead className='text-center'>جنس</TableHead>
                                            <TableHead className='text-center'>مقدار</TableHead>
                                            <TableHead className='text-center'>حذف</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {output.length > 0 && (
                                            output.map((output, ind) =>
                                                <TableRow key={ind}>
                                                    <TableCell className='text-center'>{ind+1}</TableCell>
                                                    <TableCell className='text-center'>{items.filter(item => item.id === output.item_id)[0].code}</TableCell>
                                                    <TableCell className='text-center'>{items.filter(item => item.id === output.item_id)[0].name}</TableCell>
                                                    <TableCell className='text-center'>{output.quantity_produced}</TableCell>
                                                    <TableCell className='flex justify-center items-center'>
                                                        <DeleteIcon onClick={() => removeItem(ind)} className='text-destructive' />
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        )}
                                    </TableBody>
                                </Table>
                               
                                <div className="mt-6">
                                    <div className='grid gap-2'>
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            tabIndex={1}
                                            data-test="register-employee-button"
                                        >
                                            {processing && <Spinner />}
                                            پیش برین
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            </div >
        </AppLayout >
    );
};

export default Create;