import { Head, router } from '@inertiajs/react';
import { CustomeDropDownMenu } from '@/components/customer-dropdwon';
import { Account, Currency, Employee } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { useEffect, useMemo, useState } from 'react';
import {
    ArrowDownLeft,
    ArrowUpRight,
    BadgeCheck,
    BadgeAlert,
    BriefcaseBusiness,
    Building2,
    CircleDollarSign,
    Coins,
    Factory,
    PackageCheck,
    TrendingUp,
    Users,
    Wallet,
    Warehouse,
    LucideIcon,
    AlertTriangle,
    ShoppingCart,
    DollarSignIcon,
} from 'lucide-react';
import { getDariCurrency } from '@/components/location-translator';
import axios from 'axios';
import { Item, Transfer } from '@/types/item';

interface Props {
    sa: Account[];
    totalExpensesBasedOnCurrency: Record<string, number>;
    currencies: Currency[];
    transfersToShop: Transfer[];
    employees: Employee[];
    items: Item[];
    reorderItemsCount: number;
    totalAmountShopOwes: number;
    totalAmountOfAvailableItems: number;
    totalExpenses: Record<number, number>;
    todaysExpenses:Record<number,number>;
    todayIncomes:Record<number,number>;
}

export default function Dashboard({ todayIncomes,todaysExpenses,sa, totalExpensesBasedOnCurrency, currencies, transfersToShop, employees, items, reorderItemsCount, totalAmountShopOwes, totalAmountOfAvailableItems, totalExpenses }: Props) {
    
        
    const [currency, setCurrency] = useState<string>(currencies[0]?.name ?? 'USD');
    const [averageExpenses, setAverageExpenses] = useState<number>(0);

    useEffect(() => {
        const getRevenueAndExpenses = async () => {
            const response = await axios.get(`/total-revenue-and-expenses/${currency}`);
            if (response.status === 200) {
                setAverageExpenses(response.data);
            }
        };

        getRevenueAndExpenses();
    }, [currency]);

    
    const presentEmps: number = useMemo(
        () => employees.filter(emp => emp.attendances[emp.attendances.length - 1].is_present === true).length
        , []
    );

    const topTransfer = transfersToShop[0];

    const quickStats = [
        // {
        //     title: 'کل موجودی نقد',
        //     value: `${totalCashValue.toLocaleString()} ${getDariCurrency(currency)}`,
        //     subtitle: 'موجودی حساب‌های دکان',
        //     icon: Wallet,
        //     tone: 'emerald',
        // },
        {
            title: 'میانگین هزینه‌ها',
            value: `${averageExpenses.toFixed(2)} ${getDariCurrency(currency)}`,
            subtitle: 'در این ماه',
            icon: TrendingUp,
            tone: 'amber',
        },
        {
            title: 'نیازمند بررسی',
            value: reorderItemsCount.toString(),
            subtitle: 'اجناس کم در شدکت',
            icon: AlertTriangle,
            tone: 'red',
        },
        {
            title: 'موجوده اجناس در شرکت',
            value: items.length.toString(),
            subtitle: 'موجوده قلم اجناس',
            icon: PackageCheck,
            tone: 'sky',
        },

        {
            title: 'پول اجناس موجوده',
            value: totalAmountOfAvailableItems.toString(),
            subtitle: 'پول اجناس موجود در دوکان',
            icon: DollarSignIcon,
            tone: 'emerald',
        },

    ];

    const moreOptions: { name: string; url: string }[] = [
        { name: 'موقعیت ها', url: '/locations' },
        { name: 'تاریخچه اجرآات', url: '/logs' },
        { name: 'اجناس', url: '/items' },
        { name: 'تبادله اجناس', url: '/inventory-movements' },
        { name: 'فورموله ها', url: '/boms' },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'دشبورد', href: '/dashboard' }]}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-5 overflow-x-auto rounded-xl px-1 pb-3">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-linear-to-r from-slate-50 via-white to-slate-100 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Overview</p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-50">داشبورد مدیریت</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                            <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-slate-500">Currency</label>
                            <select
                                name='currency'
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className='bg-transparent text-sm font-medium text-slate-700 outline-none dark:text-slate-200'
                            >
                                {currencies.map((currencyOption) => (
                                    <option key={currencyOption.id} value={currencyOption.name}>
                                        {getDariCurrency(currencyOption.name)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <CustomeDropDownMenu items={moreOptions} />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {quickStats.map(({ title, value, subtitle, icon: Icon, tone }) => (
                        <div
                            key={title}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
                                    <h3 className="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-50">{value}</h3>
                                </div>
                                <div className={`rounded-2xl p-3 ${tone === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                                    tone === 'amber' ? 'bg-amber-100 text-amber-600' :
                                        tone === 'violet' ? 'bg-violet-100 text-violet-600' :

                                            tone === 'red' ? 'bg-red-50 text-red-600' : 'bg-sky-100 text-sky-600'
                                    }`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                                    <CircleDollarSign className="h-4 w-4" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">حساب‌های نقدی</h2>
                            </div>
                            <div className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                                {sa.length} حساب
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {sa.map((account) => (
                                <BalanceCard
                                    key={account.id}
                                    account={account}
                                    todaysExpenses={todaysExpenses}
                                    LucideIcon={Wallet}
                                    todaysIncomes={todayIncomes}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="rounded-xl bg-violet-100 p-2 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
                                    <Users className="h-4 w-4" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">کارمندان</h2>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <EmployeeDashboardCard title='کل کارکنان' value={employees.length} Icon={BriefcaseBusiness} color='violet' />
                            <EmployeeDashboardCard title='حاضر' value={presentEmps} Icon={BadgeCheck} color='emerald' />
                            <EmployeeDashboardCard title='غیر حاضر' value={employees.length - presentEmps} Icon={BadgeAlert} color='rose' />
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[0.95fr_1.35fr]">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="rounded-xl bg-sky-100 p-2 text-sky-600 dark:bg-sky-950 dark:text-sky-300">
                                    <Factory className="h-4 w-4" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">عملکرد روزانه</h2>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/50">
                                <div className="flex items-center justify-between text-sm text-emerald-700 dark:text-emerald-300">
                                    <span>درآمد امروز</span>
                                    <ArrowUpRight className="h-4 w-4" />
                                </div>
                                <p className="mt-2 text-xl font-bold text-emerald-700 dark:text-emerald-200">{(averageExpenses * 1.3).toFixed(2)} {getDariCurrency(currency)}</p>
                            </div>

                            <div className="rounded-2xl bg-rose-50 p-3 dark:bg-rose-950/50">
                                <div className="flex items-center justify-between text-sm text-rose-700 dark:text-rose-300">
                                    <span>هزینه امروز</span>
                                    <ArrowDownLeft className="h-4 w-4" />
                                </div>
                                <p className="mt-2 text-xl font-bold text-rose-700 dark:text-rose-200">{averageExpenses.toFixed(2)} {getDariCurrency(currency)}</p>
                            </div>

                            <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-800">
                                <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                                    <span>آخرین انتقال</span>
                                    <Building2 className="h-4 w-4" />
                                </div>
                                <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {topTransfer ? topTransfer.reference_no : 'بدون داده'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="rounded-xl bg-amber-100 p-2 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                                    <Warehouse className="h-4 w-4" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">اجناس تازه به دوکان</h2>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {transfersToShop.length} مورد
                            </span>
                        </div>

                        <div className="space-y-2">
                            {transfersToShop.length > 0 ? (
                                transfersToShop.map((transfer, index) => (
                                    <div
                                        key={transfer.id}
                                        onClick={() => router.get(`transfers/${transfer.id}`)}
                                        className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-primary/30 hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-800/80"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-100">{transfer.reference_no}</p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    {transfer.transfer_lines[0]?.item.category.name ?? '—'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-left text-[11px] text-slate-500 dark:text-slate-400">
                                            {new Date(transfer.transferred_at).toLocaleDateString('fa-IR')}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    در حال حاضر هیچ انتقالی ثبت نشده است.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="">
                    <div className='grid grid-cols-1 gap-2 md:gap-5  md:grid-cols-2 '>
                        <div className=" gap-3 flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
                            <div className="flex justify-between">
                                <div className="flex gap-2 text-indigo-500">
                                    <Coins />
                                    <h4 className="text-xl font-semibold">{totalAmountShopOwes}</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    پول اجناس
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                جمله پول اجناس انتقال شده به دوکان
                            </p>
                        </div>
                        <div className=" gap-3 flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
                            <div className="flex justify-between">
                                <div className="flex gap-2 text-fuchsia-500">
                                    <Coins />
                                    <h4 className="text-xl font-semibold">{totalExpenses[currencies.filter(cur => cur.name == currency)[0].id] ?? 0}</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    پول پرداخت شده
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                جمله پول پرداخت شده به دفتر
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

interface BalanceProps {
    todaysExpenses: Record<number, number>;
    todaysIncomes: Record<number, number>;
    account: Account;
    LucideIcon: LucideIcon;
}

const BalanceCard = ({ todaysExpenses, account, LucideIcon,todaysIncomes }: BalanceProps) => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-linear-to-b from-white to-slate-50 p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md dark:border-slate-700 dark:from-slate-900 dark:to-slate-950">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{getDariCurrency(account.currency.name)}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-50">{account.amount.toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                    <LucideIcon className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-100 p-2.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                <div className="flex items-center justify-between gap-2 ">
                    <span>هزینه امروز</span>
                    <span>{todaysExpenses[account.currency.id]?.toLocaleString() || 0}</span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                    <span>درآمد امروز</span>
                    <span>{todaysIncomes[account.currency.id-1]?.toLocaleString() || 0}</span>
                </div>
            </div>
        </div>
    );
};

interface EMPCard {
    value: number;
    Icon: LucideIcon;
    title: string;
    color: 'violet' | 'emerald' | 'rose';
}

const EmployeeDashboardCard = ({ value, Icon, title, color }: EMPCard) => {
    const colors = {
        violet: 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300',
        emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
        rose: 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300',
    };

    return (
        <div
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800"
            onClick={() => router.get('/stackholders')}
        >
            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{title}</p>
                <h4 className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</h4>
            </div>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[color]}`}>
                <Icon className="h-5 w-5" />
            </div>
        </div>
    );
};