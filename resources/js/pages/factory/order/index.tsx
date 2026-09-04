import { Link, router } from '@inertiajs/react';
import { Activity, ArrowLeft, ClipboardList, Factory, Filter, Plus, Recycle, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CustomeDropDownMenu } from '@/components/customer-dropdwon';
import { getDariCategory, getDariOrderStatus, getStatusColor } from '@/components/location-translator';
import { statusController } from '@/components/status-controller';
import { buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import AppLayout from '@/layouts/app-layout';
import type { ProductionOrder, StatusType } from '@/types';

interface Props {
    production_orders: ProductionOrder[];
}

const Index = ({ production_orders }: Props) => {

    const [search, setSearch] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<'all' | StatusType>('all');

    const filteredOrders = useMemo(() => production_orders.filter((order) => {
        const searchable = `${order.ordered_by} ${order.bom.category.name} ${order.reference_no ?? ''}`.toLowerCase();

        return searchable.includes(search.trim().toLowerCase())
            && (selectedStatus === 'all' || order.status === selectedStatus);
    }), [production_orders, search, selectedStatus]);

    const statusCounts = production_orders.reduce<Record<string, number>>((counts, order) => {
        counts[order.status] = (counts[order.status] ?? 0) + 1;

        return counts;
    }, {});

    const handleOrderStatus = (orderID: number, status: StatusType) => {
        router.put(`/factory/production-orders/${orderID}/change-status/${status}`);
    }

    const openOrder = (orderId: number | undefined) => {
        if (orderId === undefined) {
            return;
        }

        router.get(`/factory/production-orders/${orderId}`);
    };

    const options = [{ name: 'سفارشات آشغال ', url: '/factory/production-orders/junks' }]

    const clearFilters = () => {
        setSearch('');
        setSelectedStatus('all');
    };

    const getOrderAge = (orderDate: Date) => {
        const date = new Date(orderDate);

        if (Number.isNaN(date.getTime())) {
            return 'تاریخ نامشخص';
        }

        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfOrderDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const daysAgo = Math.floor((startOfToday.getTime() - startOfOrderDay.getTime()) / 86400000);

        if (daysAgo < 0) {
            return date.toLocaleDateString();
        }

        if (daysAgo === 0) {
            return 'امروز';
        }

        if (daysAgo === 1) {
            return 'دیروز';
        }

        return `${daysAgo} روز پیش`;
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'لیست سفارشات', href: '/factory/production_orders' },
            ]}
        >
            <div className="space-y-6 p-3 md:p-6">
                <div className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 md:px-10">
                    <div className="absolute -left-12 -top-16 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
                    <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-emerald-300"><Factory className="size-4" /> مرکز عملیات تولید</div>
                            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">سفارشات تولید</h1>
                            <p className="max-w-xl text-sm leading-6 text-slate-300">سفارش‌ها را اولویت‌بندی کنید و پیشرفت تولید را از همین‌جا کنترل کنید.</p>
                        </div>
                        <div className="flex gap-2">
                            <CustomeDropDownMenu items={options} />
                            <Link href="/factory/production-orders/create" className={`${buttonVariants({ variant: 'secondary' })} gap-2 bg-emerald-400 text-slate-950 hover:bg-emerald-300`}><Plus className="size-4" /> سفارش جدید</Link>
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">همه سفارشات</p><ClipboardList className="size-4 text-primary" /></div><p className="mt-2 text-2xl font-bold">{production_orders.length}</p></div>
                    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">در حال بررسی</p><Activity className="size-4 text-amber-500" /></div><p className="mt-2 text-2xl font-bold text-amber-600">{statusCounts.pending ?? 0}</p></div>
                    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">در حال تولید</p><Activity className="size-4 text-sky-500" /></div><p className="mt-2 text-2xl font-bold text-sky-600">{statusCounts.progress ?? 0}</p></div>
                </div>

                <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3"><div><div className="flex items-center gap-2"><Filter className="size-4 text-primary" /><h2 className="font-semibold">صف سفارش‌ها</h2></div><p className="mt-1 text-xs text-muted-foreground">برای باز کردن جزئیات، روی ردیف دوبار کلیک کنید.</p></div>{(search || selectedStatus !== 'all') && <button type="button" onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><X className="size-3" /> پاک کردن</button>}</div>
                    <div className="mb-5 grid gap-3 md:grid-cols-[1.5fr_1fr]">
                        <label className="relative block"><Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجو در سفارش‌دهنده، جنس یا شماره سفارش..." className="h-11 w-full rounded-md border border-input bg-background px-3 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
                        <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as 'all' | StatusType)} className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="all">همه حالت‌ها</option><option value="pending">در انتظار</option><option value="progress">در حال تولید</option><option value="completed">تکمیل شده</option></select>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableCaption>نمایش {filteredOrders.length} از {production_orders.length} سفارش</TableCaption>
                            <TableHeader><TableRow className="bg-muted/50 hover:bg-muted/50"><TableHead className="w-20 text-center">شماره</TableHead><TableHead className="text-center">سفارش کننده</TableHead><TableHead className="text-center">جنس</TableHead><TableHead className="text-center">حالت سفارش</TableHead><TableHead className="text-center">تاریخ سفارش</TableHead><TableHead className="text-center">تغییر حالت</TableHead><TableHead aria-label="باز کردن" /></TableRow></TableHeader>
                            <TableBody>{filteredOrders.length > 0 ? filteredOrders.map((order, ind) =>
                                <TableRow aria-disabled={order.status === 'cancelled'} className="cursor-pointer transition-colors hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20" key={order.id} onDoubleClick={() => openOrder(order.id)}>
                                    <TableCell className="text-center">{ind + 1}</TableCell>
                                    <TableCell className="text-center">{order.ordered_by}</TableCell>
                                    <TableCell className="text-center">{getDariCategory(order.bom.category.name)}</TableCell>
                                    <TableCell className={`text-center font-medium ${getStatusColor(order.status)}`}>{getDariOrderStatus(order.status)}</TableCell>
                                    <TableCell className="text-center text-sm text-muted-foreground">{getOrderAge(order.order_date)}</TableCell>
                                    <TableCell className="p-0 text-center"><DropdownMenu><DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md bg-slate-900 p-2 text-white hover:bg-slate-700"><Recycle className="size-4" /></DropdownMenuTrigger><DropdownMenuContent>{statusController(order.status).map((status) => <DropdownMenuItem key={status.value} disabled={status.value === order.status} className={status.value === order.status ? buttonVariants({ variant: 'default' }) : buttonVariants({ variant: 'secondary' })} onClick={() => handleOrderStatus(order.id, status.value)}>{status.label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></TableCell><TableCell className="w-8"><ArrowLeft className="size-4 text-muted-foreground" /></TableCell></TableRow>) : <TableRow><TableCell colSpan={7} className="p-10 text-center text-sm text-muted-foreground">سفارشی با این مشخصات پیدا نشد.</TableCell></TableRow>}</TableBody>
                        </Table>
                    </div>
                </section>
            </div>
        </AppLayout>
    )
}

export default Index