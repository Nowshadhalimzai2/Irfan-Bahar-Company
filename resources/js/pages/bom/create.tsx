import { SectionTitle } from '@/components/section-title';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import {
    getDariCategory,
    getDariItemUnit,
} from '@/components/location-translator';
import { Category, Item } from '@/types/item';
import { Check, ClipboardList, Layers3, Plus, Trash2 } from 'lucide-react';

interface Props {
    categories: Category[];
    items: Item[];
}

type BOMLine = {
    item_id: number;
    item_unit_id: number;
    required_quantity: number;
};

type BOMType = {
    formula_name: string;
    category_id: number;
    min_exp_qty: number;
    max_exp_qty: number;
    bomLines: BOMLine[];
};

const Create = ({ categories, items }: Props) => {
    const defaultUnitId = (item?: Item) =>
        item?.units?.find((unit) => unit.id === item.base_unit_id)?.id ??
        item?.units?.[0]?.id ??
        0;
    const [bomLines, setBomLines] = useState<BOMLine[]>([]);
    const [lineError, setLineError] = useState<string | null>(null);
    const [currentLine, setCurrentLine] = useState<BOMLine>({
        item_id: items[0]?.id ?? 0,
        item_unit_id: defaultUnitId(items[0]),
        required_quantity: 1,
    });

    const { data, setData, errors, post, processing } = useForm<BOMType>({
        formula_name: '',
        category_id: categories[0]?.id ?? 0,
        min_exp_qty: 1,
        max_exp_qty: 1,
        bomLines: [],
    });

    useEffect(() => {
        setData('bomLines', bomLines);
    }, [bomLines, setData]);

    const selectedItem = useMemo(
        () => items.find((item) => item.id === currentLine.item_id),
        [currentLine.item_id, items],
    );
    const selectedUnit = selectedItem?.units?.find(
        (unit) => unit.id === currentLine.item_unit_id,
    );

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post('/boms', {
            onSuccess: () => {
                setBomLines([]);
                setCurrentLine({
                    item_id: items[0]?.id ?? 0,
                    item_unit_id: defaultUnitId(items[0]),
                    required_quantity: 1,
                });
            },
        });
    };

    const handleAddLine = () => {
        if (
            !currentLine.item_id ||
            !currentLine.item_unit_id ||
            currentLine.required_quantity <= 0
        ) {
            setLineError('جنس، واحد و مقدار معتبر را انتخاب کنید.');
            return;
        }

        if (bomLines.some((line) => line.item_id === currentLine.item_id)) {
            setLineError('این جنس قبلاً اضافه شده است.');
            return;
        }

        setBomLines((previous) => [...previous, currentLine]);
        setCurrentLine((previous) => ({ ...previous, required_quantity: 1 }));
        setLineError(null);
    };

    const handleRemoveLine = (itemId: number) => {
        setBomLines((previous) =>
            previous.filter((line) => line.item_id !== itemId),
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'فورموله‌ها', href: '/boms' },
                { title: 'فورموله جدید', href: '/boms/create' },
            ]}
        >
            <main
                className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8"
                dir="rtl"
            >
                <div className="mb-6">
                    <p className="mb-2 text-sm font-medium text-primary">
                        مدیریت تولید
                    </p>
                    <SectionTitle
                        title="ساخت فورموله جدید"
                        description="محصول، ظرفیت تولید و مواد مورد نیاز را تعریف کنید."
                    />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                        <div className="flex items-center gap-3 border-b bg-linear-to-l from-primary/10 to-background p-5">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <ClipboardList className="size-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-foreground">
                                    اطلاعات اصلی
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    مشخصات عمومی فورموله را وارد کنید.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-5 p-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="formula_name">
                                    نام فورموله
                                </Label>
                                <Input
                                    id="formula_name"
                                    value={data.formula_name}
                                    onChange={(event) =>
                                        setData(
                                            'formula_name',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="مثلاً: فورموله صابون مالیزیایی"
                                    className="h-11"
                                />
                                <InputError message={errors.formula_name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category_id">
                                    محصول / دسته‌بندی
                                </Label>
                                <select
                                    id="category_id"
                                    value={data.category_id}
                                    onChange={(event) =>
                                        setData(
                                            'category_id',
                                            Number(event.target.value),
                                        )
                                    }
                                    className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value={0}>
                                        دسته‌بندی را انتخاب کنید
                                    </option>
                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {getDariCategory(category.name)}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.category_id} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="min_exp_qty">
                                    حداقل مقدار تولید
                                </Label>
                                <Input
                                    id="min_exp_qty"
                                    type="number"
                                    dir="ltr"
                                    min={1}
                                    value={data.min_exp_qty}
                                    onChange={(event) =>
                                        setData(
                                            'min_exp_qty',
                                            Number(event.target.value),
                                        )
                                    }
                                    className="h-11"
                                />
                                <InputError message={errors.min_exp_qty} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="max_exp_qty">
                                    حداکثر مقدار تولید
                                </Label>
                                <Input
                                    id="max_exp_qty"
                                    type="number"
                                    dir="ltr"
                                    min={data.min_exp_qty}
                                    value={data.max_exp_qty}
                                    onChange={(event) =>
                                        setData(
                                            'max_exp_qty',
                                            Number(event.target.value),
                                        )
                                    }
                                    className="h-11"
                                />
                                <InputError message={errors.max_exp_qty} />
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                        <div className="flex items-center justify-between gap-3 border-b p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                                    <Layers3 className="size-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-foreground">
                                        مواد مورد نیاز
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        مواد خام و بسته‌بندی فورموله را اضافه
                                        کنید.
                                    </p>
                                </div>
                            </div>
                            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                {bomLines.length} مورد
                            </span>
                        </div>

                        <div className="grid gap-4 bg-muted/20 p-5 md:grid-cols-[1fr_160px_180px_auto] md:items-end">
                            <div className="space-y-2">
                                <Label htmlFor="item_id">جنس</Label>
                                <select
                                    id="item_id"
                                    value={currentLine.item_id}
                                    onChange={(event) => {
                                        const item = items.find(
                                            (candidate) =>
                                                candidate.id ===
                                                Number(event.target.value),
                                        );
                                        setCurrentLine((previous) => ({
                                            ...previous,
                                            item_id: item?.id ?? 0,
                                            item_unit_id: defaultUnitId(item),
                                        }));
                                    }}
                                    className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    {items.length === 0 && (
                                        <option value={0}>
                                            جنسی موجود نیست
                                        </option>
                                    )}
                                    {items.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} — {item.code}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="item_unit_id">واحد</Label>
                                <select
                                    id="item_unit_id"
                                    value={currentLine.item_unit_id}
                                    onChange={(event) =>
                                        setCurrentLine((previous) => ({
                                            ...previous,
                                            item_unit_id: Number(
                                                event.target.value,
                                            ),
                                        }))
                                    }
                                    disabled={!selectedItem?.units?.length}
                                    className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    {!selectedItem?.units?.length && (
                                        <option value={0}>
                                            واحدی موجود نیست
                                        </option>
                                    )}
                                    {selectedItem?.units?.map((unit) => (
                                        <option key={unit.id} value={unit.id}>
                                            {unit.name}
                                            {unit.symbol
                                                ? ` (${unit.symbol})`
                                                : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="required_quantity">مقدار</Label>
                                <div className="relative">
                                    <Input
                                        id="required_quantity"
                                        type="number"
                                        min={0.01}
                                        step="0.001"
                                        value={currentLine.required_quantity}
                                        onChange={(event) =>
                                            setCurrentLine((previous) => ({
                                                ...previous,
                                                required_quantity: Number(
                                                    event.target.value,
                                                ),
                                            }))
                                        }
                                        className="h-11 pl-16"
                                    />
                                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs text-muted-foreground">
                                        {getDariItemUnit(
                                            selectedUnit?.symbol ??
                                                selectedUnit?.name ??
                                                selectedItem?.unit ??
                                                'unit',
                                        )}
                                    </span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                onClick={handleAddLine}
                                className="h-11 gap-2"
                            >
                                <Plus className="size-4" />
                                افزودن
                            </Button>
                        </div>

                        {lineError && (
                            <div className="px-5 pt-3">
                                <InputError message={lineError} />
                            </div>
                        )}
                        <InputError
                            message={errors.bomLines}
                            className="px-5 pt-2"
                        />

                        <div className="p-5">
                            {bomLines.length === 0 ? (
                                <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                                    <Layers3 className="mx-auto mb-2 size-8 opacity-30" />
                                    <p className="text-sm">
                                        هنوز هیچ ماده‌ای اضافه نشده است.
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y overflow-hidden rounded-xl border">
                                    {bomLines.map((line, index) => {
                                        const item = items.find(
                                            (candidate) =>
                                                candidate.id === line.item_id,
                                        );

                                        return (
                                            <div
                                                key={line.item_id}
                                                className="flex items-center justify-between gap-4 p-4 transition hover:bg-muted/30"
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                        {index + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium text-foreground">
                                                            {item?.name ??
                                                                'جنس نامشخص'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item?.code ??
                                                                'بدون کد'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-4">
                                                    <span className="font-semibold text-foreground">
                                                        {line.required_quantity}{' '}
                                                        {getDariItemUnit(
                                                            item?.units?.find(
                                                                (unit) =>
                                                                    unit.id ===
                                                                    line.item_unit_id,
                                                            )?.symbol ??
                                                                item?.units?.find(
                                                                    (unit) =>
                                                                        unit.id ===
                                                                        line.item_unit_id,
                                                                )?.name ??
                                                                item?.unit ??
                                                                'unit',
                                                        )}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-muted-foreground hover:bg-red-50 hover:text-red-600"
                                                        onClick={() =>
                                                            handleRemoveLine(
                                                                line.item_id,
                                                            )
                                                        }
                                                        aria-label="حذف جنس"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                        >
                            انصراف
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || bomLines.length === 0}
                            className="gap-2 sm:min-w-44"
                        >
                            {processing ? (
                                <Spinner />
                            ) : (
                                <Check className="size-4" />
                            )}
                            ثبت فورموله
                        </Button>
                    </div>
                </form>
            </main>
        </AppLayout>
    );
};

export default Create;
