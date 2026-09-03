import { Link, useForm } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, ClipboardList, PackagePlus, Trash2, Warehouse } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import LocationTranslator, { getDariItemUnit } from '@/components/location-translator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import type { Currency, Location, Supplier } from '@/types';
import type { Item } from '@/types/item';

interface Props {
    suppliers: Supplier[];
    locations: Location[];
    currencies: Currency[];
    items: Item[];
}

type ReceiptLine = {
    item_id: number;
    quantity: number;
    unit_cost: number;
    currency_id: number;
}

type GoodReceiptType = {
    supplier_id: number;
    destination_location_id: number;
    received_at: string;
    notes: string;
    receiptLines: ReceiptLine[];
}

const Create = ({ suppliers, locations, currencies, items }: Props) => {
    const [receiptLines, setReceiptLines] = useState<ReceiptLine[]>([]);
    const [currentLine, setCurrentLine] = useState<ReceiptLine>(() => ({
        item_id: items[0]?.id ?? 0,
        quantity: 1,
        unit_cost: 10,
        currency_id: currencies[0]?.id ?? 0,
    }));

    const { data, setData, errors, post, processing } = useForm<GoodReceiptType>({
        supplier_id: suppliers[0]?.id ?? 0,
        destination_location_id: locations[0]?.id ?? 0,
        received_at: new Date().toISOString().slice(0, 10),
        notes: '',
        receiptLines,
    });

    useEffect(() => {
        setData('receiptLines', receiptLines);
    }, [receiptLines, setData]);

    const handleReceipt = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        post('/receipts', {
            onFinish: () => {
                setReceiptLines([]);
                setCurrentLine({
                    item_id: items[0]?.id ?? 0,
                    quantity: 1,
                    unit_cost: 0,
                    currency_id: currencies[0]?.id ?? 0,
                });
            },
        });
    };

    const handleAddLine = () => {

        if (!currentLine.item_id || !currentLine.currency_id || currentLine.quantity <= 0) {
            return;
        }

        if (receiptLines.some((line) => line.item_id === currentLine.item_id)) {
            return;
        }

        setReceiptLines((prev) => [...prev, currentLine]);
        setCurrentLine((prev) => ({
            ...prev,
            quantity: 1,
            unit_cost: 0,
        }));
    };

    const handleRemoveLine = (index: number) => {
        setReceiptLines((prev) => prev.filter((_, i) => i !== index));
    };

    const itemUnit = useMemo(() => {
        return items.find((item) => item.id === currentLine.item_id)?.unit ?? 'unit';

    }, [currentLine.item_id, items]);

    const totalQuantity = receiptLines.reduce((total, line) => total + line.quantity, 0);
    const totalValue = receiptLines.reduce((total, line) => total + line.quantity * line.unit_cost, 0);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'اموال امده', href: '/receipts' },
                { title: 'جنس نو را ثبت کنید', href: '/receipts/create' },
            ]}
        >
            <div className="min-h-screen space-y-6 bg-linear-to-b from-slate-50 via-background to-background p-3 md:p-6 dark:from-slate-950">
                <section>
                    <div className="mx-auto max-w-5xl">
                        <div className="relative mb-6 overflow-hidden rounded-2xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 md:px-10">
                            <div className="absolute -left-12 -top-16 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl" />
                            <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div className="space-y-3"><div className="flex items-center gap-2 text-sm font-medium text-amber-300"><Warehouse className="size-4" /> مدیریت موجودی ورودی</div><h1 className="text-3xl font-bold tracking-tight md:text-4xl">ثبت رسید جدید</h1><p className="text-sm text-slate-300">اطلاعات تأمین‌کننده و اجناس آمده را دقیق ثبت کنید.</p></div><ClipboardList className="size-8 text-amber-300" /></div>
                        </div>
                        <form onSubmit={handleReceipt} name="receipt" id="receipt" className="space-y-6">
                            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-7">
                                <div className="mb-6 flex items-center gap-3 border-b border-border/60 pb-4"><div className="rounded-xl bg-primary/10 p-2 text-primary"><ClipboardList className="size-5" /></div><div><h2 className="font-semibold">جزئیات رسید</h2><p className="text-xs text-muted-foreground">منبع خرید و محل ذخیره‌سازی را مشخص کنید.</p></div></div>
                                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 ">
                                    <div className="grid gap-2">
                                        <Label htmlFor="supplier_id">نام تأمین کننده <span className="text-destructive">*</span></Label>
                                        <select
                                            className="border p-1.5 rounded-md"
                                            name="supplier_id"
                                            tabIndex={1}
                                            value={data.supplier_id}
                                            onChange={(e) => setData('supplier_id', Number(e.target.value))}
                                        >
                                            <option value={0} className=" dark:text-accent-foreground dark:bg-secondary-foreground">تأمین کننده را انتخاب کنید</option>
                                            {suppliers.map((supplier) => (
                                                <option value={supplier.id} key={supplier.id} className=" dark:text-accent-foreground dark:bg-secondary-foreground">
                                                    {supplier.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.supplier_id} className="mt-2" />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="destination_location_id">موقعیت دریافت <span className="text-destructive">*</span></Label>
                                        <select
                                            className="border p-1.5 rounded-md"
                                            tabIndex={2}
                                            name="destination_location_id"
                                            value={data.destination_location_id}
                                            onChange={(e) =>
                                                setData('destination_location_id', Number(e.target.value))
                                            }
                                        >
                                            <option value={0} className='dark:text-accent-foreground'>موقعیت را انتخاب کنید</option>
                                            {locations.map((location) => (
                                                <option value={location.id} key={location.id} className=" dark:text-accent-foreground dark:bg-secondary-foreground">
                                                    {LocationTranslator(location.name)}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.destination_location_id} className="mt-2" />
                                    </div>

                                </div>
                                <div className="mt-5 grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2"><Label htmlFor="received_at">تاریخ دریافت <span className="text-destructive">*</span></Label><div className="relative"><CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="received_at" type="date" value={data.received_at} onChange={(e) => setData('received_at', e.target.value)} className="h-11 pr-10" /></div><InputError message={errors.received_at} /></div>
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

                                <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-7">
                                    <div>
                                        <div className="mb-6 flex items-center justify-between gap-3 border-b border-border/60 pb-4"><div className="flex items-center gap-2"><PackagePlus className="size-5 text-primary" /><div><h2 className="font-semibold">اقلام دریافتی</h2><p className="text-xs text-muted-foreground">قیمت و مقدار هر جنس را اضافه کنید.</p></div></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{receiptLines.length} قلم</span></div>
                                        <div className="grid gap-6   grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                            <div className="grid gap-2">
                                                    <Label htmlFor="currency_id">واحد پول <span className="text-destructive">*</span></Label>
                                                <select
                                                    className="border p-1.5 rounded-md"
                                                    name="currency_id"
                                                    tabIndex={4}
                                                    value={currentLine.currency_id}
                                                    onChange={(e) =>
                                                        setCurrentLine((prev) => ({
                                                            ...prev,
                                                            currency_id: Number(e.target.value),
                                                        }))
                                                    }
                                                >
                                                    <option value={0} className=" dark:text-accent-foreground dark:bg-secondary-foreground">پولی واحد را انتخاب نماید</option>
                                                    {currencies.map((currency) => (
                                                        <option value={currency.id} key={currency.id} className=" dark:text-accent-foreground dark:bg-secondary-foreground">
                                                            {currency.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError message={errors.receiptLines} className="mt-2" />

                                            </div>

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
                                                    {items.map((item) => (
                                                        <option value={item.id} key={item.id} className=" dark:text-accent-foreground dark:bg-secondary-foreground">
                                                            {item.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError message={errors.receiptLines} className="mt-2" />

                                            </div>

                                            <div className="grid gap-2">
                                                    <Label htmlFor="quantity" className="flex justify-between"><span>مقدار <span className="text-destructive">*</span></span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {currentLine.quantity}   {getDariItemUnit(itemUnit)}
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="quantity"
                                                    type="number"
                                                    min={1}
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
                                                <InputError message={errors.receiptLines} className="mt-2" />

                                            </div>

                                            <div className="grid gap-2">
                                                    <Label htmlFor="unit_cost">قیمت واحد <span className="text-destructive">*</span></Label>
                                                <Input
                                                    id="unit_cost"
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    value={currentLine.unit_cost}
                                                    onChange={(e) =>
                                                        setCurrentLine((prev) => ({
                                                            ...prev,
                                                            unit_cost: Number(e.target.value),
                                                        }))
                                                    }
                                                    placeholder="قیمت واحد"
                                                    className="border p-1.5 rounded-md"
                                                />
                                                <InputError message={errors.receiptLines} className="mt-2" />

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
                                                <PackagePlus className="size-4" /> اضافه کردن جنس
                                            </Button>
                                        </div>
                                    </div>
                                </section>



                                {/* ================================  RESULTS  =============================================== */}
                                {receiptLines.length > 0 && (
                                    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                                        <div className="flex items-center justify-between bg-muted/50 px-4 py-3 text-sm font-medium"><span>خلاصه رسید</span><span className="text-xs text-muted-foreground">{receiptLines.length} قلم</span></div>
                                        <div className="divide-y">
                                            {receiptLines.map((line, index) => (
                                                <div
                                                    key={`${line.item_id}-${index}`}
                                                    className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <div>
                                                            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                                                            <div className="rounded-lg border bg-background p-3">جنس: {items.find((item) => item.id === line.item_id)?.name || line.item_id}</div>
                                                            <div className="rounded-lg border bg-background p-3">پولی واحد: {currencies.find((cur) => cur.id === line.currency_id)?.name || line.currency_id}</div>
                                                            <div className="rounded-lg border bg-background p-3">مقدار: {line.quantity}</div>
                                                            <div className="rounded-lg border bg-background p-3">قیمت واحد: {line.unit_cost}</div>

                                                        </div>
                                                        <div className="p-3 text-end text-sm font-medium">مجموع این قلم: { (line.unit_cost * line.quantity).toLocaleString() }</div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        onClick={() => handleRemoveLine(index)}
                                                    >
                                                        <Trash2 className="size-4" /> حذف
                                                    </Button>
                                                </div>
                                            ))}
                                            <div className="flex flex-col gap-2 border-t border-border/60 p-4 text-sm sm:flex-row sm:justify-between">
                                                <span>{totalQuantity} جمله مقدار</span><strong>{totalValue.toLocaleString()} جمله قیمت</strong>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                    <Link href="/receipts" className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm hover:bg-muted">انصراف</Link>
                                    <Button
                                        type="submit"
                                        className="w-full gap-2 bg-slate-950 hover:bg-slate-800 sm:w-auto"
                                        tabIndex={7}
                                        data-test="register-employee-button"
                                    >
                                        {processing && <Spinner />}
                                        <CheckCircle2 className="size-4" /> ثبت رسید
                                    </Button>
                                </div>
                            </form>
                        </div>
                </section>
            </div>
        </AppLayout>
    );
};

export default Create;