import { SectionTitle } from '@/components/section-title';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';

import { getDariCategory, getDariItemUnit } from '@/components/location-translator';
import { Category, Item } from '@/types/item';
import { ProductionOrder } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, DeleteIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import orderInputs from '@/routes/order-inputs';

interface Props {
    items: Item[];
    production_order: ProductionOrder;
    status: 'complete';
}

type OrderInput = {
    item_id: number;
    quantity_used: number;
}

type Order = {
    status: string;
    production_order_id: number;
    orderInputs: OrderInput[];
    doesItHaveWaste: boolean;

}

const Create = ({ items, status, production_order }: Props) => {

    const [OrderInput, setOrderInput] = useState<OrderInput[]>(() =>
        production_order.production_inputs.map((input) => ({
            item_id: input.item.id,
            quantity_used: input.quantity_used,
        })),
    );
    const [lineError, setLineError] = useState<string | null>(null);
    const [currentLine, setCurrentLine] = useState<OrderInput>(() => ({
        item_id: items[0]?.id ?? 0,
        quantity_used: 1,
    }));

    const { data, setData, errors, put, processing } = useForm<Order>({
        'production_order_id': production_order.id,
        'status': status,
        'orderInputs': [],
        'doesItHaveWaste': false,

    });

    useEffect(() => {
        setData('orderInputs', OrderInput);
    }, [OrderInput, setData]);

    const handleProductionInput = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        put(`/factory/production-inputs/${production_order.id}`, {
            onFinish: () => {
                setOrderInput([]);
                setCurrentLine({
                    item_id: items[0]?.id ?? 1,
                    quantity_used: 1,
                });
            },
        });
    };

    const handleAddLine = () => {

        if (!currentLine.item_id || currentLine.quantity_used <= 0) {
            return;
        }

        // prevent adding the same item twice
        if (OrderInput.some((l) => l.item_id === currentLine.item_id)) {
            setLineError('این جنس قبلا اضافه شده است');
            return;
        }

        setOrderInput((prev) => [...prev, currentLine]);
        setCurrentLine((prev) => ({
            ...prev,
            quantity_used: 1,
        }));
        setLineError(null);
    };

    const removeItem = (index: number) => {
        setOrderInput((prev) => prev.filter((_, i) => i !== index));
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
                { title: 'لیست سفارشات', href: '/factory/production_orders' },
                { title: production_order.ordered_by, href: '/factory/production-orders/' + production_order.id },
                { title: 'تائید مواد خام', href: '/factory/production-orders/confirm-order-inputs' },
            ]}
        >
            <div className="">
                <section>
                    <div className="max-w-3xl mx-auto p-5">
                        <SectionTitle title='تائید مواد خام' description='لطفا مواد خام قبل از ثبت نمودن در سیستم چک و خوده مطمئین بسازد' />
                        <div className="">
                            <form onSubmit={handleProductionInput} name="boms" id="boms">

                                <section className=" ITEMSection mt-8">
                                    <div>
                                        <div className="grid gap-6   grid-cols-1 md:grid-cols-2 ">

                                            <div className="grid gap-2">
                                                <Label htmlFor="item_id">مواد خام یا پیکنګ</Label>
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
                                                            {item.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError message={errors.orderInputs} className="mt-2" />

                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="quantity" className="flex justify-between">
                                                    <span>  مقدار  </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {currentLine.quantity_used} {getDariItemUnit(itemUnit)}
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="quantity"
                                                    type="number"
                                                    min={1}
                                                    // max={items[currentLine.item_id]}
                                                    value={currentLine.quantity_used}
                                                    onChange={(e) =>
                                                        setCurrentLine((prev) => ({
                                                            ...prev,
                                                            quantity_used: Number(e.target.value),
                                                        }))
                                                    }
                                                    placeholder="مقدار"
                                                    className="border p-1.5 rounded-md"
                                                />
                                                <InputError message={errors.orderInputs} className="mt-2" />

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
                                <h3 className='text-xl font-medium text-center p-3 text-accent mt-3'>لیست مواد خام</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className='text-center'>شماره</TableHead>
                                            <TableHead className='text-center'>جنس</TableHead>
                                            <TableHead className='text-center'>مقدار</TableHead>
                                            <TableHead className='text-center'>حذف</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {OrderInput.length > 0 && (
                                            OrderInput.map((input, ind) =>
                                                <TableRow key={ind}>
                                                    <TableCell className='text-center'>{ind}</TableCell>
                                                    <TableCell className='text-center'>{items.filter(item => item.id === input.item_id)[0].name}</TableCell>
                                                    <TableCell className='text-center'>{input.quantity_used}</TableCell>
                                                    <TableCell className='flex justify-center items-center'>
                                                        <DeleteIcon onClick={() => removeItem(ind)} className='text-destructive' />
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        )}
                                    </TableBody>
                                </Table>
                                <div className="mt-6">
                                    <div className={`${data.doesItHaveWaste && 'text-primary border-primary'} grid px-3 py-2 rounded-sm hover:border-primary border group hover:shadow-md overflow-hidden transition-all gap-2 `}>
                                        <div className='flex items-center  justify-start gap-3'
                                            

                                        >
                                            <Input
                                                type='checkbox'
                                                onChange={(e) => setData('doesItHaveWaste', e.target.checked)}
                                                className='size-5' />
                                            <div className="">
                                                <h4 className='font-medium text-sm group-hover:text-primary'>ایا تولید ضایعات دارد؟</h4>
                                                <small className='text-sm text-muted-foreground group-hover:text-primary/70'>اګر محصول تان ضایعات داده لطفا این بکس را انتخاب کنید</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <div className='grid gap-2'>
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            tabIndex={1}
                                            data-test="register-employee-button"
                                        >
                                            {processing && <Spinner />}
                                            {!data.doesItHaveWaste ? ' ثبت کنید' : 'پیش برین'}
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