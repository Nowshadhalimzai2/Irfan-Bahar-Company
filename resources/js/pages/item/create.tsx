import { SectionTitle } from '@/components/section-title';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { Category, unitType } from '@/types/item';
import {
    getDariCategory,
    getUnitOfMeasurements,
} from '@/components/location-translator';

type UnitForm = {
    name: unitType | '';
    symbol: string;
    conversion_to_base: number;
    barcode: string;
    selling_price: number;
    purchase_price: number | null;
};

type ItemForm = {
    name: string;
    item_type: 'product' | 'raw_material' | 'packing';
    category_id: number;
    base_unit: UnitForm;
    additional_units: UnitForm[];
    weight: number;
    description: string;
};

interface Props {
    categories: Category[];
}

const emptyUnit = (): UnitForm => ({
    name: '',
    symbol: '',
    conversion_to_base: 1,
    barcode: '',
    selling_price: 0,
    purchase_price: null,
});

const Create = ({ categories }: Props) => {
    const { data, setData, errors, post, processing } = useForm<ItemForm>({
        name: '',
        item_type: 'product',
        category_id: categories[0]?.id ?? 0,
        base_unit: {
            ...emptyUnit(),
            name: 'kg',
            conversion_to_base: 1,
        },
        additional_units: [],
        weight: 1,
        description: '',
    });

    const unitOptions = getUnitOfMeasurements();

    const updateBaseUnit = <K extends keyof UnitForm>(
        field: K,
        value: UnitForm[K],
    ) => {
        setData('base_unit', {
            ...data.base_unit,
            [field]: value,
        });
    };

    const updateAdditionalUnit = <K extends keyof UnitForm>(
        index: number,
        field: K,
        value: UnitForm[K],
    ) => {
        setData(
            'additional_units',
            data.additional_units.map((unit, unitIndex) =>
                unitIndex === index ? { ...unit, [field]: value } : unit,
            ),
        );
    };

    const addAdditionalUnit = () => {
        setData('additional_units', [...data.additional_units, emptyUnit()]);
    };

    const removeAdditionalUnit = (index: number) => {
        setData(
            'additional_units',
            data.additional_units.filter((_, unitIndex) => unitIndex !== index),
        );
    };

    const handleItem = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/items');
    };

    const errorFor = (key: string) =>
        (errors as Record<string, string | undefined>)[key];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'اجناس', href: '/items' },
                { title: 'جنس جدید', href: '/items/create' },
            ]}
        >
            <div className="section p-2 md:p-5">
                <section>
                    <SectionTitle title="فورم جنس جدید قبلا ثبت نشده" />

                    <div className="section" dir="rtl">
                        <form onSubmit={handleItem}>
                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">نام جنس</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        required
                                        autoFocus
                                        value={data.name}
                                        onChange={(event) =>
                                            setData('name', event.target.value)
                                        }
                                        placeholder="نام جنس را اینجا وارد کنین"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="category_id">کتګوری</Label>
                                    <select
                                        name="category_id"
                                        id="category_id"
                                        required
                                        value={data.category_id}
                                        onChange={(event) =>
                                            setData(
                                                'category_id',
                                                Number(event.target.value),
                                            )
                                        }
                                        className="rounded-md border py-2"
                                    >
                                        <option value="">
                                            کتګوری را انتخاب کنین
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

                                <div className="grid gap-2">
                                    <Label htmlFor="item_type">نوع جنس</Label>
                                    <select
                                        name="item_type"
                                        id="item_type"
                                        required
                                        value={data.item_type}
                                        onChange={(event) =>
                                            setData(
                                                'item_type',
                                                event.target
                                                    .value as ItemForm['item_type'],
                                            )
                                        }
                                        className="rounded-md border py-2"
                                    >
                                        <option value="raw_material">
                                            مواد خام
                                        </option>
                                        <option value="product">محصول</option>
                                        <option value="packing">پیکنګ</option>
                                    </select>
                                    <InputError message={errors.item_type} />
                                </div>
                            </div>

                            <div className="mt-8 rounded-xl border p-4">
                                <div className="mb-4">
                                    <h2 className="font-semibold">
                                        واحد اصلی جنس
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        موجودی جنس بر اساس این واحد ذخیره
                                        می‌شود.
                                    </p>
                                </div>

                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="grid gap-2">
                                        <Label htmlFor="base_unit_name">
                                            نام واحد اصلی
                                        </Label>
                                        <select
                                            id="base_unit_name"
                                            required
                                            value={data.base_unit.name}
                                            onChange={(event) =>
                                                updateBaseUnit(
                                                    'name',
                                                    event.target
                                                        .value as UnitForm['name'],
                                                )
                                            }
                                            className="rounded-md border py-2"
                                        >
                                            <option value="">
                                                واحد را انتخاب کنین
                                            </option>
                                            {unitOptions.map((unit) => (
                                                <option
                                                    key={unit.value}
                                                    value={unit.value}
                                                >
                                                    {unit.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errorFor('base_unit.name')}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="base_unit_symbol">
                                            سمبول
                                        </Label>
                                        <Input
                                            id="base_unit_symbol"
                                            value={data.base_unit.symbol}
                                            onChange={(event) =>
                                                updateBaseUnit(
                                                    'symbol',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="مثلاً kg"
                                        />
                                        <InputError
                                            message={errorFor(
                                                'base_unit.symbol',
                                            )}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="base_unit_conversion">
                                            تبدیل به واحد اصلی
                                        </Label>
                                        <Input
                                            id="base_unit_conversion"
                                            type="number"
                                            value={1}
                                            readOnly
                                            disabled
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="base_unit_selling_price">
                                            نرخ فروش
                                        </Label>
                                        <Input
                                            id="base_unit_selling_price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            required
                                            value={data.base_unit.selling_price}
                                            onChange={(event) =>
                                                updateBaseUnit(
                                                    'selling_price',
                                                    Number(event.target.value),
                                                )
                                            }
                                        />
                                        <InputError
                                            message={errorFor(
                                                'base_unit.selling_price',
                                            )}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="base_unit_purchase_price">
                                            نرخ خرید
                                        </Label>
                                        <Input
                                            id="base_unit_purchase_price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={
                                                data.base_unit.purchase_price ??
                                                ''
                                            }
                                            onChange={(event) =>
                                                updateBaseUnit(
                                                    'purchase_price',
                                                    event.target.value === ''
                                                        ? null
                                                        : Number(
                                                            event.target
                                                                .value,
                                                        ),
                                                )
                                            }
                                        />
                                        <InputError
                                            message={errorFor(
                                                'base_unit.purchase_price',
                                            )}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="base_unit_barcode">
                                            بارکد
                                        </Label>
                                        <Input
                                            id="base_unit_barcode"
                                            value={data.base_unit.barcode}
                                            onChange={(event) =>
                                                updateBaseUnit(
                                                    'barcode',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="در صورت خالی بودن خودکار ساخته می‌شود"
                                        />
                                        <InputError
                                            message={errorFor(
                                                'base_unit.barcode',
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 rounded-xl border p-4">
                                <div className="mb-4 flex items-center justify-between gap-4">
                                    <div>
                                        <h2 className="font-semibold">
                                            واحدهای اضافی فروش
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            مثلاً هر کارتن برابر ۲۴ دانه.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addAdditionalUnit}
                                    >
                                        افزودن واحد
                                    </Button>
                                </div>

                                {data.additional_units.length === 0 && (
                                    <p className="rounded-md bg-muted p-3 text-sm">
                                        هنوز واحد اضافی ثبت نشده است.
                                    </p>
                                )}

                                <div className="space-y-4">
                                    {data.additional_units.map(
                                        (unit, index) => (
                                            <div
                                                key={index}
                                                className="rounded-lg border bg-muted/20 p-4"
                                            >
                                                <div className="mb-4 flex items-center justify-between">
                                                    <h3 className="font-medium">
                                                        واحد شماره {index + 1}
                                                    </h3>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            removeAdditionalUnit(
                                                                index,
                                                            )
                                                        }
                                                    >
                                                        حذف
                                                    </Button>
                                                </div>

                                                <div className="grid gap-6 md:grid-cols-3">
                                                    <div className="grid gap-2">
                                                        <Label
                                                            htmlFor={
                                                                'unit_name_' +
                                                                index
                                                            }
                                                        >
                                                            نام واحد
                                                        </Label>
                                                        <select
                                                            id={
                                                                'unit_name_' +
                                                                index
                                                            }
                                                            required
                                                            value={unit.name}
                                                            onChange={(event) =>
                                                                updateAdditionalUnit(
                                                                    index,
                                                                    'name',
                                                                    event.target
                                                                        .value as UnitForm['name'],
                                                                )
                                                            }
                                                            className="rounded-md border py-2"
                                                        >
                                                            <option value="">
                                                                واحد را انتخاب
                                                                کنین
                                                            </option>
                                                            {unitOptions.map(
                                                                (option) => (
                                                                    <option
                                                                        key={
                                                                            option.value
                                                                        }
                                                                        value={
                                                                            option.value
                                                                        }
                                                                    >
                                                                        {
                                                                            option.label
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                        <InputError
                                                            message={errorFor(
                                                                'additional_units.' +
                                                                index +
                                                                '.name',
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label
                                                            htmlFor={
                                                                'unit_symbol_' +
                                                                index
                                                            }
                                                        >
                                                            سمبول
                                                        </Label>
                                                        <Input
                                                            id={
                                                                'unit_symbol_' +
                                                                index
                                                            }
                                                            value={unit.symbol}
                                                            onChange={(event) =>
                                                                updateAdditionalUnit(
                                                                    index,
                                                                    'symbol',
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={errorFor(
                                                                'additional_units.' +
                                                                index +
                                                                '.symbol',
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label
                                                            htmlFor={
                                                                'unit_conversion_' +
                                                                index
                                                            }
                                                        >
                                                            چند واحد اصلی؟
                                                        </Label>
                                                        <Input
                                                            id={
                                                                'unit_conversion_' +
                                                                index
                                                            }
                                                            type="number"
                                                            min="0.000001"
                                                            step="0.000001"
                                                            required
                                                            value={
                                                                unit.conversion_to_base
                                                            }
                                                            onChange={(event) =>
                                                                updateAdditionalUnit(
                                                                    index,
                                                                    'conversion_to_base',
                                                                    Number(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    ),
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={errorFor(
                                                                'additional_units.' +
                                                                index +
                                                                '.conversion_to_base',
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label
                                                            htmlFor={
                                                                'unit_selling_price_' +
                                                                index
                                                            }
                                                        >
                                                            نرخ فروش
                                                        </Label>
                                                        <Input
                                                            id={
                                                                'unit_selling_price_' +
                                                                index
                                                            }
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            required
                                                            value={
                                                                unit.selling_price
                                                            }
                                                            onChange={(event) =>
                                                                updateAdditionalUnit(
                                                                    index,
                                                                    'selling_price',
                                                                    Number(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    ),
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={errorFor(
                                                                'additional_units.' +
                                                                index +
                                                                '.selling_price',
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label
                                                            htmlFor={
                                                                'unit_purchase_price_' +
                                                                index
                                                            }
                                                        >
                                                            نرخ خرید
                                                        </Label>
                                                        <Input
                                                            id={
                                                                'unit_purchase_price_' +
                                                                index
                                                            }
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={
                                                                unit.purchase_price ??
                                                                ''
                                                            }
                                                            onChange={(event) =>
                                                                updateAdditionalUnit(
                                                                    index,
                                                                    'purchase_price',
                                                                    event.target
                                                                        .value ===
                                                                        ''
                                                                        ? null
                                                                        : Number(
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={errorFor(
                                                                'additional_units.' +
                                                                index +
                                                                '.purchase_price',
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label
                                                            htmlFor={
                                                                'unit_barcode_' +
                                                                index
                                                            }
                                                        >
                                                            بارکد
                                                        </Label>
                                                        <Input
                                                            id={
                                                                'unit_barcode_' +
                                                                index
                                                            }
                                                            value={unit.barcode}
                                                            placeholder="در صورت خالی بودن خودکار ساخته می‌شود"
                                                            onChange={(event) =>
                                                                updateAdditionalUnit(
                                                                    index,
                                                                    'barcode',
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={errorFor(
                                                                'additional_units.' +
                                                                index +
                                                                '.barcode',
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                                <InputError message={errors.additional_units} />
                            </div>

                            {data.item_type === 'product' && (
                                <div className="mt-8 rounded-xl border p-4">
                                    <h2 className="mb-4 font-semibold">
                                        مشخصات محصول
                                    </h2>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="weight">
                                                وزن محصول
                                            </Label>
                                            <Input
                                                id="weight"
                                                type="number"
                                                min="0.001"
                                                step="0.001"
                                                required
                                                value={data.weight}
                                                onChange={(event) =>
                                                    setData(
                                                        'weight',
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.weight}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="description">
                                                توضیحات بیشتر
                                            </Label>
                                            <textarea
                                                id="description"
                                                value={data.description}
                                                onChange={(event) =>
                                                    setData(
                                                        'description',
                                                        event.target.value,
                                                    )
                                                }
                                                className="min-h-24 rounded-md border p-3 text-sm"
                                            />
                                            <InputError
                                                message={errors.description}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button type="submit" className="mt-8 w-full">
                                {processing && <Spinner />}
                                ثبت کنید
                            </Button>
                        </form>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
};

export default Create;
