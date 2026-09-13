import { SectionTitle } from '@/components/section-title';
import AppLayout from '@/layouts/app-layout';
import { useForm } from "@inertiajs/react";
import { FormEvent, useState } from "react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { Category, unitType } from '@/types/item';
import { getDariCategory, getUnitOfMeasurements } from '@/components/location-translator';

type ItemType = {
    name: string;
    item_type: 'product' | 'raw_material' | 'packing';
    unit: 'kg' | 'gr' | 'ltr' | 'packet' | 'carton' | 'bundle' | 'pair' | 'unit' | 'bag';
    price: number;
    category_id: number;
    // product type
    barcode: string;
    weight?: number;
    per_pack?: number;
    description?: string;
}

interface Props {
    categories: Category[];
}
const Create = ({ categories }: Props) => {


    const { data, setData, errors, reset, post, processing } = useForm<ItemType>({
        'name': '',
        'item_type': 'product',
        'unit': 'kg',
        'price': 1,
        'category_id': 1,
        // product related
        'barcode': '',
        'weight': 1,
        'per_pack': 1,
        'description': '',
    });
    const [isItemTypeProduct, setIsItemTypeProduct] = useState<'product' | 'raw_material' | 'packing'>('product');
    const handleItem = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/items');
    }
    return (
        <AppLayout breadcrumbs={[
            { title: 'کارخانه', href: '/factory/home' },
            { title: 'اجناس', href: '/items' },
            { title: 'جنس جدید', href: '/items/create' },

        ]}>
            <div className="section p-2 md:p-5">
                <section>
                    <div>
                        <SectionTitle title='فورم جنس جدید قبلا ثبت نشده' />
                        <div className="section">
                            <form onSubmit={handleItem}>
                                <div className="grid gap-6 grid-cols-2 md:grid-cols-3">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">نام جنس</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="name"
                                            name="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="نام جنس را اینجا ورود کنین"
                                        />
                                        <InputError
                                            message={errors.name}
                                            className="mt-2"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="code">کود جنس (خودکار)</Label>
                                        <Input
                                            id="code"
                                            type="text"
                                            readOnly
                                            tabIndex={2}
                                            value="بعد از ثبت خودکار ساخته می‌شود"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="price">نرخ اوسط</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            required
                                            autoFocus
                                            tabIndex={4}
                                            autoComplete="price"
                                            name="price"
                                            value={data.price}
                                            onChange={(e) => setData('price', Number(e.target.value))}
                                        />
                                        <InputError
                                            message={errors.price}
                                            className="mt-2"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="category_id">کتګوری</Label>
                                        <select name="category_id" id="category_id"
                                            onChange={(e) => setData('category_id', Number(e.target.value))}
                                            className="border rounded-md py-2"
                                        >
                                            <option value="">کتګوری را انتخاب کنین</option>
                                            {categories.map((category, ind) => <option key={ind} value={category.id}>{getDariCategory(category.name)}</option>)}

                                        </select>
                                        <InputError
                                            message={errors.category_id}
                                            className="mt-2"
                                        />
                                    </div>


                                    <div className="grid gap-2">
                                        <Label htmlFor="unit">واحد اندازه ګیری</Label>
                                        <select name="unit" id="unit"
                                            onChange={(e) => setData('unit', e.target.value as unitType)}
                                            className="border rounded-md py-2 "

                                        >
                                            <option value="">واحد اندازه ګیری انتخاب کنین</option>
                                            {/* <option value="kg">کیلو</option>
                                            <option value="ltr">لیتر</option>
                                            <option value="gr">ګرام</option> */}
                                            {getUnitOfMeasurements().map((unit) => <option value={unit.value} onChange={(e) => setData('unit', e.target.value as unitType)} className="text-center ">.................<span>{unit.label}..................</span></option>)}

                                        </select>
                                        <InputError
                                            message={errors.unit}
                                            className="mt-2"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="item_type">نوع جنس</Label>
                                        <select name="item_type" id="item_type"
                                            onChange={(e) => {
                                                setData('item_type', e.target.value as 'raw_material' | 'product' | 'packing');
                                                setIsItemTypeProduct(e.target.value as 'raw_material' | 'product' | 'packing');
                                            }}
                                            className="border rounded-md py-2"
                                        >
                                            <option value="">نوع جنس را انتخاب کنین</option>
                                            <option value="raw_material">مواد خام</option>
                                            <option value="product">جنس تیارشده</option>
                                            <option value="packing">پیکنګ</option>
                                        </select>
                                        <InputError
                                            message={errors.item_type}
                                            className="mt-2"
                                        />
                                    </div>

                                    {/* ===============================   Products related attributes  ============================================= */}

                                    {isItemTypeProduct === "product" && <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="weight">وزن یک جنس</Label>
                                            <Input
                                                id="weight"
                                                type="number"
                                                required
                                                autoFocus
                                                tabIndex={5}
                                                autoComplete="weight"
                                                name="weight"
                                                value={data.weight}
                                                onChange={(e) => setData('weight', Number(e.target.value))}

                                            />
                                            <InputError
                                                message={errors.weight}
                                                className="mt-2"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="per_pack">مقدار پر پیک</Label>
                                            <Input
                                                id="per_pack"
                                                type="text"
                                                required
                                                autoFocus
                                                tabIndex={6}
                                                autoComplete="per_pack"
                                                name="per_pack"
                                                value={data.per_pack}
                                                onChange={(e) => setData('per_pack', Number(e.target.value))}
                                            />
                                            <InputError
                                                message={errors.per_pack}
                                                className="mt-2"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="barcode">بارکد (خودکار)</Label>
                                            <Input
                                                id="barcode"
                                                type="text"
                                                autoFocus
                                                tabIndex={7}
                                                autoComplete="barcode"
                                                name="barcode"
                                                value={data.barcode}
                                                onChange={(e) => setData('barcode', e.target.value)}
                                                placeholder="در صورت خالی بودن خودکار ساخته می‌شود"
                                            />
                                            <InputError
                                                message={errors.barcode}
                                                className="mt-2"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="description">توضیحات بیشتر</Label>
                                            <textarea
                                                id="description"
                                                autoFocus
                                                tabIndex={8}
                                                name="description"
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                className="border rounded-md p-5 text-sm"
                                                placeholder="اګر توضیحات بیشتر نیاز است لطفا وارد نماید"
                                            />
                                            <InputError
                                                message={errors.description}
                                                className="mt-2"
                                            />
                                        </div>
                                    </>}
                                    <Button
                                        type="submit"
                                        className="mt-2 w-full"
                                        tabIndex={9}
                                        data-test="register-employee-button"
                                    >
                                        {processing && <Spinner />}
                                        ثبت کنید
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    )
}

export default Create