import { getDariCategory, getDariCurrency, getDariItemUnit } from '@/components/location-translator';
import PageHead from '@/components/page-head';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { ArrowDownLeft, Package, TrendingUp } from 'lucide-react';
import { FormEvent, useState } from 'react';
type Product = { name: string; category: string; sales: number; units: number, unit: string };

interface Props {
    topProducts: Product[];
    filters: { period: 'daily' | 'monthly'; date: string };
}
const TopProduct = ({ topProducts, filters }: Props) => {
    const [date, setDate] = useState(filters.date);
    const [period, setPeriod] = useState<'daily' | 'monthly'>(filters.period);

    const applyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get('/sales/most-sold-products', { period, date }, { preserveScroll: true });
    };

    const changePeriod = (nextPeriod: 'daily' | 'monthly') => {
        setPeriod(nextPeriod);
        setDate((currentDate) => nextPeriod === 'monthly' ? currentDate.slice(0, 7) : currentDate.length === 7 ? `${currentDate}-01` : currentDate);
    };
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'فروشات', href: '/sales' },
                { title: 'محصولات ُپرفروش', href: '/sales/most-sold-products' }

            ]}
        >

            <PageHead
                HeadIcon={TrendingUp}
                title='اجناس که زیات فروخته شده است'
                subtitle='محصولات پر فروش'
                description='اجناس ذیل طبقه بندی شده به اساس درآمد از درک دوکان'
                key={0}
            />

            <div className="px-2 py-1 md:px-5 md:py-3 lg:px-8 lg:py-5" dir='rtl'>
                <div className="grid grid-cols-1 gap-5">
                    <form onSubmit={applyFilters} className='grid grid-cols-1 md:grid-cols-3 gap-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900'>
                        <select className='border rounded-lg h-11' value={period} onChange={(e) => changePeriod(e.target.value as 'daily' | 'monthly')} >
                            <option value="monthly">ماهان</option>
                            <option value="monthly">رزوانه</option>
                        </select>
                        <div className="">
                            <Input className='h-11' type={period === 'daily' ? 'date' : 'month'} value={period === 'monthly' ? date.slice(0, 7) : date} onChange={(e) => setDate(e.target.value)} required />
                        </div>
                        <div className='gap-5 flex justify-center items-center'>
                            <Button type="submit" className='h-11 w-full'>فلتر </Button>
                        </div>
                    </form>
                    {/* ========== MAIN CONTENT ===========*/}
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
                                onClick={() => router.get('/sales')}
                            >
                                بازګشت به فروشات
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
                                                {product.sales} {getDariCurrency('AFG')}
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

                    {/* ---------- main content ------------ */}
                </div>
            </div>
        </AppLayout>
    )
}

export default TopProduct