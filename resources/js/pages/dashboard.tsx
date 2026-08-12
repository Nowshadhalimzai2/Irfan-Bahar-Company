import { Head } from '@inertiajs/react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { dashboard } from '@/routes';
import { CustomeDropDownMenu } from '@/components/customer-dropdwon';
import { Account } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { format } from 'date-fns';

interface Props {
    sa: Account[];
    totalExpensesBasedOnCurrency: Record<string, number>;
}

export default function Dashboard({ sa, totalExpensesBasedOnCurrency }: Props) {

    const [date, setDate] = useState<Date>(new Date());
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
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex justify-end items-end">
                    <CustomeDropDownMenu items={moreOptions} />
                </div>
                <div>
                    <Popover>
                        <PopoverTrigger>
                            <Button type="button" variant="ghost" id="date-picker-simple" className="justify-start w-full font-normal">
                                {date ? format(date, "PPP") : <span>تاریخ را انتخاب کنید</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                required
                                selected={date}

                                defaultMonth={date}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="border rounded-sm p-2 md:p-5 text-secondary-foregroun dark:bg-white">
                    <h4 className="text-center text-accent font-semibold p-5 drop-shadow-accent text-lg">حساب دوکان</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {sa.map(s =>
                            <div className="border px-3 py-5 rounded-sm flex flex-col bg-secondary justify-center items-center ">
                                <span className="text-secondary-foreground">{s.currency.name}</span>
                                <span className="text-primary font-semibold text-2xl">{s.amount}</span>
                                <p className="text-sm text-muted-foreground text-center mt-3">
                                    <span>رفت پول امروز: {totalExpensesBasedOnCurrency[s.currency.id]?.toLocaleString() || 0} </span><span>امد پول امروز: 120030</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

