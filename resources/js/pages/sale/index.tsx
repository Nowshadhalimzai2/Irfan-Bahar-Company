import { Head, router } from '@inertiajs/react';
import {
    ArrowDownLeft,
    ArrowUpRight,
    BarChart3,
    CircleDollarSign,
    Download,
    Ellipsis,
    MessageSquareText,
    MoreHorizontal,
    Package,
    Plus,
    ShoppingBag,
    Target,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { getDariCategory, getDariCurrency, getDariItemUnit } from '@/components/location-translator';

type Stats = {
    revenue: number;
    revenueGrowth: number;
    orders: number;
    ordersGrowth: number;
    averageOrder: number;
    customers: number;
    currency: string;
};
type TrendPoint = { day: number; sales: number };
type Channel = { name: string; value: number; percent: number; color: string };
type Product = { name: string; category: string; sales: number; units: number, unit: string };
type Order = { id: string; customer: string; date: string; amount: number; status: string };
type Comment = { name: string; text: string; time: string };

const formatMoney = (value: number, currency: string) => `${value.toLocaleString('fa-AF')} ${currency}`;
const formatValue = (value: number) => `${(value / 1000).toFixed(1)}k`;
const statusLabels: Record<string, string> = { completed: 'تکمیل شده', draft: 'پیش‌نویس', cancelled: 'لغو شده', partially_returned: 'بازگشت جزئی', returned: 'بازگشت شده' };
const statusClasses: Record<string, string> = { completed: 'bg-emerald-50 text-emerald-700', draft: 'bg-amber-50 text-amber-700', cancelled: 'bg-rose-50 text-rose-700', partially_returned: 'bg-orange-50 text-orange-700', returned: 'bg-slate-100 text-slate-700' };

export default function Index({ stats, trend, channels, topProducts, orders, comments, meta }: { stats: Stats; trend: TrendPoint[]; channels: Channel[]; topProducts: Product[]; orders: Order[]; comments: Comment[]; meta: { month: string; currentRevenue: number; previousRevenue: number; revenueGrowth: number } }) {
    const [period, setPeriod] = useState('این ماه');

    return (
        <AppLayout breadcrumbs={[{ title: 'فروشات', href: '/sales' }]}>
            <Head title="داشبورد فروش" />
            <div
                dir="rtl"
                className="min-h-full space-y-5 bg-[#f6f9fc] px-1 pb-8 dark:bg-transparent"
            >
                <section className="relative overflow-hidden rounded-[1.75rem] bg-[#092b4c] px-6 py-6 text-white shadow-[0_20px_50px_rgba(9,43,76,0.2)] sm:px-8">
                    <div className="absolute -top-16 -left-12 h-48 w-48 rounded-full border-24 border-cyan-300/10" />
                    <div className="absolute right-1/3 -bottom-24 h-48 w-48 rounded-full border-30 border-blue-300/10" />
                    <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-sm text-cyan-200">
                                <BarChart3 className="h-4 w-4" /> گزارش عملکرد
                                فروش
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                فروشات دوکان و تحلیل آن
                            </h1>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                                تصمیم‌های بهتر با یک نگاه. خلاصه‌ای زنده از
                                درآمد، سفارش‌ها و رفتار مشتریان شما.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                className="bg-white/10 text-white hover:bg-white/20"
                                variant="ghost"
                            >
                                <Download className="h-4 w-4" /> خروجی گزارش
                            </Button>
                            <Button className="bg-accent text-slate-950 hover:bg-[#ffd34d]" onClick={() => router.get('/sales/create')}>
                                <Plus className="h-4 w-4" /> ثبت فروش جدید
                            </Button>
                        </div>
                    </div>
                </section>
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        title="درآمد خالص"
                        value={stats.revenue.toString()}
                        unit={stats.currency}
                        change={`${stats.revenueGrowth}٪`}
                        detail="در مقایسه با ماه قبل"
                        icon={CircleDollarSign}
                        tone="blue"
                    />
                    <KpiCard
                        title="تعداد سفارش‌ها"
                        value={stats.orders.toString()}
                        unit="سفارش"
                        change={`${stats.ordersGrowth}٪`}
                        detail="در ۳۰ روز گذشته"
                        icon={ShoppingBag}
                        tone="green"
                    />
                    <KpiCard
                        title="میانگین ارزش سفارش"
                        value={stats.averageOrder.toString()}
                        unit={stats.currency}
                        change="واقعی"
                        detail="میانگین سفارش‌های تکمیل‌شده"
                        icon={Target}
                        tone="amber"
                    />
                    <KpiCard
                        title="مشتریان فعال"
                        value={stats.customers.toString()}
                        unit="نفر"
                        change="فعال"
                        detail="مشتری ثبت‌شده این ماه"
                        icon={Users}
                        tone="violet"
                    />
                </section>

                <section className="grid gap-5 xl:grid-cols-[1.55fr_0.85fr]">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    روند درآمد
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    مقایسه درآمد در این ماه
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#006fdf]" />{' '}
                                    درآمد
                                </div>
                                <select
                                    value={period}
                                    onChange={(event) =>
                                        setPeriod(event.target.value)
                                    }
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    <option>این ماه</option>
                                    <option>ماه گذشته</option>
                                    <option>سه ماه اخیر</option>
                                </select>
                            </div>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={trend}
                                    margin={{
                                        top: 8,
                                        right: 4,
                                        left: -18,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="salesFill"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#006fdf"
                                                stopOpacity={0.22}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#006fdf"
                                                stopOpacity={0.01}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        vertical={false}
                                        stroke="#e8eef5"
                                    />
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        tickFormatter={(value) =>
                                            `${value} ${meta.month}`
                                        }
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        tickFormatter={formatValue}
                                    />
                                    <Tooltip
                                        formatter={(value) => [
                                            `${Number(value).toString()} افغانی`,
                                            'درآمد',
                                        ]}
                                        contentStyle={{
                                            borderRadius: 12,
                                            border: '1px solid #e2e8f0',
                                            direction: 'rtl',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="sales"
                                        stroke="#006fdf"
                                        strokeWidth={3}
                                        fill="url(#salesFill)"
                                        activeDot={{
                                            r: 5,
                                            fill: '#ffc107',
                                            strokeWidth: 3,
                                            stroke: '#fff',
                                        }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    کانال‌های فروش
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    سهم هر کانال از درآمد
                                </p>
                            </div>
                            <button
                                title="گزینه‌های بیشتر"
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="relative mx-auto mt-2 h-44 w-44">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={channels}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={58}
                                        outerRadius={78}
                                        paddingAngle={4}
                                        stroke="none"
                                    >
                                        {channels.map((channel) => (
                                            <Cell
                                                key={channel.name}
                                                fill={channel.color}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => [
                                            `${value}%`,
                                            'سهم',
                                        ]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                    100%
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    کل فروش
                                </span>
                            </div>
                        </div>
                        <div className="mt-2 space-y-3">
                            {channels.map((channel) => (
                                <div
                                    key={channel.name}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <span
                                            className="h-2.5 w-2.5 rounded-full"
                                            style={{
                                                backgroundColor: channel.color,
                                            }}
                                        />{' '}
                                        {channel.name}
                                    </div>
                                    <span className="font-bold text-slate-800 dark:text-white">
                                        {channel.percent}٪
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    محصولات پرفروش
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    محصولاتی که بیشترین درآمد را ساخته‌اند
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary"
                            >
                                مشاهده همه{' '}
                                <ArrowDownLeft className="h-3.5 w-3.5 rotate-45" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {topProducts.map((product, index) => (
                                <div
                                    key={product.name}
                                    className="flex items-center gap-3"
                                >
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-cyan-500'][index % 5]} text-white`}>
                                        <Package className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                {index + 1}. {product.name}
                                            </p>
                                            <span className="shrink-0 text-sm font-bold text-slate-800 dark:text-white">
                                                {product.sales} {getDariCurrency(stats.currency)}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                                            <span>
                                                {getDariCategory(product.category)} · {product.units} {getDariItemUnit(product.unit)} فروخته شد
                                            </span>
                                            <span className="font-semibold text-emerald-600">
                                                {index === 0 ? 'پرفروش‌ترین' : 'فروش واقعی'}
                                            </span>
                                        </div>
                                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                            <div
                                                className={`h-full rounded-full ${['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-cyan-500'][index % 5]}`}
                                                style={{
                                                    width: `${100 - index * 16}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    خلاصه روزانه
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    هدف فروش این ماه
                                </p>
                            </div>
                            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="h-32 w-32 shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trend.slice(-5)}>
                                        <Bar
                                            dataKey="sales"
                                            radius={[5, 5, 0, 0]}
                                            fill="#17b897"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {meta.revenueGrowth}٪
                                </p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    از هدف ماهانه
                                    <br />
                                    <span className="font-semibold text-emerald-600">
                                        {meta.revenueGrowth}٪ تغییر نسبت به ماه قبل
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
                            <span className="text-slate-500">
                                ماه قبل:{' '}
                                <b className="text-slate-700 dark:text-slate-200">
                                    {meta.previousRevenue} {getDariCurrency(stats.currency)}
                                </b>
                            </span>
                            <span className="text-slate-500">
                                باقی‌مانده:{' '}
                                <b className="text-slate-700 dark:text-slate-200">
                                    {meta.currentRevenue} {getDariCurrency(stats.currency)}
                                </b>
                            </span>
                        </div>
                    </div>
                </section>
                <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    آخرین سفارش‌ها
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    آخرین فعالیت‌های ثبت‌شده در فروش
                                </p>
                            </div>
                            <button
                                title="گزینه‌های بیشتر"
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"
                            >
                                <Ellipsis className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-140 text-right text-sm">
                                <thead className="border-b border-slate-100 text-xs text-slate-400 dark:border-slate-800">
                                    <tr>
                                        <th className="pb-3 font-medium">
                                            شماره سفارش
                                        </th>
                                        <th className="pb-3 font-medium">
                                            مشتری
                                        </th>
                                        <th className="pb-3 font-medium">
                                            زمان
                                        </th>
                                        <th className="pb-3 font-medium">
                                            مبلغ
                                        </th>
                                        <th className="pb-3 font-medium">
                                            وضعیت
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="border-b border-slate-50 last:border-0 dark:border-slate-800/70"
                                        >
                                            <td className="py-3 font-semibold text-primary">
                                                {order.id}
                                            </td>
                                            <td className="py-3 font-medium text-slate-700 dark:text-slate-200">
                                                {order.customer}
                                            </td>
                                            <td className="py-3 text-xs text-slate-400">
                                                {order.date}
                                            </td>
                                            <td className="py-3 font-semibold text-slate-700 dark:text-slate-200">
                                                {order.amount} {getDariCurrency(stats.currency)}
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClasses[order.status] ?? 'bg-slate-100 text-slate-700'}`}
                                                >
                                                    {statusLabels[order.status] ?? order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    یادداشت‌های تیم
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    آخرین نظرها درباره سفارش‌ها
                                </p>
                            </div>
                            <button
                                title="افزودن یادداشت"
                                className="rounded-lg bg-blue-50 p-2 text-primary hover:bg-blue-100"
                            >
                                <MessageSquareText className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div key={comment.name} className="flex gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                        {comment.name.slice(0, 1)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                {comment.name}
                                            </p>
                                            <span className="shrink-0 text-[10px] text-slate-400">
                                                {comment.time}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            {comment.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            className="mt-5 w-full border-dashed text-xs text-slate-600"
                        >
                            <MessageSquareText className="h-4 w-4" /> مشاهده همه
                            یادداشت‌ها
                        </Button>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}

function KpiCard({
    title,
    value,
    unit,
    change,
    detail,
    icon: Icon,
    tone,
}: {
    title: string;
    value: string;
    unit: string;
    change: string;
    detail: string;
    icon: typeof CircleDollarSign;
    tone: 'blue' | 'green' | 'amber' | 'violet';
}) {
    const tones = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        violet: 'bg-violet-50 text-violet-600',
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-slate-500">
                        {title}
                    </p>
                    <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">
                            {value}
                        </span>
                        <span className="text-[11px] text-slate-400">
                            {unit}
                        </span>
                    </div>
                </div>
                <div className={`rounded-xl p-2.5 ${tones[tone]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="flex items-center gap-0.5 font-semibold text-emerald-600">
                    <ArrowUpRight className="h-3.5 w-3.5" /> {change}
                </span>
                <span className="text-slate-400">{detail}</span>
            </div>
        </div>
    );
}
