import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { Category, unitType } from '@/types/item';
import { getDariCategory, getUnitOfMeasurements } from '@/components/location-translator';
import PageHead from '@/components/page-head';
import { Barcode, Boxes, Check, Package, Tag } from 'lucide-react';

type ItemTypeName = 'product' | 'raw_material' | 'packing';

type ItemForm = {
    name: string;
    item_type: ItemTypeName;
    unit: unitType;
    price: number;
    category_id: number;
    barcode: string;
    weight: number | '';
    per_pack: number | '';
    description: string;
};

type Product = {
    item_id: number;
    weight: number;
    per_pack: number;
    barcode: string | null;
    description: string | null;
};

type Item = {
    id: number;
    name: string;
    item_type: ItemTypeName;
    category_id: number;
    unit: unitType;
    default_sale_price: number;
    code: string;
    sku: string;
    product?: Product | null;
};

interface Props {
    categories: Category[];
    item: Item;
}

const Edit = ({ categories, item }: Props) => {
    const product = item.product ?? null;

    const { data, setData, errors, put, processing } = useForm<ItemForm>({
        name: item.name,
        item_type: item.item_type,
        unit: item.unit,
        price: item.default_sale_price,
        category_id: item.category_id,
        barcode: product?.barcode ?? '',
        weight: product?.weight ?? '',
        per_pack: product?.per_pack ?? '',
        description: product?.description ?? '',
    });

    const isProduct = data.item_type === 'product';

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(`/items/${item.id}`);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'اجناس', href: '/items' },
                { title: 'ویرایش', href: `/items/${item.id}/edit` },
            ]}
        >
            <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8" dir="rtl">
                <PageHead
                    HeadIcon={Package}
                    subtitle={`کد جنس: ${item.code}`}
                    title="ویرایش جنس"
                    description="معلومات جنس، قیمت و مشخصات محصول را به‌روزرسانی کنید."
                />

                <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                        <div className="flex items-center gap-3 border-b bg-linear-to-l from-primary/10 to-background p-5">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Tag className="size-5" />
                            </div>
                            <div>
                                <h2 className="font-bold">اطلاعات اصلی</h2>
                                <p className="text-sm text-muted-foreground">مشخصات عمومی و قیمت جنس.</p>
                            </div>
                        </div>

                        <div className="grid gap-5 p-5 md:grid-cols-2 lg:grid-cols-3">
                            <Field label="نام جنس" error={errors.name} className="lg:col-span-2">
                                <Input
                                    id="name"
                                    autoFocus
                                    required
                                    value={data.name}
                                    onChange={(event) => setData('name', event.target.value)}
                                    placeholder="نام جنس را وارد کنید"
                                    className="h-11"
                                />
                            </Field>

                            <Field label="کد جنس">
                                <div className="flex h-11 items-center gap-2 rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground">
                                    <Barcode className="size-4" />
                                    <code dir="ltr">{item.code}</code>
                                </div>
                            </Field>

                            <Field label="نرخ فروش" error={errors.price}>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    step="any"
                                    dir="ltr"
                                    required
                                    value={data.price}
                                    onChange={(event) => setData('price', Number(event.target.value))}
                                    className="h-11"
                                />
                            </Field>

                            <Field label="دسته‌بندی" error={errors.category_id}>
                                <select
                                    id="category_id"
                                    value={data.category_id}
                                    onChange={(event) => setData('category_id', Number(event.target.value))}
                                    className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                                    required
                                >
                                    <option value="">دسته‌بندی را انتخاب کنید</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {getDariCategory(category.name)}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="واحد اندازه‌گیری" error={errors.unit}>
                                <select
                                    id="unit"
                                    value={data.unit}
                                    onChange={(event) => setData('unit', event.target.value as unitType)}
                                    className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                                    required
                                >
                                    {getUnitOfMeasurements().map((unit) => (
                                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="نوع جنس" error={errors.item_type}>
                                <select
                                    id="item_type"
                                    value={data.item_type}
                                    onChange={(event) => setData('item_type', event.target.value as ItemTypeName)}
                                    className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                                    required
                                >
                                    <option value="raw_material">مواد خام</option>
                                    <option value="product">محصول</option>
                                    <option value="packing">پیکنگ</option>
                                </select>
                            </Field>
                        </div>
                    </section>

                    {isProduct && (
                        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                            <div className="flex items-center gap-3 border-b bg-linear-to-l from-cyan-500/10 to-background p-5">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                                    <Boxes className="size-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold">مشخصات محصول</h2>
                                    <p className="text-sm text-muted-foreground">اطلاعات بسته‌بندی و شناسایی محصول.</p>
                                </div>
                            </div>

                            <div className="grid gap-5 p-5 md:grid-cols-3">
                                <Field label="وزن هر جنس" error={errors.weight}>
                                    <Input
                                        id="weight"
                                        type="number"
                                        min="0.000001"
                                        step="any"
                                        dir="ltr"
                                        required
                                        value={data.weight}
                                        onChange={(event) => setData('weight', event.target.value === '' ? '' : Number(event.target.value))}
                                        className="h-11"
                                    />
                                </Field>

                                <Field label="مقدار در هر پیک" error={errors.per_pack}>
                                    <Input
                                        id="per_pack"
                                        type="number"
                                        min="1"
                                        step="1"
                                        dir="ltr"
                                        required
                                        value={data.per_pack}
                                        onChange={(event) => setData('per_pack', event.target.value === '' ? '' : Number(event.target.value))}
                                        className="h-11"
                                    />
                                </Field>

                                <Field label="بارکد" error={errors.barcode}>
                                    <Input
                                        id="barcode"
                                        dir="ltr"
                                        maxLength={16}
                                        value={data.barcode}
                                        onChange={(event) => setData('barcode', event.target.value)}
                                        placeholder="اختیاری"
                                        className="h-11"
                                    />
                                </Field>

                                <Field label="توضیحات بیشتر" error={errors.description} className="md:col-span-3">
                                    <textarea
                                        id="description"
                                        maxLength={255}
                                        value={data.description}
                                        onChange={(event) => setData('description', event.target.value)}
                                        className="min-h-28 w-full resize-y rounded-md border bg-background p-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
                                        placeholder="توضیحات اختیاری درباره محصول"
                                    />
                                </Field>
                            </div>
                        </section>
                    )}

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                            انصراف
                        </Button>
                        <Button type="submit" disabled={processing} className="gap-2 sm:min-w-44">
                            {processing ? <Spinner /> : <Check className="size-4" />}
                            ذخیره تغییرات
                        </Button>
                    </div>
                </form>
            </main>
        </AppLayout>
    );
};

const Field = ({
    label,
    error,
    className = '',
    children,
}: {
    label: string;
    error?: string;
    className?: string;
    children: ReactNode;
}) => (
    <div className={`space-y-2 ${className}`}>
        <Label>{label}</Label>
        {children}
        <InputError message={error} />
    </div>
);

export default Edit;
