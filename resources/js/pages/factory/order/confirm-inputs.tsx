import { useForm } from '@inertiajs/react';
import { DeleteIcon, LockKeyholeOpen } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { getDariItemUnit } from '@/components/location-translator';
import PageHead from '@/components/page-head';
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
import type { ProductionOrder } from '@/types';
import type { Item } from '@/types/item';

interface Props {
    items: Item[];
    production_order: ProductionOrder;
    status: 'completed';
}

type OrderInput = {
    item_id: number;
    quantity_used: number;
};

type Order = {
    status: string;
    production_order_id: number;
    orderInputs: OrderInput[];
    doesItHaveWaste: boolean;
};

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
        production_order_id: production_order.id,
        status: status,
        orderInputs: [],
        doesItHaveWaste: false,
    });

    useEffect(() => {
        setData('orderInputs', OrderInput);
    }, [OrderInput, setData]);

    const handleProductionInput = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        put(`/factory/production-inputs/${production_order.id}`);
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
        const selectedItem = items.find(
            (item) => item.id === currentLine.item_id,
        );

        return (
            selectedItem?.base_unit?.symbol ??
            selectedItem?.base_unit?.name ??
            selectedItem?.unit ??
            'unit'
        );
    }, [currentLine.item_id, items]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'لیست سفارشات', href: '/factory/production-orders' },
                {
                    title: production_order.ordered_by,
                    href: '/factory/production-orders/' + production_order.id,
                },
                {
                    title: 'تائید مواد خام',
                    href: '/factory/production-orders/confirm-order-inputs',
                },
            ]}
        >
            <div className="px-1 md:px-3">
                <section>
                    <div className="mx-auto max-w-3xl p-5">
                        <PageHead
                            HeadIcon={LockKeyholeOpen}
                            subtitle={'سفارش ' + production_order.ordered_by}
                            title="تائید مواد خام"
                            description={`لطف نموده مواد خام که در سفارش بالا استفاده شده قبل از پیش رفتن یک بار تائید کنید. مرحله : 2/3`}
                            tone={'cyan'}
                        />
                        <div className="" dir="rtl">
                            <form
                                onSubmit={handleProductionInput}
                                name="boms"
                                id="boms"
                            >
                                <section className="ITEMSection mt-8">
                                    <div>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="item_id">
                                                    مواد خام یا پیکنګ
                                                </Label>
                                                <select
                                                    className="rounded-md border p-1.5"
                                                    name="item_id"
                                                    tabIndex={5}
                                                    value={currentLine.item_id}
                                                    onChange={(e) =>
                                                        setCurrentLine(
                                                            (prev) => ({
                                                                ...prev,
                                                                item_id: Number(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            }),
                                                        )
                                                    }
                                                >
                                                    {items.map((item) => (
                                                        <option
                                                            value={item.id}
                                                            key={item.id}
                                                        >
                                                            {item.name}{' '}
                                                            {item.code}
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError
                                                    message={errors.orderInputs}
                                                    className="mt-2"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor="quantity"
                                                    className="flex justify-between"
                                                >
                                                    <span> مقدار </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {
                                                            currentLine.quantity_used
                                                        }{' '}
                                                        {getDariItemUnit(
                                                            itemUnit,
                                                        )}
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="quantity"
                                                    type="number"
                                                    min={0.001}
                                                    step="0.001"
                                                    dir="ltr"
                                                    // max={items[currentLine.item_id]}
                                                    value={
                                                        currentLine.quantity_used
                                                    }
                                                    onChange={(e) =>
                                                        setCurrentLine(
                                                            (prev) => ({
                                                                ...prev,
                                                                quantity_used:
                                                                    Number(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                            }),
                                                        )
                                                    }
                                                    placeholder="مقدار"
                                                    className="rounded-md border p-1.5"
                                                />
                                                <InputError
                                                    message={errors.orderInputs}
                                                    className="mt-2"
                                                />
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
                                        {lineError && (
                                            <div className="mt-2">
                                                <InputError
                                                    message={lineError}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* ================================  RESULTS  =============================================== */}
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
                                                واحد پایه
                                            </TableHead>
                                            <TableHead className="text-center">
                                                حذف
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {OrderInput.length > 0 &&
                                            OrderInput.map((input, ind) => (
                                                <TableRow key={ind}>
                                                    <TableCell className="text-center">
                                                        {ind + 1}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {
                                                            items.filter(
                                                                (item) =>
                                                                    item.id ===
                                                                    input.item_id,
                                                            )[0].code
                                                        }
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {
                                                            items.filter(
                                                                (item) =>
                                                                    item.id ===
                                                                    input.item_id,
                                                            )[0].name
                                                        }
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {input.quantity_used}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {getDariItemUnit(
                                                            items.find(
                                                                (item) =>
                                                                    item.id ===
                                                                    input.item_id,
                                                            )?.base_unit
                                                                ?.symbol ??
                                                                items.find(
                                                                    (item) =>
                                                                        item.id ===
                                                                        input.item_id,
                                                                )?.base_unit
                                                                    ?.name ??
                                                                items.find(
                                                                    (item) =>
                                                                        item.id ===
                                                                        input.item_id,
                                                                )?.unit ??
                                                                'unit',
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="flex items-center justify-center">
                                                        <DeleteIcon
                                                            onClick={() =>
                                                                removeItem(ind)
                                                            }
                                                            className="text-destructive"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                                <div className="mt-6">
                                    <div
                                        className={`${data.doesItHaveWaste && 'border-primary text-primary'} group grid gap-2 overflow-hidden rounded-sm border px-3 py-2 transition-all hover:border-primary hover:shadow-md`}
                                    >
                                        <div className="flex items-center justify-start gap-3">
                                            <Input
                                                type="checkbox"
                                                onChange={(e) =>
                                                    setData(
                                                        'doesItHaveWaste',
                                                        e.target.checked,
                                                    )
                                                }
                                                className="size-5"
                                            />
                                            <div className="">
                                                <h4 className="text-sm font-medium group-hover:text-primary">
                                                    ایا تولید ضایعات دارد؟
                                                </h4>
                                                <small className="text-sm text-muted-foreground group-hover:text-primary/70">
                                                    اګر محصول تان ضایعات داده
                                                    لطفا این بکس را انتخاب کنید
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <div className="grid gap-2">
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            tabIndex={1}
                                            data-test="register-employee-button"
                                        >
                                            {processing && <Spinner />}
                                            {!data.doesItHaveWaste
                                                ? ' ثبت کنید'
                                                : 'پیش برین'}
                                        </Button>
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
