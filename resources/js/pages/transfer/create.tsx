import { useForm, Link } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, CalendarDays, CheckCircle2, ClipboardList, PackageCheck, Route, Trash2, Truck } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import LocationTranslator, { getDariItemUnit } from '@/components/location-translator';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { InventoryBalance, Location } from '@/types';
import type { Item } from '@/types/item';

interface Props {
    locations: Location[];
    sourceLocations: Location[];
    items: Item[];
}

type TransferLine = {
    item_id: number;
    quantity: number;
    itemPrice: number;
}

type TransferType = {
    source_id: number;
    destination_id: number;
    transferred_at: string;
    notes: string;
    transferLines: TransferLine[];
}

const Create = ({ locations, items, sourceLocations }: Props) => {
    const [lineError, setLineError] = useState<string | null>(null);
    const [itemsInLoc, setItemInLoc] = useState<Item[]>(items);
    const [transferLine, setTransferLine] = useState<TransferLine[]>([]);
    const [currentLine, setCurrentLine] = useState<TransferLine>(() => ({
        item_id: items[0]?.id ?? 0,
        quantity: 1,
        itemPrice: items[0]?.default_sale_price ?? 1,
    }));

    const { data, setData, errors, post, processing } = useForm<TransferType>({
        'source_id': sourceLocations[0]?.id ?? 1,
        'destination_id': locations[1]?.id ?? 1,
        'transferred_at': new Date().toISOString().slice(0, 10),
        'notes': '',
        'transferLines': [],
    });

    useEffect(() => {
        setData('transferLines', transferLine);
    }, [transferLine, setData]);

    //  Fetch availible qty foreach item of each location to display on the screen for user
    //  to know about available stock
    const [balance, setBalance] = useState<InventoryBalance>();
    useEffect(() => {
        if (currentLine.item_id === 0) {
            return;
        }

        const getItemBalance = async () => {
            const response = await axios.get(`/transfers/${data.source_id}/items/${currentLine.item_id}`);

            if (response.status === 200) {
                setBalance(response.data);
                // console.log(response.data);
            } else {
                console.log('failed fetching Item data : ', response.statusText);
            }
        }
        getItemBalance();

    }, [currentLine.item_id, data.source_id])
    useEffect(() => {
        const getAvailableItems = async () => {
            const response = await axios.get(`/transfers/${data.source_id}/create`);

            if (response.status === 200) {
                const availableItems = response.data as Item[];
                setItemInLoc(availableItems);
                setCurrentLine({
                    item_id: availableItems[0]?.id ?? 0,
                    quantity: 1,
                    itemPrice: availableItems[0]?.default_sale_price
                });
            } else {
                console.log('failed fetching Item data : ', response.statusText);
            }
        }
        getAvailableItems();

    }, [data.source_id])

    const handleTransfer = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        post('/transfers', {
            onFinish: () => {
                setTransferLine([]);
                setCurrentLine({
                    item_id: items[0]?.id ?? 1,
                    quantity: 1,
                    itemPrice: items[0]?.default_sale_price,
                });
            },
        });
    };

    const handleAddLine = () => {

        if (!currentLine.item_id || currentLine.quantity <= 0) {
            return;
        }

        if (transferLine.some((line) => line.item_id === currentLine.item_id)) {
            setLineError('این جنس قبلاً به لیست اضافه شده است.');

            return;
        }

        const available = balance ? balance.quantity_on_hand - balance.reserved : 0;

        if (currentLine.quantity > available) {
            setLineError(`مقدار قابل انتقال فقط ${available} ${getDariItemUnit(itemUnit)} است.`);

            return;
        }

        setTransferLine((prev) => [...prev, currentLine]);
        setLineError(null);
        setCurrentLine((prev) => ({
            ...prev,
            quantity: 1,
        }));
    };

    const removeItem = (index: number) => {
        setTransferLine((prev) => prev.filter((_, i) => i !== index));
    };

    const itemUnit = itemsInLoc.find(item => item.id === currentLine.item_id)?.unit ?? 'unit';
    const totalQuantity = transferLine.reduce((total, line) => total + line.quantity, 0);
    const totalValue = transferLine.reduce((total, line) => total += line.quantity * items.filter(item=>item.id===line.item_id)[0].default_sale_price, 0);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'اجناس انتقال شده', href: '/receipts' },
                { title: 'انتقال جنس', href: '/transfers/create' },
            ]}
        >
            <div className="min-h-screen space-y-6 bg-linear-to-b from-slate-50 via-background to-background p-3 md:p-6 dark:from-slate-950">
                <div>
                    <div className="mx-auto max-w-5xl">
                        <div className="relative mb-6 overflow-hidden rounded-2xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 md:px-10">
                            <div className="absolute -left-12 -top-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
                            <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div className="space-y-3"><div className="flex items-center gap-2 text-sm font-medium text-cyan-300"><Truck className="size-4" /> مرکز جابه‌جایی اجناس</div><h1 className="text-3xl font-bold tracking-tight md:text-4xl">ثبت انتقال جدید</h1><p className="text-sm text-slate-300">مبدأ، مقصد و اجناس را بررسی کنید تا انتقال با موجودی واقعی هماهنگ باشد.</p></div><Route className="size-8 text-cyan-300" /></div>
                        </div>
                        <form onSubmit={handleTransfer} className="space-y-6" name="receipt" id="receipt" dir='rtl'>
                            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-7">
                                <div className="mb-6 flex items-center gap-3 border-b border-border/60 pb-4"><div className="rounded-xl bg-primary/10 p-2 text-primary"><ClipboardList className="size-5" /></div><div><h2 className="font-semibold">جزئیات انتقال</h2><p className="text-xs text-muted-foreground">مسیر و زمان جابه‌جایی را مشخص کنید.</p></div></div>
                                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 ">
                                    <div className="grid gap-2">
                                        <Label htmlFor="source_id">مرجع <span className="text-destructive">*</span></Label>
                                        <select
                                            className="border p-1.5 rounded-md"
                                            name="source_id"
                                            tabIndex={1}
                                            value={data.source_id}
                                            onChange={(e) => {
                                                setBalance(undefined);
                                                setData('source_id', Number(e.target.value));
                                            }}
                                            disabled={transferLine.length>0}
                                        >
                                            <option value={0}>از جای که میایه را انتخاب کنید</option>
                                            {sourceLocations.map((location) => (
                                                <option className={`${location.id === data.destination_id && 'bg-secondary'}`} value={location.id} key={location.id} disabled={location.id === data.destination_id}>
                                                    {LocationTranslator(location.name)}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.source_id} className="mt-2" />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="destination_id">مقصود <span className="text-destructive">*</span></Label>
                                        <select
                                            className="border p-1.5 rounded-md"
                                            tabIndex={2}
                                            name="destination_id"
                                            value={data.destination_id}
                                            onChange={(e) =>
                                                setData('destination_id', Number(e.target.value))
                                            }
                                        >
                                            <option value={0}>جای کی پایین می شود را انتخاب کنید</option>
                                            {locations.map((location) => (
                                                <option className={`${location.id === data.source_id && 'bg-secondary'}`} value={location.id} key={location.id} disabled={location.id === data.source_id}>
                                                    {LocationTranslator(location.name)}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.destination_id} className="mt-2" />
                                    </div>
                                </div>
                                <div className="mt-5 grid gap-2 md:grid-cols-2">
                                    <div className="grid gap-2"><Label htmlFor="transferred_at">تاریخ انتقال <span className="text-destructive">*</span></Label><div className="relative"><CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="transferred_at" type="date" value={data.transferred_at} onChange={(e) => setData('transferred_at', e.target.value)} className="h-11 pr-10" /></div><InputError message={errors.transferred_at} /></div>
                                    <div className="grid gap-2"><Label htmlFor="notes">یادداشت</Label>
                                        <textarea
                                            className="min-h-11 rounded-md border bg-transparent p-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                                            tabIndex={2}
                                            name="notes"
                                            value={data.notes}
                                            onChange={(e) =>
                                                setData('notes', e.target.value)
                                            }
                                            placeholder="نوت اختیاری است"
                                        />

                                        <InputError message={errors.notes} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            {balance?.id !== undefined ? <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-7">
                                <div>
                                    {/* ============ STOCK MONITOR ========== */}
                                    {balance && <div>
                                        <BalanceMonitor balance={balance} location={locations.find((location) => location.id === data.source_id) ?? locations[0]} />
                                    </div>}

                                    <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><PackageCheck className="size-5 text-primary" /><div><h2 className="font-semibold">اقلام انتقال</h2><p className="text-xs text-muted-foreground">فقط مقدار قابل انتقال از مرجع را وارد کنید.</p></div></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{transferLine.length} جنس</span></div>
                                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

                                        <div className="grid gap-2">
                                            <Label htmlFor="item_id">جنس <span className="text-destructive">*</span></Label>
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
                                                {itemsInLoc.map((item) => (
                                                    <option value={item.id} key={item.id}>
                                                        {item.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.transferLines} className="mt-2" />

                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="quantity" className="flex justify-between"><span>مقدار <span className="text-destructive">*</span></span>
                                                <span className="text-sm text-muted-foreground">
                                                    {currentLine.quantity} {getDariItemUnit(itemUnit)}
                                                </span>
                                            </Label>
                                            <Input
                                                id="quantity"
                                                type="number"
                                                min={1}
                                                // max={items[currentLine.item_id]}
                                                value={currentLine.quantity}
                                                onChange={(e) =>
                                                    setCurrentLine((prev) => ({
                                                        ...prev,
                                                        quantity: Number(e.target.value),
                                                    }))
                                                }
                                                placeholder="مقدار"
                                                className="border p-1.5 rounded-md"
                                            />
                                            <InputError message={errors.transferLines} className="mt-2" />

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
                                            <PackageCheck className="size-4" /> اضافه کردن جنس
                                        </Button>
                                    </div>
                                    {lineError && <InputError message={lineError} className="mt-3" />}
                                </div>
                            </section> : null}



                            {/* ================================  RESULTS  =============================================== */}
                            {transferLine.length > 0 && <>

                                <div dir='rtl' className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">خلاصه انتقال</h3><span className="text-sm text-muted-foreground">{transferLine.length} قلم</span></div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className='text-center'>شماره</TableHead>
                                                <TableHead className='text-center'>جنس</TableHead>
                                                <TableHead className='text-center'>مقدار</TableHead>
                                                <TableHead className='text-center'>قیمت</TableHead>
                                                <TableHead className='text-center'>جمله</TableHead>
                                                <TableHead className='text-center'>حذف</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transferLine.length > 0 && (
                                                transferLine.map((line, ind) =>
                                                    <TableRow key={ind}>
                                                        <TableCell className='text-center'>{ind + 1}</TableCell>
                                                        <TableCell className='text-center'>{itemsInLoc.find(item => item.id === line.item_id)?.name ?? line.item_id}</TableCell>
                                                        <TableCell className='text-center'>{line.quantity}</TableCell>
                                                        <TableCell className='text-center'>{items.filter(item=>item.id==line.item_id)[0].default_sale_price}</TableCell>
                                                        <TableCell className='text-center'>{items.filter(item=>item.id==line.item_id)[0].default_sale_price*line.quantity}</TableCell>
                                                        <TableCell className='flex justify-center items-center'>
                                                            <button type="button" aria-label="حذف جنس" onClick={() => removeItem(ind)}><Trash2 className='size-4 text-destructive' /></button>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            )}
                                        </TableBody>
                                    </Table>
                                    <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4 text-sm sm:flex-row sm:justify-between"><span>{totalQuantity} جمله مقدار</span><strong>{totalValue.toLocaleString()} جمله قیمت</strong></div>
                                </div>
                                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                    <Link href="/receipts" className={`${buttonVariants({ variant: 'outline' })} gap-2`}><ArrowLeft className="size-4" /> انصراف</Link>
                                    <Button
                                        type="submit"
                                        className="w-full gap-2 bg-slate-950 hover:bg-slate-800 sm:w-auto"
                                        tabIndex={7}
                                        data-test="register-employee-button"
                                    >
                                        {processing && <Spinner />}
                                        <CheckCircle2 className="size-4" /> ثبت انتقال
                                    </Button>
                                </div>

                            </>}                            </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

const BalanceMonitor = ({ balance, location }: { balance: InventoryBalance, location?: Location }) => {

    return (
        <div className='mb-5 grid grid-cols-2'>
            <div className='bg-secondary border  rounded-sm p-3 shadow-md backdrop-blur-sm'>
                <h5 className='text-center font-medium'>{balance.item?.name ?? 'نامشخص'}</h5>
                <div className='grid place-items-center text-primary grid-cols-2 gap-3 p-3'>
                    <li className='list-none font-semibold text-2xl '> {balance.quantity_on_hand} {getDariItemUnit(balance.item?.unit ?? '')}</li>
                    <li className='list-none font-medium text-muted-foreground text-sm'><span className=''>حفظ شده</span>{balance.reserved}</li>
                </div>
                <small className='text-center w-full text-muted-foreground text-sm'>موجوده مقدار در {location ? LocationTranslator(location.name) : 'موقعیت انتخاب نشده'}</small>
            </div>
        </div>
    )
}

export default Create;