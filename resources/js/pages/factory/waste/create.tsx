import { SectionTitle } from '@/components/section-title';
import AppLayout from '@/layouts/app-layout';
import { router, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';

import { getDariCategory, getDariItemUnit } from '@/components/location-translator';
import { Category, Item } from '@/types/item';
import { ProductionOrder } from '@/types';
import wastes from '@/routes/wastes';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteIcon } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Props {
    categories: Category[];
    items: Item[];
    production_order: ProductionOrder;
}

type WasteLineType = {
    production_order_id: number;
    item_id: number;
    wasted_quantity: number;
}

type Waste = {
    reason: string;
    wastes: WasteLineType[];
}

const Create = ({ categories, items, production_order }: Props) => {
    const [wasteLine, setWasteLine] = useState<WasteLineType[]>([]);
    const [lineError, setLineError] = useState<string | null>(null);
    const [currentLine, setCurrentLine] = useState<WasteLineType>(() => ({
        production_order_id: production_order.id,
        item_id: items[0]?.id ?? 0,
        wasted_quantity: 1,
    }));

    const { data, setData, errors, post, processing } = useForm<Waste>({
        'reason': '',
        'wastes': [],
    });

    useEffect(() => {
        setData('wastes', wasteLine);
    }, [wasteLine, setData]);

    const handleWaste = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/factory/wastes/'+production_order.id, {
            onFinish: () => {
                setWasteLine([]);
                setCurrentLine({
                    item_id: items[0]?.id ?? 1,
                    wasted_quantity: 1,
                    production_order_id: production_order.id,
                });
            },
        });
    };

    const handleAddLine = () => {

        if (!currentLine.item_id || currentLine.wasted_quantity <= 0) {
            return;
        }

        // prevent adding the same item twice
        if (wasteLine.some((l) => l.item_id === currentLine.item_id)) {
            setLineError('این جنس قبلا اضافه شده است');
            return;
        }

        setWasteLine((prev) => [...prev, currentLine]);
        setCurrentLine((prev) => ({
            ...prev,
            wasted_quantity: 1,
        }));
        setLineError(null);
    };

    const handleRemoveLine = (index: number) => {
        setWasteLine((prev) => prev.filter((_, i) => i !== index));
    };

    const itemUnit = useMemo(() => {
        if (items.length === 0)
            return 'unit';
        return items.filter(item => item.id === currentLine.item_id)[0].unit;

    }, [currentLine]);
    return (
        <AppLayout
            breadcrumbs={[
                // { title: 'دشبورد', href: '/dashbaord' },
                // { title: 'فورموله ها', href: '/boms' },
                // { title: 'فورم', href: '/boms/create' },
            ]}
        >
            <div className="mt-t py-5">
                <section>
                    <div className="max-w-3xl mx-auto p-5">
                        <SectionTitle
                            title={'فورم ضایعات '}
                            description={production_order.reference_no + ' .اګر شما صفحه را ترک کردین شما دیګر نمی توانین این صفحه دوباره روجع کنید. پس احتیاط کنید'} />
                        <div className=" py-5">
                            <form onSubmit={handleWaste} name="boms" id="boms">
                                <div className="mt-5">
                                    <div className="grid gap-2 py-3 border-b">
                                        <Label htmlFor='reason' >دلایل ضایعات</Label>
                                        <textarea
                                            tabIndex={0}
                                            id='reasone'
                                            minLength={10}
                                            maxLength={300}
                                            required
                                            value={data.reason}
                                            onChange={(e) => setData('reason', e.target.value)}
                                            placeholder='دلایل ضایعات را اینجا نوشته کنید'
                                            className='p-3 rounded-md border'
                                        />
                                    </div>
                                </div>
                                <section className=" ITEMSection mt-8">

                                    <div>
                                        <h3 className='py-3 font-medium text-lg text-center text-accent'>اجناس ضایع شده را انتخاب کنید </h3>
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
                                                <InputError message={errors.wastes} className="mt-2" />

                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="quantity" className="flex justify-between">
                                                    <span>  مقدار  </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {currentLine.wasted_quantity} {getDariItemUnit(itemUnit)}
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="quantity"
                                                    type="number"
                                                    min={1}
                                                    // max={items[currentLine.item_id]}
                                                    value={currentLine.wasted_quantity}
                                                    onChange={(e) =>
                                                        setCurrentLine((prev) => ({
                                                            ...prev,
                                                            wasted_quantity: Number(e.target.value),
                                                        }))
                                                    }
                                                    placeholder="مقدار"
                                                    className="border p-1.5 rounded-md"
                                                />
                                                <InputError message={errors.wastes} className="mt-2" />

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
                                {wasteLine.length > 0 && <>
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
                                            {wasteLine.length > 0 && (
                                                wasteLine.map((waste, ind) =>
                                                    <TableRow key={ind}>
                                                        <TableCell className='text-center'>{ind}</TableCell>
                                                        <TableCell className='text-center'>{items.filter(item => item.id === waste.item_id)[0].name}</TableCell>
                                                        <TableCell className='text-center'>{waste.wasted_quantity}</TableCell>
                                                        <TableCell className='flex justify-center items-center'>
                                                            <DeleteIcon onClick={() => handleRemoveLine(ind)} className='text-destructive' />
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            )}
                                        </TableBody>
                                    </Table>
                                </>}

                                <div className="mt-6">
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        tabIndex={7}
                                        data-test="register-employee-button"
                                    >
                                        {processing && <Spinner />}
                                        ثبت کنید
                                    </Button>

                                    <div className="py-5">
                                        <Dialog>
                                            <DialogTrigger asChild className='w-full'>
                                                <Button
                                                    variant={'outline'}
                                                > ضایعات ندارد. بیرون شوید</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogTitle className='text-center'>ایا تولید تان ضایعات ندارد؟</DialogTitle>
                                                <DialogDescription className='text-end'>
                                                    اګر شما مطمئین هستین که تولید به نام {production_order.ordered_by} که دارای سفارش نمبر {production_order.reference_no} است هیچ نوع ضایعات ندارد

                                                </DialogDescription>
                                                <div className='flex justify-between'>
                                                    <Button variant={'secondary'} onClick={() => router.get('/factory/production-orders/' + production_order.id)}>بلی تولید یادوری شده ضایعات ندارد</Button>
                                                    <DialogClose asChild>
                                                        <Button>نخیر، تولید ضایعات دارد</Button>
                                                    </DialogClose>
                                                </div>

                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
};

export default Create;