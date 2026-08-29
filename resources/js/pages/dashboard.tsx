import { Head } from '@inertiajs/react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { CustomeDropDownMenu } from '@/components/customer-dropdwon';
import { Account, Currency } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Calendar as CalenderUI } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CurrencyIcon, LucideIcon } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import { getDariCurrency } from '@/components/location-translator';
import axios from 'axios';

interface Props {
    sa: Account[];
    totalExpensesBasedOnCurrency: Record<string, number>;
    currencies: Currency[];
}

export default function Dashboard({ sa, totalExpensesBasedOnCurrency, currencies }: Props) {
    const [currency, setCurrency] = useState<string>(currencies[0].name);
    const [totalRevenue, setTotalRevenue] = useState<number>(0);
    const [averageExpenses, setAverageExpenses] = useState<number>(0);

    useEffect(()=>{
        const getRevenueAndExpenses = async ()=>{
            const response = await axios.get(`/total-revenue-and-expenses/${currency}`);
            if(response.status===200){
                console.log('success:',response.data);
                setAverageExpenses(response.data);
            }
            else{
                console.log('Errro: ',response.statusText);
                
            }
        }
        getRevenueAndExpenses();
    },[currency])

    const moreOptions: { name: string; url: string }[] = [
        { name: 'موقعیت ها', url: '/locations' },
        { name: 'تاریخچه اجرآات', url: '/logs' },
        { name: 'اجناس', url: '/items' },
        { name: 'تبادله اجناس', url: '/inventory-movements' },
        { name: 'فورموله ها', url: '/boms' },

    ]
    return (
        <AppLayout breadcrumbs={[
            {
                title: 'دشبورد',
                href: '/dashbaord',
            },
        ]}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl px-1">
                <div className="flex justify-end items-end">
                    <CustomeDropDownMenu items={moreOptions} />
                </div>
                {/* <Calendar /> */}
                <div className=''>
                    <section className='MONTHLYREVINEUE px-5 border  rounded-sm py-3'>
                        <div>
                            <select name='currency' onChange={(e)=>setCurrency(e.target.value)} className='w-full border p-1.5 rounded-sm my-1'>
                                {currencies.map(currency => <option key={currency.id} value={currency.name}>{getDariCurrency(currency.name)}</option>)}
                            </select>
                        </div>
                        <div className='w-full flex justify-between '>
                            <div>
                                <div className='flex flex-col py-2'>
                                    <div className='px-3 border-b -space-y-1'>
                                        <h3 className='text-lg font-medium text-teal-500'>Total Revenue</h3>
                                        <small className='text-[11px] text-muted-foreground'>This Month</small>
                                    </div>
                                    <div className='px-3 flex space-x-2 items-center -space-y-1 mt-2'>
                                        <h3 className='text-2xl font-semibold text-teal-700'>00000</h3>
                                        <small className='text-[11px] text-muted-foreground'>{getDariCurrency(currency)}</small>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className='flex flex-col py-1 '>
                                    <div className='px-3 border-b '>
                                        <h3 className='text-lg font-medium text-teal-500'>Ave Expenses</h3>
                                        <small className='text-[11px] text-muted-foreground'>This Month</small>
                                    </div>
                                    <div className='px-3 flex space-x-2 items-center -space-y-1  mt-2'>
                                        <h3 className='text-2xl font-semibold text-teal-700'>{averageExpenses.toFixed(2)}</h3>
                                        <small className='text-[11px] text-muted-foreground'>{getDariCurrency(currency)}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <fieldset className=" p-1 mt-3 border rounded-sm bg-muted md:p-3 text-secondary-foregroun">
                        {/* <h4 className="text-center text-accent font-semibold p-3 drop-shadow-accent text-lg">حساب دوکان</h4> */}
                        <legend className='font-medium text-accent text-shadow-lg'>حساب دوکان</legend>
                        <div className="">
                            <div className="grid grid-cols-1 px-3 md:px-1 md:grid-cols-3 gap-5">
                                {sa.map(s =>
                                    <BalanceCard key={s.id} LucideIcon={CurrencyIcon} account={s} totalExpensesBasedOnCurrency={totalExpensesBasedOnCurrency} />
                                )}
                            </div>
                        </div>
                    </fieldset>

                </div>

            </div>
        </AppLayout>
    );
}

const Calendar = () => {
    const [date, setDate] = useState<Date>(new Date());

    return (
        <div>
            <Popover>
                <PopoverTrigger>
                    <Button type="button" variant="ghost" id="date-picker-simple" className="justify-start w-full font-normal">
                        {date ? format(date, "PPP") : <span>تاریخ را انتخاب کنید</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <CalenderUI
                        mode="single"
                        required
                        selected={date}

                        defaultMonth={date}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}

interface BalanceProps {
    className?: string;
    totalExpensesBasedOnCurrency: Record<string, number>;
    account: Account;
    LucideIcon: LucideIcon;
}
const BalanceCard = ({ className, totalExpensesBasedOnCurrency, account, LucideIcon }: BalanceProps) => {

    return (
        <div className='border-l-4 dark:border-accent hover:border-accent hover:bg-accent-foreground group transition-all hover:scale-101 shadow border-secondary-foreground bg-white px-2 py-5 rounded-sm 
            dark:bg-accent-foreground 
        '>
            <div className='flex gap-3 justify-end'>
                <div className='space-x-1 flex justify-center items-center'>
                    <span className="text-secondary-foreground  group-hover:text-accent dark:text-accent text-sm ">{getDariCurrency(account.currency.name)}</span>
                    <span className="text-primary font-semibold group-hover:text-accent dark:text-accent text-2xl">{account.amount}</span>
                </div>
                <span className='w-fit p-2 text-primary bg-primary/10 rounded-sm group-hover:text-accent group-hover:bg-accent/20 dark:text-accent '>
                    {<LucideIcon className=' ' />}
                </span>
            </div>
            <div className={" flex flex-col justify-center items-center " + className}>


                <p className="text-sm text-muted-foreground text-center mt-3 group-hover:text-accent/70">
                    <span>رفت پول امروز: {totalExpensesBasedOnCurrency[account.currency.id]?.toLocaleString() || 0} </span><span>امد پول امروز: 120030</span>
                </p>
            </div>
        </div>
    )
}