import InputError from '@/components/input-error';
import {
    getDariCategory,
    getUnitOfMeasurements,
} from '@/components/location-translator';
import PageHead from '@/components/page-head';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent, ReactNode } from 'react';
import { Package } from 'lucide-react';
import { Category, unitType } from '@/types/item';

type ItemTypeName = 'product' | 'raw_material' | 'packing';

type UnitForm = {
    id: number | null;
    name: unitType | '';
    symbol: string;
    conversion_to_base: number;
    barcode: string;
    selling_price: number;
    purchase_price: number | null;
    is_active: boolean;
};

type ItemForm = {
    name: string;
    item_type: ItemTypeName;
    category_id: number;
    base_unit: UnitForm;
    additional_units: UnitForm[];
    weight: number | '';
    description: string;
};

type ItemUnit = {
    id: number;
    name: string;
    symbol: string | null;
    conversion_to_base: number | string;
    barcode: string | null;
    selling_price: number | string;
    purchase_price: number | string | null;
    is_active: boolean;
};

type Item = {
    id: number;
    name: string;
    code: string | null;
    item_type: ItemTypeName;
    category_id: number;
    unit: unitType;
    sku: string;
    base_unit?: ItemUnit | null;
    units: ItemUnit[];
    product?: {
        weight: number | string | null;
        description: string | null;
    } | null;
};

interface Props {
    categories: Category[];
    item: Item;
}

const toUnitForm = (unit: ItemUnit, isBase = false): UnitForm => ({
    id: unit.id,
    name: unit.name as unitType,
    symbol: unit.symbol ?? '',
    conversion_to_base: isBase ? 1 : Number(unit.conversion_to_base),
    barcode: unit.barcode ?? '',
    selling_price: Number(unit.selling_price),
    purchase_price:
        unit.purchase_price === null ? null : Number(unit.purchase_price),
    is_active: isBase ? true : unit.is_active,
});

const Edit = ({ categories, item }: Props) => {
    const baseUnit =
        item.base_unit ??
        item.units.find((unit) => unit.name === item.unit) ??
        item.units[0];
    const additionalUnits = item.units
        .filter((unit) => unit.id !== baseUnit?.id)
        .map((unit) => toUnitForm(unit));

    const { data, setData, errors, put, processing } = useForm<ItemForm>({
        name: item.name,
        item_type: item.item_type,
        category_id: item.category_id,
        base_unit: baseUnit
            ? toUnitForm(baseUnit, true)
            : {
                  id: null,
                  name: item.unit,
                  symbol: '',
                  conversion_to_base: 1,
                  barcode: '',
                  selling_price: 0,
                  purchase_price: null,
                  is_active: true,
              },
        additional_units: additionalUnits,
        weight:
            item.product?.weight === null || item.product?.weight === undefined
                ? ''
                : Number(item.product.weight),
        description: item.product?.description ?? '',
    });

    const unitOptions = getUnitOfMeasurements();
    const isProduct = data.item_type === 'product';

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
        setData('additional_units', [
            ...data.additional_units,
            {
                id: null,
                name: '',
                symbol: '',
                conversion_to_base: 1,
                barcode: '',
                selling_price: 0,
                purchase_price: null,
                is_active: true,
            },
        ]);
    };

    const removeAdditionalUnit = (index: number) => {
        const unit = data.additional_units[index];

        if (unit.id === null) {
            setData(
                'additional_units',
                data.additional_units.filter(
                    (_, unitIndex) => unitIndex !== index,
                ),
            );
            return;
        }

        updateAdditionalUnit(index, 'is_active', false);
    };

    const errorFor = (key: string) =>
        (errors as Record<string, string | undefined>)[key];

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put('/items/' + item.id);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'اجناس', href: '/items' },
                { title: item.name, href: '/items/' + item.id },
                { title: 'ویرایش', href: '/items/' + item.id + '/edit' },
            ]}
        >
            <main
                className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8"
                dir="rtl"
            >
                <PageHead
                    HeadIcon={Package}
                    subtitle={
                        'کود: ' + (item.code ?? '—') + ' | SKU: ' + item.sku
                    }
                    title="ویرایش جنس"
                    description="معلومات جنس، واحدها و مشخصات محصول را به‌روزرسانی کنید."
                />

                <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                    <section className="rounded-2xl border bg-card p-5 shadow-sm">
                        <h2 className="mb-4 font-bold">اطلاعات اصلی</h2>
                        <div className="grid gap-5 md:grid-cols-3">
                            <Field label="نام جنس" error={errors.name}>
                                <Input
                                    required
                                    value={data.name}
                                    onChange={(event) =>
                                        setData('name', event.target.value)
                                    }
                                />
                            </Field>

                            <Field label="دسته‌بندی" error={errors.category_id}>
                                <select
                                    value={data.category_id}
                                    onChange={(event) =>
                                        setData(
                                            'category_id',
                                            Number(event.target.value),
                                        )
                                    }
                                    className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                                    required
                                >
                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {getDariCategory(category.name)}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="نوع جنس" error={errors.item_type}>
                                <select
                                    value={data.item_type}
                                    onChange={(event) =>
                                        setData(
                                            'item_type',
                                            event.target.value as ItemTypeName,
                                        )
                                    }
                                    className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                                    required
                                >
                                    <option value="raw_material">
                                        مواد خام
                                    </option>
                                    <option value="product">محصول</option>
                                    <option value="packing">پیکنګ</option>
                                </select>
                            </Field>
                        </div>
                    </section>

                    <UnitEditor
                        title="واحد اصلی جنس"
                        unit={data.base_unit}
                        unitOptions={unitOptions}
                        base
                        errorFor={errorFor}
                        onChange={updateBaseUnit}
                    />

                    <section className="rounded-2xl border bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="font-bold">
                                    واحدهای اضافی فروش
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    واحدهای موجود حذف نمی‌شوند؛ در صورت نیاز
                                    غیرفعال می‌شوند.
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

                        <div className="space-y-4">
                            {data.additional_units.map((unit, index) => (
                                <div
                                    key={unit.id ?? 'new-' + index}
                                    className={
                                        'rounded-lg border p-4 ' +
                                        (unit.is_active
                                            ? ''
                                            : 'bg-muted/40 opacity-75')
                                    }
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="font-medium">
                                            واحد شماره {index + 1}
                                            {!unit.is_active && (
                                                <span className="mr-2 text-xs text-destructive">
                                                    غیرفعال
                                                </span>
                                            )}
                                        </h3>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                if (unit.is_active) {
                                                    removeAdditionalUnit(index);
                                                } else {
                                                    updateAdditionalUnit(
                                                        index,
                                                        'is_active',
                                                        true,
                                                    );
                                                }
                                            }}
                                        >
                                            {unit.is_active
                                                ? 'غیرفعال‌سازی'
                                                : 'فعال‌سازی'}
                                        </Button>
                                    </div>

                                    <UnitEditor
                                        title=""
                                        unit={unit}
                                        unitOptions={unitOptions}
                                        errorFor={errorFor}
                                        index={index}
                                        onChange={(field, value) =>
                                            updateAdditionalUnit(
                                                index,
                                                field,
                                                value,
                                            )
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                        <InputError message={errors.additional_units} />
                    </section>

                    {isProduct && (
                        <section className="rounded-2xl border bg-card p-5 shadow-sm">
                            <h2 className="mb-4 font-bold">مشخصات محصول</h2>
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field label="وزن محصول" error={errors.weight}>
                                    <Input
                                        type="number"
                                        min="0.001"
                                        step="0.001"
                                        required
                                        value={data.weight}
                                        onChange={(event) =>
                                            setData(
                                                'weight',
                                                event.target.value === ''
                                                    ? ''
                                                    : Number(
                                                          event.target.value,
                                                      ),
                                            )
                                        }
                                    />
                                </Field>
                                <Field
                                    label="توضیحات بیشتر"
                                    error={errors.description}
                                >
                                    <textarea
                                        maxLength={255}
                                        value={data.description}
                                        onChange={(event) =>
                                            setData(
                                                'description',
                                                event.target.value,
                                            )
                                        }
                                        className="min-h-28 w-full rounded-md border bg-background p-3 text-sm"
                                    />
                                </Field>
                            </div>
                        </section>
                    )}

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="gap-2 sm:min-w-44"
                        >
                            {processing && <Spinner />}
                            ذخیره تغییرات
                        </Button>
                    </div>
                </form>
            </main>
        </AppLayout>
    );
};

type UnitEditorProps = {
    title: string;
    unit: UnitForm;
    unitOptions: ReturnType<typeof getUnitOfMeasurements>;
    base?: boolean;
    index?: number;
    errorFor: (key: string) => string | undefined;
    onChange: <K extends keyof UnitForm>(field: K, value: UnitForm[K]) => void;
};

const UnitEditor = ({
    title,
    unit,
    unitOptions,
    base = false,
    index,
    errorFor,
    onChange,
}: UnitEditorProps) => {
    const key = index === undefined ? 'base_unit' : 'additional_units.' + index;

    return (
        <section
            className={title ? 'rounded-2xl border bg-card p-5 shadow-sm' : ''}
        >
            {title && <h2 className="mb-4 font-bold">{title}</h2>}
            <div className="grid gap-5 md:grid-cols-3">
                <Field label="نام واحد" error={errorFor(key + '.name')}>
                    <select
                        value={unit.name}
                        onChange={(event) =>
                            onChange(
                                'name',
                                event.target.value as UnitForm['name'],
                            )
                        }
                        className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                        required
                    >
                        <option value="">واحد را انتخاب کنین</option>
                        {unitOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label="سمبول" error={errorFor(key + '.symbol')}>
                    <Input
                        value={unit.symbol}
                        onChange={(event) =>
                            onChange('symbol', event.target.value)
                        }
                    />
                </Field>

                <Field
                    label={base ? 'تبدیل به واحد اصلی' : 'چند واحد اصلی؟'}
                    error={errorFor(key + '.conversion_to_base')}
                >
                    <Input
                        type="number"
                        min={base ? '1' : '0.000001'}
                        step={base ? '1' : '0.000001'}
                        value={base ? 1 : unit.conversion_to_base}
                        readOnly={base}
                        disabled={base}
                        onChange={(event) =>
                            onChange(
                                'conversion_to_base',
                                Number(event.target.value),
                            )
                        }
                    />
                </Field>

                <Field
                    label="نرخ فروش"
                    error={errorFor(key + '.selling_price')}
                >
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={unit.selling_price}
                        onChange={(event) =>
                            onChange(
                                'selling_price',
                                Number(event.target.value),
                            )
                        }
                    />
                </Field>

                <Field
                    label="نرخ خرید"
                    error={errorFor(key + '.purchase_price')}
                >
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={unit.purchase_price ?? ''}
                        onChange={(event) =>
                            onChange(
                                'purchase_price',
                                event.target.value === ''
                                    ? null
                                    : Number(event.target.value),
                            )
                        }
                    />
                </Field>

                <Field label="بارکد" error={errorFor(key + '.barcode')}>
                    <Input
                        value={unit.barcode}
                        onChange={(event) =>
                            onChange('barcode', event.target.value)
                        }
                        placeholder="اختیاری"
                    />
                </Field>
            </div>
        </section>
    );
};

const Field = ({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        {children}
        <InputError message={error} />
    </div>
);

export default Edit;
