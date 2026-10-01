import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { getDariCategory, getDariItemUnit } from '@/components/location-translator';
import { Item, Product } from '@/types/item';
import { Check, Layers3, Pencil, Plus, Trash2 } from 'lucide-react';
import { SectionTitle } from '@/components/section-title';

interface Props {
    categories: Product[];
    items: Item[];
    bom: {
        id: number;
        formula_name: string;
        product_id: number;
        min_exp_qty: number;
        max_exp_qty: number;
        bom_lines: { item_id: number; required_quantity: number }[];
    };
}

type BOMLine = {
    item_id: number;
    required_quantity: number;
};

type BOMType = {
    formula_name: string;
    product_id: number;
    min_exp_qty: number;
    max_exp_qty: number;
    bomLines: BOMLine[];
};

const Edit = ({ categories, items, bom }: Props) => {
    const [bomLines, setBomLines] = useState<BOMLine[]>(bom.bom_lines ?? []);
    const [lineError, setLineError] = useState<string | null>(null);
    const [currentLine, setCurrentLine] = useState<BOMLine>({
        item_id: items[0]?.id ?? 0,
        required_quantity: 1,
    });

    const { data, setData, errors, put, processing } = useForm<BOMType>({
        formula_name: bom.formula_name,
        product_id: bom.product_id,
        min_exp_qty: bom.min_exp_qty,
        max_exp_qty: bom.max_exp_qty,
        bomLines: bom.bom_lines ?? [],
    });

    useEffect(() => {
        setData('bomLines', bomLines);
    }, [bomLines, setData]);

    const selectedItem = useMemo(
        () => items.find((item) => item.id === currentLine.item_id),
        [currentLine.item_id, items],
    );

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(`/boms/${bom.id}`);
    };

    const handleAddLine = () => {
        if (!currentLine.item_id || currentLine.required_quantity <= 0) {
            setLineError('جنس و مقدار معتبر را انتخاب کنید.');
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
        setBomLines((previous) => previous.filter((line) => line.item_id !== itemId));
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'فورموله‌ها', href: '/boms' },
                { title: bom.formula_name, href: `/boms/${bom.id}` },
                { title: 'ویرایش فورموله', href: `/boms/${bom.id}/edit` },
            ]}
        >
            <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8" dir="rtl">
                <div className="mb-6">
                    <p className="mb-2 text-sm font-medium text-primary">مدیریت تولید</p>
                    <SectionTitle
                        title={`ویرایش فورموله ${bom.formula_name}`}
                        description="مشخصات تولید و مواد مورد نیاز را به‌روزرسانی کنید."
                    />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                        <div className="flex items-center gap-3 border-b bg-linear-to-l from-primary/10 to-background p-5">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Pencil className="size-5" />
                            </div>
                            <div>
                                <h2 className="font-bold">اطلاعات تولید</h2>
                                <p className="text-sm text-muted-foreground">نام محصول و ظرفیت تولید فورموله.</p>
                            </div>
                        </div>

                        <div className="grid gap-5 p-5 md:grid-cols-2">
                            <Field label="نام فورموله" error={errors.formula_name}>
                                <Input
                                    id="formula_name"
                                    value={data.formula_name}
                                    onChange={(event) => setData('formula_name', event.target.value)}
                                    className="h-11"
                                    required
                                />
                            </Field>

                            <Field label="جنس تولید" error={errors.product_id}>
                                <select
                                    id="product_id"
                                    value={data.product_id}
                                    onChange={(event) => setData('product_id', Number(event.target.value))}
                                    className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                                    required
                                >
                                    <option value={0}>جنس تولید را انتخاب کنید</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {getDariCategory(category.name) ?? 'محصول نامشخص'}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="حداقل مقدار تولید" error={errors.min_exp_qty}>
                                <Input
                                    id="min_exp_qty"
                                    type="number"
                                    min={0.01}
                                    step="0.01"
                                    dir="ltr"
                                    value={data.min_exp_qty}
                                    onChange={(event) => setData('min_exp_qty', Number(event.target.value))}
                                    className="h-11"
                                    required
                                />
                            </Field>

                            <Field label="حداکثر مقدار تولید" error={errors.max_exp_qty}>
                                <Input
                                    id="max_exp_qty"
                                    type="number"
                                    min={data.min_exp_qty}
                                    step="0.01"
                                    dir="ltr"
                                    value={data.max_exp_qty}
                                    onChange={(event) => setData('max_exp_qty', Number(event.target.value))}
                                    className="h-11"
                                    required
                                />
                            </Field>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                        <div className="flex items-center justify-between gap-3 border-b p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                                    <Layers3 className="size-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold">مواد فورموله</h2>
                                    <p className="text-sm text-muted-foreground">مواد خام و بسته‌بندی را مدیریت کنید.</p>
                                </div>
                            </div>
                            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                {bomLines.length} مورد
                            </span>
                        </div>

                        <div className="grid gap-4 bg-muted/20 p-5 md:grid-cols-[1fr_180px_auto] md:items-end">
                            <Field label="جنس" error={errors.bomLines}>
                                <select
                                    id="item_id"
                                    value={currentLine.item_id}
                                    onChange={(event) => setCurrentLine((previous) => ({ ...previous, item_id: Number(event.target.value) }))}
                                    className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    {items.length === 0 && <option value={0}>جنسی موجود نیست</option>}
                                    {items.map((item) => (
                                        <option key={item.id} value={item.id}>{item.name} — {item.code}</option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="مقدار">
                                <div className="relative">
                                    <Input
                                        id="required_quantity"
                                        type="number"
                                        min={0.01}
                                        step="0.01"
                                        dir="ltr"
                                        value={currentLine.required_quantity}
                                        onChange={(event) => setCurrentLine((previous) => ({ ...previous, required_quantity: Number(event.target.value) }))}
                                        className="h-11 pl-16"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                        {getDariItemUnit(selectedItem?.unit ?? 'unit')}
                                    </span>
                                </div>
                            </Field>

                            <Button type="button" onClick={handleAddLine} className="h-11 gap-2">
                                <Plus className="size-4" />
                                افزودن
                            </Button>
                        </div>

                        {lineError && <div className="px-5 pt-3"><InputError message={lineError} /></div>}

                        <div className="p-5">
                            {bomLines.length === 0 ? (
                                <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                                    <Layers3 className="mx-auto mb-2 size-8 opacity-30" />
                                    <p className="text-sm">هیچ ماده‌ای در این فورموله ثبت نشده است.</p>
                                </div>
                            ) : (
                                <div className="divide-y overflow-hidden rounded-xl border">
                                    {bomLines.map((line, index) => {
                                        const item = items.find((candidate) => candidate.id === line.item_id);

                                        return (
                                            <div key={line.item_id} className="flex items-center justify-between gap-4 p-4 transition hover:bg-muted/30">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium">{item?.name ?? 'جنس نامشخص'}</p>
                                                        <p className="text-xs text-muted-foreground">{item?.code ?? 'بدون کد'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-4">
                                                    <span className="font-semibold">{line.required_quantity} {getDariItemUnit(item?.unit ?? 'unit')}</span>
                                                    <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:bg-red-50 hover:text-red-600" onClick={() => handleRemoveLine(line.item_id)} aria-label="حذف جنس">
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
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>انصراف</Button>
                        <Button type="submit" disabled={processing || bomLines.length === 0} className="gap-2 sm:min-w-44">
                            {processing ? <Spinner /> : <Check className="size-4" />}
                            ذخیره تغییرات
                        </Button>
                    </div>
                </form>
            </main>
        </AppLayout>
    );
};

const Field = ({ label, error, children }: { label: string; error?: string; children: ReactNode }) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        {children}
        <InputError message={error} />
    </div>
);

export default Edit;
