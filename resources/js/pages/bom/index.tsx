import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { SectionTitle } from '@/components/section-title';
import AppLayout from '@/layouts/app-layout';
import { BOM } from '@/types';
import { router } from '@inertiajs/react';
import { FileSignature, Search, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getDariCategory } from '@/components/location-translator';
import PageHead from '@/components/page-head';

interface Props {
    boms: BOM[];
}

const formatNumber = (value: number | string) => value
    // new Intl.NumberFormat('fa-AF').format(Number(value) || 0);

const Index = ({ boms }: Props) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const categories = useMemo(
        () =>
            [...new Map(boms.map((bom) => [bom.category?.id, bom.category])).values()].filter(Boolean),
        [boms],
    );

    const filteredBoms = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return boms.filter((bom) => {
            const matchesCategory =
                categoryFilter === 'all' || String(bom.category?.id) === categoryFilter;
            const searchableText = [
                bom.formula_name,
                bom.category?.name,
                getDariCategory(bom.category?.name ?? ''),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return matchesCategory && searchableText.includes(query);
        });
    }, [boms, categoryFilter, searchTerm]);

    const totalIngredients = boms.reduce(
        (total, bom) => total + (bom.bom_lines?.length ?? 0),
        0,
    );
    console.log(boms);
    
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'فورموله‌ها', href: '/boms' },
            ]}
        >
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8" dir="rtl">
   

                <PageHead
                    HeadIcon={FileSignature}
                    subtitle="فورموله‌ها"
                    title="لیست فورموله‌ها"
                    description="سفارش‌ها بر اساس فورموله‌های زیر بررسی می‌شوند."
                    actionTitle="فورموله جدید"
                    actionURL="/boms/create"
                    tone="cyan"
                />

                <section className="mt-5 overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <div className="border-b bg-muted/20 p-4 sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="جستجو بر اساس نام فورموله یا دسته‌بندی..."
                                    className="h-10 w-full rounded-md border-0 bg-background px-4 pr-10 text-sm shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
                                />
                            </div>

                            <div className="flex gap-2">
                                <div className="relative">
                                    <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <select
                                        value={categoryFilter}
                                        onChange={(event) => setCategoryFilter(event.target.value)}
                                        className="h-10 min-w-44 appearance-none rounded-md border bg-background py-2 pl-8 pr-9 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                                    >
                                        <option value="all">همه دسته‌بندی‌ها</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {getDariCategory(category.name)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {(searchTerm || categoryFilter !== 'all') && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setCategoryFilter('all');
                                        }}
                                        className="inline-flex h-10 items-center gap-1 rounded-md border px-3 text-sm text-muted-foreground transition hover:bg-muted"
                                    >
                                        <X className="size-4" />
                                        پاک کردن
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="rounded-full bg-background px-2.5 py-1 shadow-sm">
                                {formatNumber(filteredBoms.length)} فورموله نمایش داده می‌شود
                            </span>
                            <span>مجموع مواد ثبت‌شده: {formatNumber(totalIngredients)}</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="w-16 text-center">#</TableHead>
                                    <TableHead className='text-center'>نام فورموله</TableHead>
                                    <TableHead className='text-center'>دسته‌بندی</TableHead>
                                    <TableHead className="text-center">مواد اولیه</TableHead>
                                    <TableHead className="text-center">بازه تولید</TableHead>
                                    <TableHead className="text-center">وضعیت</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBoms.length > 0 ? (
                                    filteredBoms.map((bom, index) => {
                                        // const isActive = bom.is_active !== false;

                                        return (
                                            <TableRow
                                                key={bom.id}
                                                className="cursor-pointer transition-colors hover:bg-primary/5"
                                                onClick={() => router.get(`/boms/${bom.id}`)}
                                            >
                                                <TableCell className="text-center text-muted-foreground">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className='text-center'>
                                                    <div>
                                                        <p className="font-semibold text-foreground">{bom.formula_name}</p>
                                                        <p className="text-xs text-muted-foreground">کد فورموله: #{bom.code?? bom.id}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className='text-center'>
                                                    <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-medium text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                                                        {getDariCategory(bom.category?.name ?? 'نامشخص')}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center font-medium">
                                                    {formatNumber(bom.bom_lines?.length ?? 0)} قلم
                                                </TableCell>
                                                <TableCell className="text-center text-sm text-muted-foreground" dir="ltr">
                                                    {formatNumber(bom.min_exp_qty)} — {formatNumber(bom.max_exp_qty)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${bom.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                                                        {bom.is_active ? 'فعال' : 'غیرفعال'}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-14 text-center">
                                            <div className="mx-auto max-w-xs">
                                                <FileSignature className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                                                <p className="font-medium text-foreground">فورموله‌ای پیدا نشد</p>
                                                <p className="mt-1 text-sm text-muted-foreground">عبارت جستجو یا دسته‌بندی را تغییر دهید.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={6} className="p-4 text-xs text-muted-foreground">
                                        برای مشاهده جزئیات، روی ردیف فورموله کلیک کنید.
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </section>
            </main>
        </AppLayout>
    );
};

export default Index;
