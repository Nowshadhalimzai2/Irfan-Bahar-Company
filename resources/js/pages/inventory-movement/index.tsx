import { InventoryMovement } from '@/types';
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
import LocationTranslator from '@/components/location-translator';
import AppLayout from '@/layouts/app-layout';
import PageLinks from '@/components/page-links';
import { Input } from '@/components/ui/input';
import {
    ArrowDownLeft,
    ArrowUpRight,
    CircleArrowDown,
    CircleArrowUp,
    Search,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface Props {
    movements: {
        data: InventoryMovement[];
        current_page: number;
        from: number;
        last_page: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
    };
}

const movementLabels: Record<string, string> = {
    receipt: 'رسید خرید',
    transferred_out: 'انتقال خروجی',
    transferred_in: 'انتقال ورودی',
    production_consumption: 'مصرف تولید',
    production_output: 'محصول تولیدی',
    sale: 'فروش',
    sale_return: 'برگشت فروش',
    adjustment_in: 'اصلاح موجودی ورودی',
    adjustment_out: 'اصلاح موجودی خروجی',
};

const formatNumber = (value: number | string) =>value
    // new Intl.NumberFormat('fa-AF').format(Number(value) || 0);

const formatDate = (value: string | Date) =>
    new Date(value).toLocaleDateString('fa-AF', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

const Index = ({ movements }: Props) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const filteredMovements = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return movements.data.filter((movement) => {
            const matchesType = typeFilter === 'all' || movement.movement_type === typeFilter;
            const searchableText = [
                movement.item?.name,
                movement.reference_no,
                movement.movement_type,
                movement.item?.code,
                movementLabels[movement.movement_type],
                movement.location?.name,
                new Date(movement.occured_at).toLocaleDateString('fa-AF'),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return matchesType && searchableText.includes(normalizedSearch);
        });
    }, [movements.data, searchTerm, typeFilter]);

    const movementTypes = useMemo(
        () => [...new Set(movements.data.map((movement) => movement.movement_type))],
        [movements.data],
    );

    const incomingCount = filteredMovements.filter((movement) => Number(movement.quantity) > 0).length;
    const outgoingCount = filteredMovements.filter((movement) => Number(movement.quantity) < 0).length;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'تبادله اجناس', href: '/inventory-movements' },
            ]}
        >
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8" dir="rtl">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-2 text-sm font-medium text-primary">کنترل موجودی</p>
                        <SectionTitle
                            title="گردش موجودی"
                            description="تمام ورود، خروج و مصرف اجناس را در یک نگاه دنبال کنید."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:w-64">
                        <div className="rounded-xl border bg-emerald-50 px-3 py-2 dark:bg-emerald-950/20">
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-300">ورودی</p>
                            <p className="mt-1 text-xl font-bold text-emerald-800 dark:text-emerald-200">
                                {formatNumber(incomingCount)}
                            </p>
                        </div>
                        <div className="rounded-xl border bg-rose-50 px-3 py-2 dark:bg-rose-950/20">
                            <p className="text-[11px] text-rose-700 dark:text-rose-300">خروجی</p>
                            <p className="mt-1 text-xl font-bold text-rose-800 dark:text-rose-200">
                                {formatNumber(outgoingCount)}
                            </p>
                        </div>
                    </div>
                </div>

                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <div className="border-b bg-muted/20 p-4 sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="جستجو بر اساس جنس، حواله یا موقعیت..."
                                    className="h-10 border-0 bg-background pr-10 shadow-sm"
                                />
                            </div>

                            <div className="flex gap-2">
                                <select
                                    value={typeFilter}
                                    onChange={(event) => setTypeFilter(event.target.value)}
                                    className="h-10 min-w-44 rounded-md border bg-background px-3 text-sm text-foreground shadow-sm outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="all">همه انواع انتقال</option>
                                    {movementTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {movementLabels[type] ?? type}
                                        </option>
                                    ))}
                                </select>

                                {(searchTerm || typeFilter !== 'all') && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setTypeFilter('all');
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
                            <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 shadow-sm">
                                <CircleArrowUp className="size-3.5 text-emerald-600" />
                                {formatNumber(filteredMovements.length)} نتیجه
                            </span>
                            {(searchTerm || typeFilter !== 'all') && <span>فیلتر روی همین صفحه اعمال شده است.</span>}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="w-16 text-center">#</TableHead>
                                    <TableHead className='text-center'>جنس</TableHead>
                                    <TableHead className='text-center'>موقعیت</TableHead>
                                    <TableHead className="text-center">مقدار</TableHead>
                                    <TableHead className='text-center'>نوع انتقال</TableHead>
                                    <TableHead className='text-center'>حواله</TableHead>
                                    <TableHead className='text-center'>تاریخ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMovements.length > 0 ? (
                                    filteredMovements.map((movement, index) => {
                                        const isIncoming = Number(movement.quantity) >= 0;

                                        return (
                                            <TableRow key={movement.id ?? `${movement.reference_no}-${index}`} className="group">
                                                <TableCell className="text-center text-muted-foreground">
                                                    {formatNumber((movements.from ?? 1) + index)}
                                                </TableCell>
                                                <TableCell className='flex justify-start '>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${isIncoming ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                            {isIncoming ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground">{movement.item?.name ?? 'نامشخص'}</p>
                                                            <p className="text-xs text-muted-foreground">{movement.item?.code ?? 'بدون کد'}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground text-center">
                                                    {movement.location ? LocationTranslator(movement.location.name) : 'نامشخص'}
                                                </TableCell>
                                                <TableCell className={`text-center font-semibold ${isIncoming ? 'text-emerald-700' : 'text-rose-700'}`} dir="ltr">
                                                    {isIncoming ? '+' : ''}{formatNumber(movement.quantity)}
                                                </TableCell>
                                                <TableCell className='flex justify-center items-center'>
                                                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                                        {movementLabels[movement.movement_type] ?? movement.movement_type}
                                                    </span>
                                                </TableCell>
                                                <TableCell className='text-center'>
                                                    <code className="text-xs text-muted-foreground">{movement.reference_no || '—'}</code>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-center text-sm text-muted-foreground">
                                                    {formatDate(movement.occured_at)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-14 text-center">
                                            <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-muted-foreground">
                                                <CircleArrowDown className="size-9 opacity-30" />
                                                <p className="font-medium text-foreground">رکوردی پیدا نشد</p>
                                                <p className="text-sm">عبارت جستجو یا نوع انتقال را تغییر دهید.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={7} className="p-4">
                                        <PageLinks links={movements.links} />
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
