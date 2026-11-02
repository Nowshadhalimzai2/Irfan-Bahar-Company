import { Link, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    ClipboardList,
    PackagePlus,
    Trash2,
    Warehouse,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import LocationTranslator, {
    getDariCurrency,
} from '@/components/location-translator';
import PersionDatePicker from '@/components/persion-date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { Currency, Location, Supplier } from '@/types';
import type { Item, ItemUnit } from '@/types/item';

interface Props {
    suppliers: Supplier[];
    locations: Location[];
    currencies: Currency[];
    items: Item[];
}

type ReceiptLine = {
    item_id: number;
    item_unit_id: number;
    quantity: number;
    unit_cost: number;
};

type GoodsReceiptForm = {
    supplier_id: number;
    destination_location_id: number;
    received_at: string;
    notes: string;
    currency_id: number;
    receiptLines: ReceiptLine[];
};

const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const getUnits = (item?: Item): ItemUnit[] => {
    if (!item) {
        return [];
    }

    if (item.units?.length) {
        return item.units.filter((unit) => unit.is_active);
    }

    return item.base_unit ? [item.base_unit] : [];
};

const Create = ({ suppliers, locations, currencies, items }: Props) => {
    const firstItem = items[0];
    const firstUnit = getUnits(firstItem)[0];
    const [receiptLines, setReceiptLines] = useState<ReceiptLine[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [currentLine, setCurrentLine] = useState<ReceiptLine>({
        item_id: firstItem?.id ?? 0,
        item_unit_id: firstUnit?.id ?? 0,
        quantity: 1,
        unit_cost: Number(firstUnit?.purchase_price ?? 0),
    });
    const { data, setData, errors, post, processing } =
        useForm<GoodsReceiptForm>({
            supplier_id: suppliers[0]?.id ?? 0,
            destination_location_id: locations[0]?.id ?? 0,
            received_at: formatDate(new Date()),
            notes: '',
            receiptLines: [],
            currency_id: currencies[0]?.id ?? 0,
        });

    useEffect(
        () => setData('receiptLines', receiptLines),
        [receiptLines, setData],
    );

    const selectedItem = useMemo(
        () => items.find((item) => item.id === currentLine.item_id),
        [currentLine.item_id, items],
    );
    const selectedUnit = useMemo(
        () =>
            getUnits(selectedItem).find(
                (unit) => unit.id === currentLine.item_unit_id,
            ),
        [currentLine.item_unit_id, selectedItem],
    );
    const totalValue = receiptLines.reduce(
        (total, line) => total + line.quantity * line.unit_cost,
        0,
    );
    const totalBaseQuantity = receiptLines.reduce((total, line) => {
        const unit = items
            .find((item) => item.id === line.item_id)
            ?.units?.find((candidate) => candidate.id === line.item_unit_id);

        return total + line.quantity * Number(unit?.conversion_to_base ?? 1);
    }, 0);

    const resetLine = (itemId = items[0]?.id ?? 0) => {
        const item = items.find((candidate) => candidate.id === itemId);
        const unit = getUnits(item)[0];
        setCurrentLine({
            item_id: itemId,
            item_unit_id: unit?.id ?? 0,
            quantity: 1,
            unit_cost: Number(unit?.purchase_price ?? 0),
        });
    };

    const handleReceipt = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/receipts', {
            onSuccess: () => {
                setReceiptLines([]);
                resetLine();
            },
        });
    };

    const handleItemChange = (itemId: number) => {
        const item = items.find((candidate) => candidate.id === itemId);
        const unit = getUnits(item)[0];
        setCurrentLine({
            item_id: itemId,
            item_unit_id: unit?.id ?? 0,
            quantity: 1,
            unit_cost: Number(unit?.purchase_price ?? 0),
        });
    };

    const handleUnitChange = (unitId: number) => {
        const unit = getUnits(selectedItem).find(
            (candidate) => candidate.id === unitId,
        );
        setCurrentLine((line) => ({
            ...line,
            item_unit_id: unitId,
            unit_cost: Number(unit?.purchase_price ?? line.unit_cost),
        }));
    };

    const handleAddLine = () => {
        if (
            !currentLine.item_id ||
            !currentLine.item_unit_id ||
            currentLine.quantity <= 0 ||
            currentLine.unit_cost <= 0
        ) {
            return;
        }

        if (
            receiptLines.some(
                (line) => line.item_unit_id === currentLine.item_unit_id,
            )
        ) {
            return;
        }

        setReceiptLines((lines) => [...lines, currentLine]);
        resetLine(currentLine.item_id);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'اموال خرید شد نو', href: '/receipts' },
                { title: 'خرید جنس نو', href: '/receipts/create' },
            ]}
        >
            <div className="min-h-screen space-y-6 bg-linear-to-b from-slate-50 via-background to-background p-3 md:p-6 dark:from-slate-950">
                <section className="mx-auto max-w-5xl">
                    <div className="relative mb-6 overflow-hidden rounded-2xl bg-slate-950 px-6 py-8 text-white shadow-xl md:px-10">
                        <div className="relative flex items-center justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-amber-300">
                                    <Warehouse className="size-4" /> مدیریت
                                    موجودی ورودی
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight">
                                    ثبت رسید جدید
                                </h1>
                                <p className="text-sm text-slate-300">
                                    مقدار را با واحد واقعی دریافت و قیمت همان
                                    واحد را ثبت کنید.
                                </p>
                            </div>
                            <ClipboardList className="size-8 text-amber-300" />
                        </div>
                    </div>

                    <form
                        onSubmit={handleReceipt}
                        className="space-y-6"
                        dir="rtl"
                    >
                        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-7">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="supplier_id">
                                        نام تأمین کننده{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <select
                                        id="supplier_id"
                                        className="rounded-md border p-2"
                                        value={data.supplier_id}
                                        onChange={(event) =>
                                            setData(
                                                'supplier_id',
                                                Number(event.target.value),
                                            )
                                        }
                                    >
                                        <option value={0}>
                                            تأمین کننده را انتخاب کنید
                                        </option>
                                        {suppliers.map((supplier) => (
                                            <option
                                                value={supplier.id}
                                                key={supplier.id}
                                            >
                                                {supplier.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.supplier_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="destination_location_id">
                                        موقعیت دریافت{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <select
                                        id="destination_location_id"
                                        className="rounded-md border p-2"
                                        value={data.destination_location_id}
                                        onChange={(event) =>
                                            setData(
                                                'destination_location_id',
                                                Number(event.target.value),
                                            )
                                        }
                                    >
                                        <option value={0}>
                                            موقعیت را انتخاب کنید
                                        </option>
                                        {locations.map((location) => (
                                            <option
                                                value={location.id}
                                                key={location.id}
                                            >
                                                {LocationTranslator(
                                                    location.name,
                                                )}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={errors.destination_location_id}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="currency_id">
                                        واحد پول{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <select
                                        id="currency_id"
                                        className="rounded-md border p-2"
                                        value={data.currency_id}
                                        onChange={(event) =>
                                            setData(
                                                'currency_id',
                                                Number(event.target.value),
                                            )
                                        }
                                    >
                                        <option value={0}>
                                            واحد پول را انتخاب کنید
                                        </option>
                                        {currencies.map((currency) => (
                                            <option
                                                value={currency.id}
                                                key={currency.id}
                                            >
                                                {getDariCurrency(currency.name)}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.currency_id} />
                                </div>
                                <div className="grid gap-2">
                                    <PersionDatePicker
                                        id="goods-receipt-date"
                                        initialDate={selectedDate ?? new Date()}
                                        type="date"
                                        label="تاریخ دریافت"
                                        value={selectedDate}
                                        onChange={(date) => {
                                            setSelectedDate(date);

                                            if (date) {
                                                setData(
                                                    'received_at',
                                                    formatDate(date),
                                                );
                                            }
                                        }}
                                    />
                                    <InputError message={errors.received_at} />
                                </div>
                            </div>
                            <div className="mt-5 grid gap-2">
                                <Label htmlFor="notes">یادداشت</Label>
                                <textarea
                                    id="notes"
                                    className="min-h-11 rounded-md border bg-transparent p-3 text-sm"
                                    value={data.notes}
                                    onChange={(event) =>
                                        setData('notes', event.target.value)
                                    }
                                    placeholder="نوت اختیاری است"
                                />
                                <InputError message={errors.notes} />
                            </div>
                        </section>

                        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-7">
                            <div className="mb-6 flex items-center justify-between border-b border-border/60 pb-4">
                                <div className="flex items-center gap-2">
                                    <PackagePlus className="size-5 text-primary" />
                                    <div>
                                        <h2 className="font-semibold">
                                            اقلام دریافتی
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            واحد دریافت و قیمت همان واحد را
                                            انتخاب کنید.
                                        </p>
                                    </div>
                                </div>
                                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                                    {receiptLines.length} قلم
                                </span>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="item_id">
                                        جنس{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <select
                                        id="item_id"
                                        className="rounded-md border p-2"
                                        value={currentLine.item_id}
                                        onChange={(event) =>
                                            handleItemChange(
                                                Number(event.target.value),
                                            )
                                        }
                                    >
                                        {items.map((item) => (
                                            <option
                                                value={item.id}
                                                key={item.id}
                                            >
                                                {item.name} ({item.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="item_unit_id">
                                        واحد دریافت{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <select
                                        id="item_unit_id"
                                        className="rounded-md border p-2"
                                        value={currentLine.item_unit_id}
                                        onChange={(event) =>
                                            handleUnitChange(
                                                Number(event.target.value),
                                            )
                                        }
                                    >
                                        {getUnits(selectedItem).map((unit) => (
                                            <option
                                                value={unit.id}
                                                key={unit.id}
                                            >
                                                {unit.name}
                                                {unit.symbol
                                                    ? ` (${unit.symbol})`
                                                    : ''}{' '}
                                                — ×{unit.conversion_to_base}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="quantity">
                                        مقدار{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min={0.001}
                                        step="0.001"
                                        dir="ltr"
                                        value={currentLine.quantity}
                                        onChange={(event) =>
                                            setCurrentLine((line) => ({
                                                ...line,
                                                quantity: Number(
                                                    event.target.value,
                                                ),
                                            }))
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="unit_cost">
                                        قیمت فی واحد{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="unit_cost"
                                        type="number"
                                        min={0.01}
                                        step="0.01"
                                        dir="ltr"
                                        value={currentLine.unit_cost}
                                        onChange={(event) =>
                                            setCurrentLine((line) => ({
                                                ...line,
                                                unit_cost: Number(
                                                    event.target.value,
                                                ),
                                            }))
                                        }
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        قیمت پایه تقریبی:{' '}
                                        {selectedUnit
                                            ? (
                                                  currentLine.unit_cost /
                                                  Number(
                                                      selectedUnit.conversion_to_base ||
                                                          1,
                                                  )
                                              ).toFixed(2)
                                            : '—'}
                                    </span>
                                </div>
                            </div>
                            <InputError
                                message={errors.receiptLines}
                                className="mt-3"
                            />
                            <Button
                                type="button"
                                className="mt-5 w-full"
                                variant="secondary"
                                onClick={handleAddLine}
                            >
                                <PackagePlus className="size-4" /> اضافه کردن
                                جنس
                            </Button>
                        </section>

                        {receiptLines.length > 0 && (
                            <section
                                className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
                                dir="rtl"
                            >
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-center">
                                                شماره
                                            </TableHead>
                                            <TableHead className="text-center">
                                                کود
                                            </TableHead>
                                            <TableHead className="text-center">
                                                جنس / واحد
                                            </TableHead>
                                            <TableHead className="text-center">
                                                مقدار
                                            </TableHead>
                                            <TableHead className="text-center">
                                                مقدار پایه
                                            </TableHead>
                                            <TableHead className="text-center">
                                                قیمت
                                            </TableHead>
                                            <TableHead className="text-center">
                                                جمله
                                            </TableHead>
                                            <TableHead className="text-center">
                                                حذف
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {receiptLines.map((line, index) => {
                                            const item = items.find(
                                                (candidate) =>
                                                    candidate.id ===
                                                    line.item_id,
                                            );
                                            const unit = getUnits(item).find(
                                                (candidate) =>
                                                    candidate.id ===
                                                    line.item_unit_id,
                                            );

                                            return (
                                                <TableRow
                                                    key={`${line.item_unit_id}-${index}`}
                                                >
                                                    <TableCell className="text-center">
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {unit?.code ??
                                                            item?.code}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {item?.name} /{' '}
                                                        {unit?.name}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {line.quantity}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {(
                                                            line.quantity *
                                                            Number(
                                                                unit?.conversion_to_base ??
                                                                    1,
                                                            )
                                                        ).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {line.unit_cost.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {(
                                                            line.quantity *
                                                            line.unit_cost
                                                        ).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <button
                                                            type="button"
                                                            aria-label="حذف جنس"
                                                            onClick={() =>
                                                                setReceiptLines(
                                                                    (lines) =>
                                                                        lines.filter(
                                                                            (
                                                                                _,
                                                                                lineIndex,
                                                                            ) =>
                                                                                lineIndex !==
                                                                                index,
                                                                        ),
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="mx-auto size-4 text-destructive" />
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                                <div className="flex flex-col gap-2 border-t border-border/60 pt-4 text-sm sm:flex-row sm:justify-between">
                                    <span>
                                        مقدار پایه مجموع:{' '}
                                        {totalBaseQuantity.toLocaleString()}
                                    </span>
                                    <strong>
                                        جمله قیمت: {totalValue.toLocaleString()}
                                    </strong>
                                </div>
                                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                    <Link
                                        href="/receipts"
                                        className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm hover:bg-muted"
                                    >
                                        انصراف
                                    </Link>
                                    <Button
                                        type="submit"
                                        className="gap-2 bg-slate-950 hover:bg-slate-800"
                                    >
                                        <Spinner
                                            className={
                                                processing ? '' : 'hidden'
                                            }
                                        />
                                        <CheckCircle2 className="size-4" /> ثبت
                                        رسید
                                    </Button>
                                </div>
                            </section>
                        )}
                    </form>
                </section>
            </div>
        </AppLayout>
    );
};

export default Create;
