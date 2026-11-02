import {
    getDariCategory,
    getDariItemType,
    getDariItemUnit,
} from '@/components/location-translator';
import PageHead from '@/components/page-head';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Edit3, Package } from 'lucide-react';

type Unit = {
    id: number;
    name: string;
    symbol: string | null;
    conversion_to_base: number | string;
    barcode: string | null;
    code: string;
    selling_price: number | string;
    purchase_price: number | string | null;
    is_active: boolean;
};

type Item = {
    id: number;
    name: string;
    code: string | null;
    sku: string;
    item_type: 'product' | 'raw_material' | 'packing';
    unit: string;
    category?: { name: string } | null;
    base_unit?: Unit | null;
    units: Unit[];
    product?: {
        weight: number | string | null;
        description: string | null;
    } | null;
    inventory_balances?: {
        id: number;
        quantity_on_hand: number | string;
        reserved: number | string;
        location?: { name: string } | null;
    }[];
};

interface Props {
    item: Item;
}

const numberValue = (value: number | string | null | undefined) =>
    value === null || value === undefined ? 0 : Number(value);

const Show = ({ item }: Props) => {
    const baseUnit =
        item.base_unit ?? item.units.find((unit) => unit.name === item.unit);
    const activeUnits = item.units.filter((unit) => unit.is_active);
    const userRole = usePage().props.auth.role;
    const canModifyItems = ['admin', 'super_admin'].includes(userRole);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'اجناس', href: '/items' },
                { title: item.name, href: '/items/' + item.id },
            ]}
        >
            <main
                className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
                dir="rtl"
            >
                <PageHead
                    HeadIcon={Package}
                    subtitle={
                        'کود: ' + (item.code ?? '—') + ' | SKU: ' + item.sku
                    }
                    title={item.name}
                    description="جزئیات جنس، واحدهای قابل فروش و موجودی آن."
                />

                <div className="mt-6 flex flex-wrap gap-3">
                    {canModifyItems && (
                        <Link href={'/items/' + item.id + '/edit'}>
                            <Button className="gap-2">
                                <Edit3 className="size-4" />
                                ویرایش
                            </Button>
                        </Link>
                    )}
                    <Link href="/items">
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="size-4" />
                            بازگشت به لیست
                        </Button>
                    </Link>
                </div>

                <section className="mt-6 grid gap-4 md:grid-cols-5">
                    <Summary label="کود جنس" value={item.code ?? '—'} />
                    <Summary
                        label="نوع جنس"
                        value={getDariItemType(item.item_type)}
                    />
                    <Summary
                        label="دسته‌بندی"
                        value={getDariCategory(item.category?.name ?? '—')}
                    />
                    <Summary
                        label="واحد اصلی"
                        value={baseUnit ? getDariItemUnit(baseUnit.name) : '—'}
                    />
                    <Summary
                        label="واحدهای فعال"
                        value={String(activeUnits.length)}
                    />
                </section>

                <section className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
                    <h2 className="mb-4 text-lg font-bold">واحدهای جنس</h2>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>نام واحد</TableHead>
                                    <TableHead>تبدیل به اصلی</TableHead>
                                    <TableHead>نرخ فروش</TableHead>
                                    <TableHead>نرخ خرید</TableHead>
                                    <TableHead>کد</TableHead>
                                    <TableHead>بارکد</TableHead>
                                    <TableHead>وضعیت</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {item.units.map((unit) => (
                                    <TableRow key={unit.id}>
                                        <TableCell className='text-center'>
                                            {getDariItemUnit(unit.name)} {' '}
                                            {unit.id === baseUnit?.id && (
                                                <span className="mr-2 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                                                    اصلی
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className='text-center'>
                                            {numberValue(
                                                unit.conversion_to_base,
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {numberValue(
                                                unit.selling_price,
                                            ).toFixed(2)}
                                        </TableCell>
                                        <TableCell className='text-center'>
                                            {unit.purchase_price === null
                                                ? '—'
                                                : numberValue(
                                                      unit.purchase_price,
                                                  ).toFixed(2)}
                                        </TableCell>
                                        <TableCell dir="ltr" className='text-center'>
                                            {unit.code}
                                        </TableCell>
                                        <TableCell dir="ltr" className='text-center'>
                                            {unit.barcode ?? '—'}
                                        </TableCell>
                                        <TableCell className='text-center'>
                                            <span
                                                className={
                                                    unit.is_active
                                                        ? 'text-green-600'
                                                        : 'text-muted-foreground'
                                                }
                                            >
                                                {unit.is_active
                                                    ? 'فعال'
                                                    : 'غیرفعال'}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </section>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    {item.product && (
                        <section className="rounded-2xl border bg-card p-5 shadow-sm">
                            <h2 className="mb-4 text-lg font-bold">
                                مشخصات محصول
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Summary
                                    label="وزن"
                                    value={
                                        item.product.weight === null
                                            ? '—'
                                            : String(item.product.weight)
                                    }
                                />
                                <div className="rounded-xl bg-muted/40 p-4">
                                    <p className="text-sm text-muted-foreground">
                                        توضیحات
                                    </p>
                                    <p className="mt-1 whitespace-pre-wrap">
                                        {item.product.description || '—'}
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    <section className="rounded-2xl border bg-card p-5 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold">
                            موجودی به تفکیک موقعیت
                        </h2>
                        {item.inventory_balances?.length ? (
                            <div className="space-y-3">
                                {item.inventory_balances.map((balance) => (
                                    <div
                                        key={balance.id}
                                        className="flex items-center justify-between rounded-xl bg-muted/40 p-3"
                                    >
                                        <span>
                                            {balance.location?.name ?? '—'}
                                        </span>
                                        <span>
                                            {numberValue(
                                                balance.quantity_on_hand,
                                            )}{' '}
                                            {getDariItemUnit(item.unit)}
                                            <span className="mr-2 text-xs text-muted-foreground">
                                                ({numberValue(balance.reserved)}{' '}
                                                محفوظ)
                                            </span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                                موجودی ثبت نشده است.
                            </p>
                        )}
                    </section>
                </div>
            </main>
        </AppLayout>
    );
};

const Summary = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-semibold">{value}</p>
    </div>
);

export default Show;
