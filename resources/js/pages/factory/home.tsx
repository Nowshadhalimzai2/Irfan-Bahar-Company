import { Link, router } from '@inertiajs/react';
import {
    Activity,
    ArrowDownToLine,
    ArrowLeft,
    ArrowLeftRight,
    ArrowUpFromLine,
    Boxes,
    CalendarDays,
    Check,
    CircleAlert,
    ClipboardList,
    Clock3,
    Factory,
    PackageCheck,
    Plus,
    RefreshCw,
    Truck,
    Warehouse,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { getDariItemUnit } from '@/components/location-translator';
import PersionDatePicker from '@/components/persion-date-picker';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import AppLayout from '@/layouts/app-layout';

interface DashboardTransaction {
    id: string;
    reference: string | null;
    type: string;
    description: string | null;
    date: string;
    status?: string;
    quantity?: number;
    unit?: string | null;
    href: string;
}

interface DashboardProps {
    filters: {
        startDate: string;
        endDate: string;
    };
    summary: {
        receipts: number;
        materialIssues: number;
        transfers: number;
        productionOutputs: number;
        pendingTransfers: number;
        pendingProductionOrders: number;
        inProgressProductionOrders: number;
        lowStockItems: number;
        stockedItems: number;
    };
    activityTrend: {
        date: string;
        receipts: number;
        issues: number;
        transfers: number;
        production: number;
    }[];
    lowStockItems: {
        itemId: number;
        itemName: string;
        itemCode: string | null;
        unit: string | null;
        locationId: number;
        locationName: string | null;
        available: number;
        reserved: number;
    }[];
    attention: {
        transfers: {
            id: number;
            reference: string;
            source: string | null;
            destination: string | null;
            date: string;
        }[];
        productionOrders: {
            id: number;
            reference: string;
            category: string | null;
            status: 'pending' | 'progress';
            orderedBy: string;
            date: string;
            needsOutputConfirmation: boolean;
        }[];
    };
    recentTransactions: DashboardTransaction[];
}

const chartConfig = {
    receipts: { label: 'رسید اجناس', color: '#0f766e' },
    issues: { label: 'مصرف مواد', color: '#e11d48' },
    transfers: { label: 'انتقال خروجی', color: '#2563eb' },
    production: { label: 'محصول تولیدی', color: '#d97706' },
} satisfies ChartConfig;

const transactionLabels: Record<string, string> = {
    receipt: 'رسید',
    production_consumption: 'مصرف تولید',
    transferred_out: 'انتقال خروجی',
    transferred_in: 'انتقال ورودی',
    production_output: 'محصول تولیدی',
    transfer: 'انتقال',
    production: 'سفارش تولید',
};

const statusLabels: Record<string, string> = {
    suggested: 'در انتظار تأیید',
    pending: 'در صف شروع',
    progress: 'در حال اجرا',
    completed: 'تکمیل‌شده',
    cancelled: 'لغوشده',
};

const toDateValue = (value: string): Date => new Date(`${value}T12:00:00`);

const toGregorianDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const formatDate = (
    value: string | Date,
    options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    },
): string => {
    const date =
        value instanceof Date
            ? value
            : /^\d{4}-\d{2}-\d{2}$/.test(value)
              ? new Date(`${value}T12:00:00`)
              : new Date(value);

    return date.toLocaleDateString('fa-AF', options);
};

const formatNumber = (value: number): string =>
    value.toLocaleString('en-US', { maximumFractionDigits: 3 });

const daysBetween = (first: Date, second: Date): number => {
    const firstUtc = Date.UTC(
        first.getFullYear(),
        first.getMonth(),
        first.getDate(),
    );
    const secondUtc = Date.UTC(
        second.getFullYear(),
        second.getMonth(),
        second.getDate(),
    );

    return (secondUtc - firstUtc) / 86_400_000;
};

const Home = ({
    filters,
    summary,
    activityTrend,
    lowStockItems,
    attention,
    recentTransactions,
}: DashboardProps) => {
    const [startDate, setStartDate] = useState(() =>
        toDateValue(filters.startDate),
    );
    const [endDate, setEndDate] = useState(() => toDateValue(filters.endDate));
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(() => new Date());
    const [filterError, setFilterError] = useState('');

    const refreshDashboard = useCallback(() => {
        setRefreshing(true);
        router.reload({
            onFinish: () => {
                setLastUpdated(new Date());
                setRefreshing(false);
            },
        });
    }, []);

    useEffect(() => {
        const timer = window.setInterval(refreshDashboard, 60_000);

        return () => window.clearInterval(timer);
    }, [refreshDashboard]);

    const applyDateRange = () => {
        if (toGregorianDate(startDate) > toGregorianDate(endDate)) {
            setFilterError('تاریخ شروع باید پیش از تاریخ پایان باشد.');

            return;
        }

        if (daysBetween(startDate, endDate) > 30) {
            setFilterError('بازه گزارش نباید بیشتر از ۳۱ روز باشد.');

            return;
        }

        setFilterError('');
        router.get(
            '/factory/home',
            {
                start_date: toGregorianDate(startDate),
                end_date: toGregorianDate(endDate),
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onStart: () => setRefreshing(true),
                onFinish: () => {
                    setLastUpdated(new Date());
                    setRefreshing(false);
                },
            },
        );
    };

    const quickActions = [
        {
            title: 'ثبت رسید',
            href: '/receipts/create',
            icon: PackageCheck,
            className:
                'bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500',
        },
        {
            title: 'ثبت انتقال',
            href: '/transfers/create',
            icon: ArrowLeftRight,
            className: 'border-border bg-card hover:bg-muted',
        },
        {
            title: 'سفارش تولید',
            href: '/factory/production-orders/create',
            icon: Plus,
            className: 'border-border bg-card hover:bg-muted',
        },
        {
            title: 'گردش موجودی',
            href: '/inventory-movements',
            icon: Boxes,
            className: 'border-border bg-card hover:bg-muted',
        },
    ];

    const metrics = [
        {
            label: 'رسیدهای ثبت‌شده',
            value: summary.receipts,
            detail: 'ورود رسمی اجناس',
            icon: ArrowDownToLine,
            color: 'text-teal-700 dark:text-teal-300',
            href: '/receipts',
        },
        {
            label: 'مصرف مواد',
            value: summary.materialIssues,
            detail: 'حرکت‌های ثبت‌شده برای تولید',
            icon: ArrowUpFromLine,
            color: 'text-rose-700 dark:text-rose-300',
            href: '/inventory-movements',
        },
        {
            label: 'انتقال‌های ثبت‌شده',
            value: summary.transfers,
            detail: 'اسناد انتقال با موقعیت مجاز',
            icon: Truck,
            color: 'text-blue-700 dark:text-blue-300',
            href: '/receipts',
        },
        {
            label: 'محصول تولیدشده',
            value: summary.productionOutputs,
            detail: 'ثبت‌های خروجی تولید',
            icon: Factory,
            color: 'text-amber-700 dark:text-amber-300',
            href: '/inventory-movements',
        },
    ];

    const attentionCount =
        summary.pendingTransfers +
        summary.pendingProductionOrders +
        summary.inProgressProductionOrders+
        summary.lowStockItems;

    return (
        <AppLayout breadcrumbs={[{ title: 'کارخانه', href: '/factory/home' }]}>
            <main
                className="mx-auto w-full max-w-[1600px] space-y-5 p-3 md:p-6"
                dir="rtl"
            >
                <header className="overflow-hidden rounded-[1.75rem] border border-teal-200 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-teal-50 via-white to-slate-100 text-slate-900 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:from-teal-800 dark:via-slate-900 dark:to-slate-950 dark:text-white dark:shadow-black/20">
                    <div className="grid gap-6 p-5 md:p-7 xl:grid-cols-[1fr_auto] xl:items-center">

                        <div>
                            {attentionCount > 0?<div className='bg-red-500  w-3 rounded-full shadow-lg animate-pulse -mt-2 mb-2 shadow-red-400 h-3'/>
                            :<div className='bg-green-500  w-3 rounded-full shadow-lg animate-pulse -mt-2 mb-2 shadow-green-400 h-3'/>}
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-3 py-1 text-xs text-teal-800 shadow-sm dark:border-white/15 dark:bg-black/40 dark:text-teal-100">
                                <Factory className="size-3.5" />
                                عملیات کارخانه
                            </div>
                            <h1 className={`text-2xl font-bold tracking-tight md:text-3xl `}>
                                سلام،{' '}
                                {attentionCount > 0
                                    ? 'اجرآات ضرور است!'
                                    : 'همه‌چیز آرام است'}
                            </h1>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                وضعیت ورود و مصرف مواد، انتقال‌ها و مراحل تولید
                                را دنبال کنید.
                            </p>
                            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock3 className="size-3.5" />
                                    آخرین بروزرسانی{' '}
                                    {lastUpdated.toLocaleTimeString('fa-AF', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Warehouse className="size-3.5" />
                                    اطلاعات انبار و کارخانه مجاز
                                </span>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:w-136">
                            <PersionDatePicker
                                id="factory-dashboard-start"
                                label="از تاریخ"
                                value={startDate}
                                maxDate={endDate}
                                onChange={(date) => {
                                    if (date) {
                                        setStartDate(date);
                                    }
                                }}
                            />
                            <PersionDatePicker
                                id="factory-dashboard-end"
                                label="تا تاریخ"
                                value={endDate}
                                minDate={startDate}
                                // maxDate={new Date()}
                                onChange={(date) => {
                                    if (date) {
                                        setEndDate(date);
                                    }
                                }}
                            />
                            <div className="flex items-center justify-between gap-2 sm:col-span-2">
                                <p className="text-xs text-slate-600 dark:text-slate-300">
                                    بازه گزارش: {formatDate(filters.startDate)}{' '}
                                    تا {formatDate(filters.endDate)}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={refreshDashboard}
                                        disabled={refreshing}
                                        className="border-slate-300 bg-white/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
                                    >
                                        <RefreshCw
                                            className={`size-4 ${refreshing ? 'animate-spin' : ''}`}
                                        />
                                        بروزرسانی
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={applyDateRange}
                                        disabled={refreshing}
                                        className="bg-teal-700 text-white hover:bg-teal-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                                    >
                                        <CalendarDays className="size-4" />
                                        اعمال بازه
                                    </Button>
                                </div>
                            </div>
                            {filterError && (
                                <p
                                    role="alert"
                                    className="text-xs text-rose-700 dark:text-rose-200 sm:col-span-2"
                                >
                                    {filterError}
                                </p>
                            )}
                        </div>
                    </div>
                </header>

                <nav
                    aria-label="عملیات سریع"
                    className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                >
                    {quickActions.map((action) => (
                        <Link
                            key={action.title}
                            href={action.href}
                            className={`${buttonVariants({ variant: 'outline' })} h-12 justify-start gap-2.5 rounded-xl px-3 text-sm font-semibold shadow-sm ${action.className}`}
                        >
                            <action.icon className="size-4 shrink-0" />
                            {action.title}
                            <ArrowLeft className="mr-auto size-3.5 opacity-60" />
                        </Link>
                    ))}
                </nav>

                <section
                    aria-label="فعالیت‌های بازه انتخاب‌شده"
                    className="grid overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-2 xl:grid-cols-4"
                >
                    {metrics.map((metric, index) => (
                        <Link
                            key={metric.label}
                            href={metric.href}
                            className={`group flex items-center gap-3 p-4 transition hover:bg-muted/50 ${
                                index < metrics.length - 1
                                    ? 'border-b border-border sm:border-l xl:border-b-0'
                                    : ''
                            } ${index === 1 ? 'sm:border-b-0 xl:border-b-0' : ''}`}
                        >
                            <span
                                className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted ${metric.color}`}
                            >
                                <metric.icon className="size-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="flex items-center justify-between gap-2">
                                    <span className="text-xs text-muted-foreground">
                                        {metric.label}
                                    </span>
                                    <ArrowLeft className="size-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                                </span>
                                <span className="mt-0.5 block text-2xl font-bold tabular-nums">
                                    {formatNumber(metric.value)}
                                </span>
                                <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                                    {metric.detail}
                                </span>
                            </span>
                        </Link>
                    ))}
                </section>

                <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(19rem,0.8fr)]">
                    <div className="min-w-0 space-y-5">
                        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
                            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Activity className="size-4 text-primary" />
                                        <h2 className="font-semibold">
                                            روند فعالیت عملیاتی
                                        </h2>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        رسیدها و انتقالات خروجی به‌شکل سند، مصرف
                                        و تولید به‌شکل حرکت روزانه؛ نه مقدار اجناس
                                    </p>
                                </div>
                                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                                    {activityTrend.length.toLocaleString(
                                        'en-US',
                                    )}{' '}
                                    روز
                                </span>
                            </div>
                            {activityTrend.some(
                                (day) =>
                                    day.receipts +
                                        day.issues +
                                        day.transfers +
                                        day.production >
                                    0,
                            ) ? (
                                <ChartContainer
                                    config={chartConfig}
                                    className="h-67.5 w-full"
                                >
                                    <AreaChart
                                        accessibilityLayer
                                        data={activityTrend}
                                        margin={{
                                            top: 8,
                                            right: 4,
                                            left: -20,
                                            bottom: 0,
                                        }}
                                    >
                                        <CartesianGrid
                                            vertical={false}
                                            strokeDasharray="3 3"
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            minTickGap={18}
                                            tickFormatter={(value: string) =>
                                                formatDate(value, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                })
                                            }
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tickLine={false}
                                            axisLine={false}
                                            width={28}
                                        />
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent
                                                    labelFormatter={(value) =>
                                                        formatDate(
                                                            String(value),
                                                        )
                                                    }
                                                />
                                            }
                                        />
                                        <ChartLegend
                                            content={<ChartLegendContent />}
                                        />
                                        <Area
                                            dataKey="receipts"
                                            type="monotone"
                                            stroke="var(--color-receipts)"
                                            fill="var(--color-receipts)"
                                            fillOpacity={0.08}
                                            strokeWidth={2}
                                        />
                                        <Area
                                            dataKey="issues"
                                            type="monotone"
                                            stroke="var(--color-issues)"
                                            fill="var(--color-issues)"
                                            fillOpacity={0.06}
                                            strokeWidth={2}
                                        />
                                        <Area
                                            dataKey="transfers"
                                            type="monotone"
                                            stroke="var(--color-transfers)"
                                            fill="var(--color-transfers)"
                                            fillOpacity={0.06}
                                            strokeWidth={2}
                                        />
                                        <Area
                                            dataKey="production"
                                            type="monotone"
                                            stroke="var(--color-production)"
                                            fill="var(--color-production)"
                                            fillOpacity={0.06}
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ChartContainer>
                            ) : (
                                <div className="flex h-67.5 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 text-center">
                                    <Activity className="size-8 text-muted-foreground/50" />
                                    <p className="mt-3 text-sm font-medium">
                                        در این بازه حرکتی ثبت نشده است
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        برای دیدن فعالیت، بازه زمانی دیگری
                                        انتخاب کنید.
                                    </p>
                                </div>
                            )}
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-5">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <ClipboardList className="size-4 text-primary" />
                                        <h2 className="font-semibold">
                                            آخرین تراکنش‌ها و گردش‌ها
                                        </h2>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        تازه‌ترین رویدادهای موجود در بازه
                                        انتخاب‌شده
                                    </p>
                                </div>
                                <Link
                                    href="/inventory-movements"
                                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                >
                                    همه گردش‌ها
                                    <ArrowLeft className="size-3.5" />
                                </Link>
                            </div>
                            {recentTransactions.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-155 text-right text-sm">
                                        <thead className="bg-muted/40 text-[11px] text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">
                                                    نوع رویداد
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    مرجع / جنس
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    موقعیت یا جزئیات
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    وضعیت / مقدار
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    تاریخ
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {recentTransactions.map(
                                                (transaction) => (
                                                    <tr
                                                        key={transaction.id}
                                                        className="transition hover:bg-muted/30"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex items-center gap-2">
                                                                <span className="size-2 rounded-full bg-primary/70" />
                                                                {transactionLabels[
                                                                    transaction
                                                                        .type
                                                                ] ??
                                                                    transaction.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Link
                                                                href={
                                                                    transaction.href
                                                                }
                                                                className="font-medium text-primary hover:underline"
                                                            >
                                                                {transaction.reference ??
                                                                    'بدون مرجع'}
                                                            </Link>
                                                        </td>
                                                        <td className="max-w-56 truncate px-4 py-3 text-muted-foreground">
                                                            {transaction.description ??
                                                                '—'}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {transaction.quantity !==
                                                            undefined ? (
                                                                <span className="font-medium tabular-nums">
                                                                    {formatNumber(
                                                                        transaction.quantity,
                                                                    )}{' '}
                                                                    {getDariItemUnit(
                                                                        transaction.unit ??
                                                                            '',
                                                                    )}
                                                                </span>
                                                            ) : transaction.status ? (
                                                                <span className="rounded-full bg-muted px-2 py-1 text-[11px]">
                                                                    {statusLabels[
                                                                        transaction
                                                                            .status
                                                                    ] ??
                                                                        transaction.status}
                                                                </span>
                                                            ) : (
                                                                '—'
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">
                                                            {formatDate(
                                                                transaction.date,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <ClipboardList className="mx-auto size-8 text-muted-foreground/50" />
                                    <p className="mt-3 text-sm font-medium">
                                        تراکنشی برای نمایش وجود ندارد
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        در بازه انتخاب‌شده هنوز رسید، انتقال یا
                                        حرکت موجودی ثبت نشده است.
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>

                    <aside className="space-y-5">
                        <section className="overflow-hidden rounded-2xl border border-amber-300/60 bg-amber-50/70 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/15">
                            <div className="flex items-start justify-between gap-3 border-b border-amber-200/70 p-4 dark:border-amber-900/50">
                                <div>
                                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                                        <CircleAlert className="size-4" />
                                        <h2 className="font-semibold">
                                            نیازمند توجه
                                        </h2>
                                    </div>
                                    <p className="mt-1 text-xs text-amber-900/70 dark:text-amber-200/70">
                                        موارد باز و ناتمام در انبار و تولید
                                    </p>
                                </div>
                                <span className="flex size-8 items-center justify-center rounded-full bg-amber-200/70 text-sm font-bold text-amber-950 dark:bg-amber-900/70 dark:text-amber-100">
                                    {formatNumber(attentionCount)}
                                </span>
                            </div>
                            <div className="space-y-4 p-4">
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <h3 className="text-xs font-semibold">
                                            انتقال‌های منتظر
                                        </h3>
                                        <Link
                                            href="/receipts"
                                            className="text-[11px] text-primary hover:underline"
                                        >
                                            مشاهده همه
                                        </Link>
                                    </div>
                                    {attention.transfers.length > 0 ? (
                                        <div className="space-y-2">
                                            {attention.transfers.map(
                                                (transfer) => (
                                                    <Link
                                                        key={transfer.id}
                                                        href={`/transfers/${transfer.id}`}
                                                        className="flex items-start justify-between gap-2 rounded-xl border border-amber-200/70 bg-background/80 p-3 transition hover:border-amber-400 dark:border-amber-900/60"
                                                    >
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-xs font-semibold">
                                                                {
                                                                    transfer.reference
                                                                }
                                                            </span>
                                                            <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                                                                {transfer.source ??
                                                                    '—'}{' '}
                                                                →{' '}
                                                                {transfer.destination ??
                                                                    '—'}
                                                            </span>
                                                        </span>
                                                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[10px] text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                                                            منتظر
                                                        </span>
                                                    </Link>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <p className="rounded-xl border border-dashed border-amber-300/70 p-3 text-xs text-muted-foreground dark:border-amber-900/70">
                                            انتقال منتظری وجود ندارد.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <h3 className="text-xs font-semibold">
                                            سفارش‌های ناتمام
                                        </h3>
                                        <Link
                                            href="/factory/production-orders"
                                            className="text-[11px] text-primary hover:underline"
                                        >
                                            مشاهده همه
                                        </Link>
                                    </div>
                                    {attention.productionOrders.length > 0 ? (
                                        <div className="space-y-2">
                                            {attention.productionOrders.map(
                                                (order) => (
                                                    <Link
                                                        key={order.id}
                                                        href={`/factory/production-orders/${order.id}`}
                                                        className="flex items-start justify-between gap-2 rounded-xl border border-amber-200/70 bg-background/80 p-3 transition hover:border-amber-400 dark:border-amber-900/60"
                                                    >
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-xs font-semibold">
                                                                {
                                                                    order.reference
                                                                }
                                                                {' · '}
                                                                {order.category ??
                                                                    order.orderedBy}
                                                            </span>
                                                            <span className="mt-1 block text-[11px] text-muted-foreground">
                                                                {order.needsOutputConfirmation
                                                                    ? 'ثبت محصول نهایی لازم است'
                                                                    : statusLabels[
                                                                          order
                                                                              .status
                                                                      ]}
                                                            </span>
                                                        </span>
                                                        <span className="shrink-0 rounded-full bg-sky-100 px-2 py-1 text-[10px] text-sky-800 dark:bg-sky-900/60 dark:text-sky-200">
                                                            {
                                                                statusLabels[
                                                                    order.status
                                                                ]
                                                            }
                                                        </span>
                                                    </Link>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <p className="rounded-xl border border-dashed border-amber-300/70 p-3 text-xs text-muted-foreground dark:border-amber-900/70">
                                            سفارش ناتمامی وجود ندارد.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div className="flex items-start justify-between gap-2 border-b border-border p-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Boxes className="size-4 text-rose-600" />
                                        <h2 className="font-semibold">
                                            موجودی رو به اتمام
                                        </h2>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        موقعیت‌هایی با موجودی آزاد حداکثر ۱۰
                                        واحد پایه
                                    </p>
                                </div>
                                <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300">
                                    {formatNumber(summary.lowStockItems)}
                                </span>
                            </div>
                            {lowStockItems.length > 0 ? (
                                <div className="divide-y divide-border">
                                    {lowStockItems.map((item) => (
                                        <Link
                                            key={`${item.itemId}-${item.locationId}`}
                                            href={`/inventory-balances?location_id=${item.locationId}`}
                                            className="flex items-center justify-between gap-3 p-3.5 transition hover:bg-muted/40"
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-medium">
                                                    {item.itemName}
                                                </span>
                                                <span className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                                                    <Warehouse className="size-3" />
                                                    {item.locationName ?? '—'}
                                                </span>
                                            </span>
                                            <span className="shrink-0 text-left">
                                                <span className="block font-semibold text-rose-700 tabular-nums dark:text-rose-300">
                                                    {formatNumber(
                                                        item.available,
                                                    )}{' '}
                                                    {getDariItemUnit(
                                                        item.unit ?? '',
                                                    )}
                                                </span>
                                                {item.reserved > 0 && (
                                                    <span className="mt-1 block text-[10px] text-muted-foreground">
                                                        محفوظ:{' '}
                                                        {formatNumber(
                                                            item.reserved,
                                                        )}
                                                    </span>
                                                )}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center">
                                    <Check className="mx-auto size-7 text-emerald-600" />
                                    <p className="mt-2 text-sm font-medium">
                                        کمبود موجودی ثبت نشده
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        در موقعیت‌های مجاز، موجودی آزاد بیشتر از
                                        آستانه است.
                                    </p>
                                </div>
                            )}
                            <Link
                                href="/inventory-balances"
                                className="flex items-center justify-between border-t border-border px-4 py-3 text-xs font-medium text-primary hover:bg-muted/30"
                            >
                                همه موجودی‌ها
                                <ArrowLeft className="size-3.5" />
                            </Link>
                        </section>

                        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Warehouse className="size-4 text-primary" />
                                <h2 className="font-semibold">پوشش موجودی</h2>
                            </div>
                            <div className="mt-4 flex items-end justify-between gap-3">
                                <span className="text-xs text-muted-foreground">
                                    اجناس دارای موجودی در کارخانه و انبار
                                </span>
                                <span className="text-2xl font-bold tabular-nums">
                                    {formatNumber(summary.stockedItems)}
                                </span>
                            </div>
                            <Link
                                href="/inventory-balances"
                                className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs font-medium text-primary hover:underline"
                            >
                                باز کردن دفتر موجودی
                                <ArrowLeft className="size-3.5" />
                            </Link>
                        </section>
                    </aside>
                </section>
            </main>
        </AppLayout>
    );
};

export default Home;
