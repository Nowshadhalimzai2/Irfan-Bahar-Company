import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { Category, unitType } from '@/types/item';
import { getDariCategory, getUnitOfMeasurements } from '@/components/location-translator';
import PageHead from '@/components/page-head';
import { Package } from 'lucide-react';

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

    const handleItem = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(`/items/${item.id}`);
    };

    const isProduct = data.item_type === 'product';

    return (
        <AppLayout breadcrumbs={[
            { title: 'کارخانه', href: '/factory/home' },
            { title: 'اجناس', href: '/items' },
            { title: item.name, href: `/items/${item.id}` },
        ]}>
            <div className="p-2 md:p-5">
                <section>
                    <PageHead
                        HeadIcon={Package}
                        subtitle={item.name}
                        title="معلومات جنس"
                        description="شما میتانی در جنس تغیرات مناسب بیارین"
                    />

                    <div className="mt-5" dir="rtl">
                        <form onSubmit={handleItem}>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">نام جنس</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="name"
                                        value={data.name}
                                        onChange={(event) => setData('name', event.target.value)}
                                        placeholder="نام جنس را اینجا وارد کنین"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="code">کود جنس</Label>
                                    <Input id="code" type="text" readOnly value={item.code} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="price">نرخ فروش</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        min="0"
                                        step="any"
                                        required
                                        tabIndex={2}
                                        value={data.price}
                                        onChange={(event) => setData('price', Number(event.target.value))}
                                    />
                                    <InputError message={errors.price} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="category_id">کتګوری</Label>
                                    <select
                                        name="category_id"
                                        id="category_id"
                                        value={data.category_id}
                                        onChange={(event) => setData('category_id', Number(event.target.value))}
                                        className="rounded-md border py-2"
                                        required
                                    >
                                        <option value="">کتګوری را انتخاب کنین</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {getDariCategory(category.name)}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.category_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="unit">واحد اندازه ګیری</Label>
                                    <select
                                        name="unit"
                                        id="unit"
                                        value={data.unit}
                                        onChange={(event) => setData('unit', event.target.value as unitType)}
                                        className="rounded-md border py-2"
                                        required
                                    >
                                        <option value="">واحد اندازه ګیری انتخاب کنین</option>
                                        {getUnitOfMeasurements().map((unit) => (
                                            <option key={unit.value} value={unit.value}>
                                                {unit.label}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.unit} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="item_type">نوع جنس</Label>
                                    <select
                                        name="item_type"
                                        id="item_type"
                                        value={data.item_type}
                                        onChange={(event) => setData('item_type', event.target.value as ItemTypeName)}
                                        className="rounded-md border py-2"
                                        required
                                    >
                                        <option value="raw_material">مواد خام</option>
                                        <option value="product">محصول</option>
                                        <option value="packing">پیکنګ</option>
                                    </select>
                                    <InputError message={errors.item_type} />
                                </div>

                                {isProduct && (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="weight">وزن یک جنس</Label>
                                            <Input
                                                id="weight"
                                                type="number"
                                                min="0.000001"
                                                step="any"
                                                required
                                                value={data.weight}
                                                onChange={(event) => setData('weight', event.target.value === '' ? '' : Number(event.target.value))}
                                            />
                                            <InputError message={errors.weight} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="per_pack">مقدار پر پیک</Label>
                                            <Input
                                                id="per_pack"
                                                type="number"
                                                min="1"
                                                step="1"
                                                required
                                                value={data.per_pack}
                                                onChange={(event) => setData('per_pack', event.target.value === '' ? '' : Number(event.target.value))}
                                            />
                                            <InputError message={errors.per_pack} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="barcode">بارکد</Label>
                                            <Input
                                                id="barcode"
                                                dir='ltr'
                                                type="text"
                                                maxLength={16}
                                                value={data.barcode}
                                                onChange={(event) => setData('barcode', event.target.value)}
                                                placeholder="در صورت خالی بودن خودکار ساخته می‌شود"
                                            />
                                            <InputError message={errors.barcode} />
                                        </div>

                                        <div className="grid gap-2 md:col-span-2">
                                            <Label htmlFor="description">توضیحات بیشتر</Label>
                                            <textarea
                                                id="description"
                                                maxLength={255}
                                                value={data.description}
                                                onChange={(event) => setData('description', event.target.value)}
                                                className="min-h-24 rounded-md border p-3 text-sm"
                                                placeholder="اگر توضیحات بیشتر نیاز است لطفا وارد نمایید"
                                            />
                                            <InputError message={errors.description} />
                                        </div>
                                    </>
                                )}

                                <div className="md:col-span-3">
                                    <Button
                                        type="submit"
                                        className="mt-2 w-full"
                                        disabled={processing}
                                        data-test="edit-item-button"
                                    >
                                        {processing && <Spinner />}
                                        ثبت کنید
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
};

export default Edit;
