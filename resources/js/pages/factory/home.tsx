import { Link } from "@inertiajs/react";
import { Activity, AlertTriangle, ArrowLeft, ClipboardList, Factory, Package, Search, SearchX, SlidersHorizontal, Warehouse } from "lucide-react";
import { useMemo, useState } from "react";
import HighProductionChart from "@/components/custome-charts/high-production-chart";
import LocationTranslator, { getDariCategory, getDariItemUnit, locationColor } from "@/components/location-translator";
import PageLinks from "@/components/page-links";
import { buttonVariants } from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";
import type { InventoryBalance, ProductionOrder } from "@/types";
import type { Item } from "@/types/item";

type ItemWithInventory = Item & {
  inventory_balances: InventoryBalance[];
}

interface Props {
  items: {
    data: ItemWithInventory[];
    current_page: number;
    from: number;
    last_page: number;
    links: {
      url: string | null;
      label: string;
      active: boolean;
    }[];
  };
  pendingOrders: ProductionOrder[];
  productionChart: Record<string, string | number>[];
  topProductionCategories: {
    id: number;
    name: string;
    total: number;
  }[];
}
const Home = ({ pendingOrders, items, productionChart, topProductionCategories }: Props) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const totalStock = (item: ItemWithInventory) => {
    return item.inventory_balances.reduce((acc, balance) => acc + (balance.quantity_on_hand - balance.reserved), 0);
  }

  const totalReserved = items.data.reduce((total, item) => total + item.inventory_balances.reduce((sum, balance) => sum + balance.reserved, 0), 0);

  const totalAvailable = items.data.reduce((total, item) => total + totalStock(item), 0);

  const lowStockItems = items.data.filter((item) => totalStock(item) <= 10);

  const categories = useMemo(() => Array.from(new Set(items.data.map((item) => item.category.name))), [items.data]);

  const filteredItems = useMemo(() => items.data.filter((item) => {
    const searchable = `${item.name} ${item.sku} ${item.category.name}`.toLowerCase();

    return searchable.includes(search.toLowerCase()) && (category === 'all' || item.category.name === category);
  }), [category, items.data, search]);

  return (
    <AppLayout breadcrumbs={[
      { title: 'کارخانه', href: '/factory/home' },
    ]}>
      <div className="space-y-6 p-3 md:p-6">
        <div className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 md:px-10">
          <div className="absolute -left-12 -top-16 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-300"><Factory className="size-4" /> مرکز عملیات تولید</div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">داشبورد کارخانه</h1>
              <p className="max-w-xl text-sm leading-6 text-slate-300">وضعیت موجودی، سفارش تولید و عملکرد کارخانه را یکجا بررسی کنید.</p>
            </div>
            <Link href="/factory/production-orders/create" className={`${buttonVariants({ variant: 'secondary' })} gap-2 bg-emerald-400 text-slate-950 hover:bg-emerald-300`}><ClipboardList className="size-4" /> سفارش جدید</Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">اجناس قابل استفاده</p><Package className="size-4 text-primary" /></div><p className="mt-2 text-2xl font-bold text-primary">{totalAvailable.toLocaleString()}</p></div>
          <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">اجناس محفوظ شده</p><ClipboardList className="size-4 text-amber-500" /></div><p className="mt-2 text-2xl font-bold text-amber-600">{totalReserved.toLocaleString()}</p></div>
          <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">سفارش منتظر</p><Activity className="size-4 text-sky-500" /></div><p className="mt-2 text-2xl font-bold text-sky-600">{pendingOrders.length}</p></div>
          <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">نیازمند بررسی</p><AlertTriangle className="size-4 text-rose-500" /></div><p className="mt-2 text-2xl font-bold text-rose-600">{lowStockItems.length}</p></div>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <section className="min-w-0 rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="flex items-center gap-2"><Warehouse className="size-4 text-primary" /><h2 className="font-semibold">موجودی کارخانه</h2></div><p className="mt-1 text-xs text-muted-foreground">موجودی آزاد در هر موقعیت</p></div>
              <Link href="/inventory-balances" className="flex items-center gap-1 text-xs text-primary hover:underline">جزئیات موجودی <ArrowLeft className="size-3" /></Link>
            </div>
            <div className="mb-4 grid gap-3 md:grid-cols-[1.4fr_1fr]">
              <label className="relative block"><Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجو در نام، SKU یا دسته‌بندی..." className="h-10 w-full rounded-md border border-input bg-background px-3 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
              <label className="relative block"><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pl-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="all">همه دسته‌بندی‌ها</option>{categories.map((item) => <option key={item} value={item}>{getDariCategory(item)}</option>)}</select><SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /></label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                {filteredItems.length > 0 ? filteredItems.map((item) =>
                  <div className="rounded-xl border border-border/70 bg-background p-4 transition-shadow hover:shadow-md" key={item.id}>
                    <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="font-semibold">{item.name}</h3><p className="mt-1 text-xs text-muted-foreground">{item.sku} · {getDariCategory(item.category.name)}</p></div><span className={`rounded-full px-2 py-1 text-xs ${totalStock(item) <= 10 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}>{totalStock(item) <= 10 ? 'موجودی کم' : 'موجود'}</span></div>
                    <div className="space-y-2">{item.inventory_balances.map((balance) => <div key={balance.location.id} className="flex items-center justify-between border-b border-border/50 pb-2 text-sm last:border-0 last:pb-0"><span className={locationColor(balance.location.name)}>{LocationTranslator(balance.location.name)}</span><span>{balance.quantity_on_hand} {getDariItemUnit(item.unit)} <span className="text-xs text-muted-foreground">({balance.reserved} رزرو)</span></span></div>)}</div>
                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground"><span>ارزش تقریبی</span><strong className="text-foreground">{(item.default_sale_price * totalStock(item)).toLocaleString()} افغانی</strong></div>
                  </div>) : <p className="col-span-full flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground"><SearchX className="size-4" /> رکورد موجود نیست!</p>
                }
              </div>
            <div className="mt-5 border-t border-border/60 pt-3"><PageLinks links={items.links} /></div>
          </section>

          <section className="space-y-6">
              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:p-5">
                <div className="mb-4 flex items-center justify-between"><div><div className="flex items-center gap-2"><ClipboardList className="size-4 text-primary" /><h2 className="font-semibold">سفارشات در انتظار</h2></div><p className="mt-1 text-xs text-muted-foreground">صف بررسی تولید</p></div><span className="rounded-full bg-sky-100 px-2 py-1 text-xs text-sky-700 dark:bg-sky-950 dark:text-sky-300">{pendingOrders.length} مورد</span></div>
                  <div className="space-y-2">
                      {pendingOrders.length > 0 ? pendingOrders.map(order =>
                        <div key={order.id} className="rounded-lg border border-border/70 bg-background p-3">
                          <div className="flex items-start justify-between gap-2"><div><p className="font-medium">{getDariCategory(order.bom.category.name)}</p><p className="mt-1 text-xs text-muted-foreground">مسؤول: {order.ordered_by}</p></div><span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">در انتظار</span></div>
                          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>{new Date(order.order_date).toLocaleDateString()}</span><span>{order.production_outputs.reduce((acc, output) => acc + output.quantity_produced, 0)} تولید</span></div>
                        </div>
                      ) :
                        <p className="text-center text-sm text-muted-foreground">کدام حواله در حال منتظر موجود نیست!</p>
                      }
                      <Link href="/factory/production-orders" className="flex items-center justify-center gap-1 pt-3 text-sm text-primary hover:underline">مشاهده همه سفارشات <ArrowLeft className="size-3" /></Link>
                    </div>
              </div>
              <HighProductionChart
                productionChart={productionChart}
                topProductionCategories={topProductionCategories}
              />
          </section>
          </div>
        </div>

    </AppLayout>
  )
}



export default Home