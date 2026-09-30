import { getDariItemUnit } from '@/components/location-translator';
import PageHead from '@/components/page-head';
import AppLayout from '@/layouts/app-layout';
import { Waste } from '@/types';
import { ChartArea } from 'lucide-react';

interface Props {
    production_order: {
        id: number;
        reference_no: string;
        ordered_by: string;
        wastes: Waste[];
        order_date: Date;
    };
}

const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('fa-AF', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

const formatNumber = (value: number | string) => value
    // new Intl.NumberFormat('fa-AF').format(Number(value) || 0);

const Show = ({ production_order }: Props) => {
    const wasteRows = production_order.wastes?.length
        ? production_order.wastes
        : ([
            {
                id: 'demo-waste',
                item: { name: 'نمونه ضایعات', code: 'DEMO-001', unit: 'kg' },
                wasted_quantity: 0,
                reason: 'هنوز موردی برای این سفارش ثبت نشده است.',
            },
        ] as unknown as Waste[]);

    const hasRealWastes = Boolean(production_order.wastes?.length);
    const totalQuantity = hasRealWastes
        ? production_order.wastes.reduce(
            (total, waste) => total + (Number(waste.wasted_quantity) || 0),
            0,
        )
        : 0;
    const reason =
        production_order.wastes?.map((waste) => waste.reason).filter(Boolean).join('، ') ||
        'برای این سفارش هنوز توضیحی ثبت نشده است.';

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'لیست سفارشات', href: '/factory/production-orders' },
                {
                    title: `سفارش ${production_order.ordered_by}`,
                    href: `/factory/production-orders/${production_order.id}`,
                },
                {
                    title: `ضایعات سفارش ${production_order.ordered_by}`,
                    href: `/factory/wastes/${production_order.id}/show`,
                },
            ]}
        >
            <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8" dir="rtl">
                    <PageHead
                        HeadIcon={ChartArea}
                        title='مدیریت تولید'
                        subtitle={`ضایعات سفارش ${production_order.ordered_by}`}
                        description='گزارش اقلام ضایعاتی ثبت‌شده برای این سفارش تولید'
                        tone="indigo"
                    />
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                   
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
                        <span className={`h-2.5 w-2.5 rounded-full ${hasRealWastes ? 'bg-amber-500' : 'bg-slate-400'}`} />
                        {hasRealWastes ? 'دارای ضایعات ثبت‌شده' : 'بدون ثبت ضایعات'}
                    </div>
                </div>

                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <div className="border-b bg-linear-to-l from-primary/10 via-background to-background p-5 sm:p-7">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                    شماره سفارش
                                </p>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                    {production_order.reference_no}
                                </h1>
                            </div>
                            <div className="rounded-xl border bg-background/80 px-4 py-3 text-right shadow-sm">
                                <p className="text-xs text-muted-foreground">تاریخ سفارش</p>
                                <p className="mt-1 font-semibold text-foreground">{formatDate(production_order.order_date)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 border-b p-4 sm:grid-cols-3 sm:p-6">
                        <div className="rounded-xl bg-muted/50 p-4">
                            <p className="text-sm text-muted-foreground">سفارش‌کننده</p>
                            <p className="mt-1 font-semibold text-foreground">{production_order.ordered_by}</p>
                        </div>
                        <div className="rounded-xl bg-muted/50 p-4">
                            <p className="text-sm text-muted-foreground">تعداد اقلام</p>
                            <p className="mt-1 font-semibold text-foreground">{formatNumber(hasRealWastes ? wasteRows.length : 0)} قلم</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/20">
                            <p className="text-sm text-amber-700 dark:text-amber-300">مجموع مقدار ضایعات</p>
                            <p className="mt-1 font-semibold text-amber-900 dark:text-amber-100">
                                {formatNumber(totalQuantity)} <span className="text-sm font-normal">واحد</span>
                            </p>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-foreground">فهرست ضایعات</h2>
                                <p className="mt-1 text-sm text-muted-foreground">جزئیات مواد و مقدار هدررفته</p>
                            </div>
                            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                {formatNumber(hasRealWastes ? wasteRows.length : 0)} مورد
                            </span>
                        </div>

                        <div className="overflow-hidden rounded-xl border">
                            <div className="hidden grid-cols-[72px_1fr_1fr_1fr] gap-4 bg-muted/60 px-4 py-3 text-sm font-semibold text-muted-foreground sm:grid">
                                <span>ردیف</span>
                                <span>جنس</span>
                                <span>کد جنس</span>
                                <span>مقدار ضایعات</span>
                            </div>
                            <div className="divide-y">
                                {wasteRows.map((waste, index) => (
                                    <div key={waste.id} className="grid gap-3 px-4 py-4 transition-colors hover:bg-muted/30 sm:grid-cols-[72px_1fr_1fr_1fr] sm:items-center sm:gap-4">
                                        <div className="flex items-center justify-between sm:block">
                                            <span className="text-xs text-muted-foreground sm:hidden">ردیف</span>
                                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                                {formatNumber(index + 1)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs text-muted-foreground sm:hidden">جنس</span>
                                            <span className="font-medium text-foreground">{waste.item?.name || 'بدون نام'}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 text-sm">
                                            <span className="text-xs text-muted-foreground sm:hidden">کد جنس</span>
                                            <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{waste.item?.code || '—'}</code>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs text-muted-foreground sm:hidden">مقدار ضایعات</span>
                                            <span className="font-semibold text-foreground">
                                                {formatNumber(waste.wasted_quantity)}{' '}
                                                <span className="text-sm font-normal text-muted-foreground">{getDariItemUnit(waste.item?.unit ?? '')}</span>
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 sm:p-5">
                            <div className="flex gap-3">
                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">!</div>
                                <div>
                                    <h3 className="font-semibold text-amber-900 dark:text-amber-100">دلیل ثبت ضایعات</h3>
                                    <p className="mt-1 text-sm leading-6 text-amber-800/80 dark:text-amber-200/80">{reason}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </AppLayout>
    );
};

export default Show;
