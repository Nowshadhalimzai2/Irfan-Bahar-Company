import {
    getDariItemType,
    getDariItemUnit,
} from '@/components/location-translator';
import PageHead from '@/components/page-head';
import PageLinks from '@/components/page-links';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { PackagePlus } from 'lucide-react';
import { useMemo, useState } from 'react';

type Item = {
    id: number;
    name: string;
    code: string | null;
    sku: string;
    item_type: 'product' | 'raw_material' | 'packing';
    unit: string;
    default_sale_price: number | string;
    base_unit?: {
        name: string;
        barcode: string | null;
        code: string;
        selling_price: number | string;
    } | null;
    units?: {
        name: string;
        barcode: string | null;
        code: string;
        is_active: boolean;
    }[];
    product?: {
        weight: number | string | null;
    } | null;
};

interface Props {
    items: {
        data: Item[];
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
    };
}

const Index = ({ items }: Props) => {
    const [searchTerm, setSearchTerm] = useState('');
    const visibleItems = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        if (!term) {
            return items.data;
        }

        return items.data.filter((item) => {
            const searchableValues = [
                item.name,
                item.code,
                item.sku,
                item.unit,
                item.base_unit?.code,
                item.base_unit?.barcode,
                ...(item.units ?? []).flatMap((unit) => [
                    unit.name,
                    unit.code,
                    unit.barcode,
                ]),
            ];

            return searchableValues.some((value) =>
                value?.toLowerCase().includes(term),
            );
        });
    }, [items.data, searchTerm]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'اجناس', href: '/items' },
            ]}
        >
            <div className="px-2 py-5 md:px-5">
                <PageHead
                    HeadIcon={PackagePlus}
                    subtitle="اجناس شرکت"
                    title="لیست اجناس"
                    description="برای مشاهده جزئیات و واحدهای فروش، یک جنس را انتخاب کنید."
                    actionTitle="جنس جدید"
                    actionURL="/items/create"
                />

                <section className="mx-auto mt-8 max-w-6xl" dir="rtl">
                    <Input
                        className="h-12 bg-white shadow-xl"
                        placeholder="جستجو بر اساس نام، SKU، کد یا بارکد واحد"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />

                    <div className="mt-5 overflow-x-auto rounded-xl border bg-white shadow-xl">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">
                                        کود
                                    </TableHead>
                                    <TableHead className="text-center">
                                        SKU
                                    </TableHead>
                                    <TableHead className="text-center">
                                        جنس
                                    </TableHead>
                                    <TableHead className="text-center">
                                        نوع
                                    </TableHead>
                                    <TableHead className="text-center">
                                        واحد اصلی
                                    </TableHead>
                                    <TableHead className="text-center">
                                        واحدهای فعال
                                    </TableHead>
                                    <TableHead className="text-center">
                                        نرخ اصلی
                                    </TableHead>
                                    <TableHead className="text-center">
                                        وزن
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleItems.length > 0 ? (
                                    visibleItems.map((item) => {
                                        const baseUnit = item.base_unit;
                                        const activeUnits =
                                            item.units?.filter(
                                                (unit) => unit.is_active,
                                            ).length ?? 0;

                                        return (
                                            <TableRow
                                                key={item.id}
                                                className="cursor-pointer"
                                                onClick={() =>
                                                    router.get(
                                                        '/items/' + item.id,
                                                    )
                                                }
                                            >
                                                <TableCell
                                                    className="text-center"
                                                    dir="ltr"
                                                >
                                                    {item.code ?? '—'}
                                                </TableCell>
                                                <TableCell
                                                    className="text-center"
                                                    dir="ltr"
                                                >
                                                    {item.sku}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {item.name}
                                                </TableCell>
                                                <TableCell
                                                    className={
                                                        'text-center ' +
                                                        (item.item_type ===
                                                        'product'
                                                            ? 'text-green-500'
                                                            : item.item_type ===
                                                                'raw_material'
                                                              ? 'text-blue-500'
                                                              : 'text-pink-500')
                                                    }
                                                >
                                                    {getDariItemType(
                                                        item.item_type,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {getDariItemUnit(
                                                        baseUnit?.name ??
                                                            item.unit,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {activeUnits}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {Number(
                                                        baseUnit?.selling_price ??
                                                            item.default_sale_price,
                                                    ).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {item.product?.weight ??
                                                        '—'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="p-5 text-center text-sm text-muted-foreground"
                                        >
                                            ریکورد وجود ندارد
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <PageLinks links={items.links} className="py-5" />
                    </div>
                </section>
            </div>
        </AppLayout>
    );
};

export default Index;
