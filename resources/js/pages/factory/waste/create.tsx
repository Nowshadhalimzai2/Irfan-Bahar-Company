import { router, useForm } from '@inertiajs/react';
import { DeleteIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { getDariItemUnit } from '@/components/location-translator';
import { SectionTitle } from '@/components/section-title';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
import type { ProductionOrder } from '@/types';
import type { Item, ItemUnit } from '@/types/item';

interface Props {
    items: Item[];
    production_order: ProductionOrder;
}

type WasteLine = {
    production_order_id: number;
    item_id: number;
    item_unit_id: number;
    wasted_quantity: number;
};

type WasteForm = {
    reason: string;
    wastes: WasteLine[];
};

const WasteCreate = ({ items, production_order }: Props) => {
    const getUnits = (item?: Item): ItemUnit[] =>
        item?.units?.filter((unit) => unit.is_active) ??
        (item?.base_unit?.is_active ? [item.base_unit] : []);
    const firstItem = items[0];
    const [wasteLines, setWasteLines] = useState<WasteLine[]>([]);
    const [lineError, setLineError] = useState<string | null>(null);
    const [currentLine, setCurrentLine] = useState<WasteLine>({
        production_order_id: production_order.id,
        item_id: firstItem?.id ?? 0,
        item_unit_id: getUnits(firstItem)[0]?.id ?? 0,
        wasted_quantity: 1,
    });

    const { data, setData, errors, post, processing } = useForm<WasteForm>({
        reason: '',
        wastes: [],
    });

    useEffect(() => {
        setData('wastes', wasteLines);
    }, [setData, wasteLines]);

    const selectedItem = items.find((item) => item.id === currentLine.item_id);
    const selectedUnit = getUnits(selectedItem).find(
        (unit) => unit.id === currentLine.item_unit_id,
    );

    const handleAddLine = () => {
        if (
            !currentLine.item_id ||
            !currentLine.item_unit_id ||
            currentLine.wasted_quantity <= 0
        ) {
            return;
        }

        if (wasteLines.some((line) => line.item_id === currentLine.item_id)) {
            setLineError('این جنس قبلاً اضافه شده است');

            return;
        }

        setWasteLines((previous) => [...previous, currentLine]);
        setCurrentLine((previous) => ({
            ...previous,
            wasted_quantity: 1,
        }));
        setLineError(null);
    };

    const handleRemoveLine = (index: number) => {
        setWasteLines((previous) =>
            previous.filter((_, lineIndex) => lineIndex !== index),
        );
    };

    const handleWaste = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(`/factory/wastes/${production_order.id}`, {
            onSuccess: () => setWasteLines([]),
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                {
                    title: 'سفارشات تولید',
                    href: '/factory/production-orders',
                },
                {
                    title: production_order.reference_no,
                    href: `/factory/production-orders/${production_order.id}`,
                },
                {
                    title: 'ثبت ضایعات',
                    href: `/factory/wastes/${production_order.id}`,
                },
            ]}
        >
            <section className="py-5">
                <div className="mx-auto max-w-3xl p-5">
                    <SectionTitle
                        title="فورم ضایعات"
                        description={`سفارش ${production_order.reference_no}. مواد و واحد انتخاب‌شده به واحد پایه تبدیل و از موجودی کارخانه کاسته می‌شود.`}
                    />
                    <div className="py-5" dir="rtl">
                        <form onSubmit={handleWaste}>
                            <div className="grid gap-2 border-b py-3">
                                <Label htmlFor="reason">دلایل ضایعات</Label>
                                <textarea
                                    id="reason"
                                    maxLength={300}
                                    minLength={10}
                                    required
                                    value={data.reason}
                                    onChange={(event) =>
                                        setData('reason', event.target.value)
                                    }
                                    placeholder="دلایل ضایعات را اینجا نوشته کنید"
                                    className="rounded-md border p-3"
                                />
                                <InputError message={errors.reason} />
                            </div>

                            <section className="mt-8">
                                <h3 className="py-3 text-center text-lg font-medium text-accent">
                                    اجناس ضایع‌شده را انتخاب کنید
                                </h3>
                                {items.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                        <div className="grid gap-2">
                                            <Label htmlFor="item_id">
                                                مواد خام یا پیکنګ
                                            </Label>
                                            <select
                                                id="item_id"
                                                className="rounded-md border p-2"
                                                value={currentLine.item_id}
                                                onChange={(event) => {
                                                    const itemId = Number(
                                                        event.target.value,
                                                    );
                                                    const item = items.find(
                                                        (candidate) =>
                                                            candidate.id ===
                                                            itemId,
                                                    );
                                                    setCurrentLine(
                                                        (previous) => ({
                                                            ...previous,
                                                            item_id: itemId,
                                                            item_unit_id:
                                                                getUnits(
                                                                    item,
                                                                )[0]?.id ?? 0,
                                                            wasted_quantity: 1,
                                                        }),
                                                    );
                                                }}
                                            >
                                                {items.map((item) => (
                                                    <option
                                                        value={item.id}
                                                        key={item.id}
                                                    >
                                                        {item.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={
                                                    errors['wastes.0.item_id']
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="item_unit_id">
                                                واحد
                                            </Label>
                                            <select
                                                id="item_unit_id"
                                                className="rounded-md border p-2"
                                                value={currentLine.item_unit_id}
                                                onChange={(event) =>
                                                    setCurrentLine(
                                                        (previous) => ({
                                                            ...previous,
                                                            item_unit_id:
                                                                Number(
                                                                    event.target
                                                                        .value,
                                                                ),
                                                        }),
                                                    )
                                                }
                                            >
                                                {getUnits(selectedItem).map(
                                                    (unit) => (
                                                        <option
                                                            key={unit.id}
                                                            value={unit.id}
                                                        >
                                                            {unit.name}
                                                            {unit.symbol
                                                                ? ` (${unit.symbol})`
                                                                : ''}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            <InputError
                                                message={
                                                    errors[
                                                        'wastes.0.item_unit_id'
                                                    ]
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor="wasted_quantity"
                                                className="flex justify-between"
                                            >
                                                <span>مقدار</span>
                                                <span className="text-sm text-muted-foreground">
                                                    {getDariItemUnit(
                                                        selectedUnit?.symbol ??
                                                            selectedUnit?.name ??
                                                            selectedItem?.unit ??
                                                            'unit',
                                                    )}
                                                </span>
                                            </Label>
                                            <Input
                                                id="wasted_quantity"
                                                type="number"
                                                min={0.001}
                                                step={0.001}
                                                dir="ltr"
                                                value={
                                                    currentLine.wasted_quantity
                                                }
                                                onChange={(event) =>
                                                    setCurrentLine(
                                                        (previous) => ({
                                                            ...previous,
                                                            wasted_quantity:
                                                                Number(
                                                                    event.target
                                                                        .value,
                                                                ),
                                                        }),
                                                    )
                                                }
                                                placeholder="مقدار"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="rounded-md bg-muted p-4 text-center text-sm text-muted-foreground">
                                        برای این سفارش مواد قابل انتخاب وجود
                                        ندارد.
                                    </p>
                                )}

                                <Button
                                    type="button"
                                    className="mt-4 w-full"
                                    variant="secondary"
                                    disabled={items.length === 0}
                                    onClick={handleAddLine}
                                >
                                    اضافه کردن جنس
                                </Button>
                                {lineError && (
                                    <div className="mt-2">
                                        <InputError message={lineError} />
                                    </div>
                                )}
                                <InputError message={errors.wastes} />
                            </section>

                            {wasteLines.length > 0 && (
                                <>
                                    <h3 className="mt-3 p-3 text-center text-xl font-medium text-accent">
                                        لیست مواد خام
                                    </h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-center">
                                                    شماره
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    کود جنس
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    جنس
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    مقدار
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    حذف
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {wasteLines.map((waste, index) => {
                                                const item = items.find(
                                                    (candidate) =>
                                                        candidate.id ===
                                                        waste.item_id,
                                                );
                                                const unit = getUnits(
                                                    item,
                                                ).find(
                                                    (candidate) =>
                                                        candidate.id ===
                                                        waste.item_unit_id,
                                                );

                                                return (
                                                    <TableRow
                                                        key={waste.item_id}
                                                    >
                                                        <TableCell className="text-center">
                                                            {index + 1}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {item?.code ?? '-'}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {item?.name ?? '-'}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {
                                                                waste.wasted_quantity
                                                            }{' '}
                                                            {getDariItemUnit(
                                                                unit?.symbol ??
                                                                    unit?.name ??
                                                                    item?.unit ??
                                                                    'unit',
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <button
                                                                type="button"
                                                                aria-label="حذف جنس"
                                                                onClick={() =>
                                                                    handleRemoveLine(
                                                                        index,
                                                                    )
                                                                }
                                                            >
                                                                <DeleteIcon className="text-destructive" />
                                                            </button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </>
                            )}

                            <div className="mt-6">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={processing || items.length === 0}
                                >
                                    {processing && <Spinner />}
                                    ثبت ضایعات
                                </Button>
                                <div className="py-5">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full"
                                            >
                                                ضایعات ندارد. بیرون شوید
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogTitle className="text-center">
                                                آیا تولیدتان ضایعات ندارد؟
                                            </DialogTitle>
                                            <DialogDescription className="text-end">
                                                اگر مطمئن هستید که تولید سفارش{' '}
                                                {production_order.reference_no}{' '}
                                                هیچ نوع ضایعات ندارد، تأیید
                                                کنید.
                                            </DialogDescription>
                                            <div className="flex justify-between">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={() =>
                                                        router.get(
                                                            `/factory/production-orders/${production_order.id}`,
                                                        )
                                                    }
                                                >
                                                    بلی، ضایعات ندارد
                                                </Button>
                                                <DialogClose asChild>
                                                    <Button type="button">
                                                        خیر، ضایعات دارد
                                                    </Button>
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
        </AppLayout>
    );
};

export default WasteCreate;
