import AppLayout from '@/layouts/app-layout';
import { Expense } from '@/types';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { addDays } from "date-fns"
import { DateRange } from 'react-day-picker';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverDescription, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import PageHead from '@/components/page-head';
import { Coins, HandCoins } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PersionDatePicker from '@/components/persion-date-picker';
import { getDariCurrency } from '@/components/location-translator';

interface Props {
    expenses: Expense[];
}
const Index = ({ expenses }: Props) => {
    const [selectedDate,setSelectedDate] = useState<Date|null>(null);
    const [persionDate,setPersianDate] = useState<string|null>(null);
    const [period,setPeriod] = useState<'daily' |'monthly'>('monthly');

    
    const [expensesList, setExpensesList] = useState<Expense[]>(expenses);

    const totalExpenses = useMemo(() => {
        const totalAfg = expensesList.filter(exp => exp.currency.name === 'AFG').reduce((acc, exp) => acc += exp.amount, 0);
        const totalUSD = expensesList.filter(exp => exp.currency.name === 'USD').reduce((acc, exp) => acc += exp.amount, 0);
        const totalPKR = expensesList.filter(exp => exp.currency.name === 'PKR').reduce((acc, exp) => acc += exp.amount, 0);

        return { 'totalAfg': totalAfg, 'totalUSD': totalUSD, 'totalPKR': totalPKR }
    }, [expensesList]);

    useEffect(() => {
        const getExpenses = async () => {
           
            try {
                const res = await axios.get('/expenses/expenses-range', {
                    params: {
                        persionDate,selectedDate,period
                    },
                });

                if (res.status === 200) {
                    setExpensesList(res.data.expenses ?? []);
                    console.log(res.data);
                    
                }
            } catch (error) {
                console.error(error);
            }
        };

        void getExpenses();
    }, [persionDate,selectedDate,period]);
    return (
        <AppLayout breadcrumbs={
            [
                { title: 'فورم مصارف', href: '/expenses/create' },
                { title: 'ریکوردمصارف ', href: "/expesnes" }
            ]
        }>
            <div className="px-1 md:px-3">
                <PageHead
                    HeadIcon={HandCoins}
                    subtitle={` مصارف ماه ${new Date(selectedDate?? new Date()).toLocaleDateString('fa-AF',{month:'long'})}`}
                    title='مدیریت مصارف'
                    description='مصارف ماه انتخاب شده. شاید این محاسبه کمه تفاوت داشته باشد.'
                    key={persionDate}
                />
                <div className="max-w-3xl mx-auto  w-full m-4 grid grid-cols-1 gap-3 ">
                    <div className="grid gap-3" dir='rtl'>
                        <select className='bg-white py-2 rounded-xl shadow-md border' onChange={(e)=>setPeriod(e.target.value as 'monthly'|'daily')}>
                            <option value={'monthly'}>ماهانه</option>
                            <option value={'daily'}>روزانه</option>
                        </select>
                    </div>
                    <PersionDatePicker 
                        id='expenses'
                        key={'expenses'}
                        type={period=='monthly'? 'month':'date'}
                        onChange={(date,formatted)=>{
                            setSelectedDate(date);
                            setPersianDate(formatted);
                        }}
                        value={selectedDate}
                        
                    />
                </div>
                <div className="max-w-3xl mx-auto  bg-white rounded-md shadow-md border p-5" dir='rtl'>
                    <Table>
                        <TableCaption className=""> مصارف تاریخ {new Date().toLocaleDateString('fa-AF',{
                            year:"numeric",
                            month:'long',
                        })} را اینجا دیده میتانی</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center">شماره</TableHead>
                                <TableHead className='text-center'>توضیحات</TableHead>
                                <TableHead className='text-center'>مبلغ</TableHead>
                                <TableHead className='text-center'>تاریخ </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expensesList.map((expense, ind) => {
                                return (
                                    <TableRow key={expense.id} className="hover:bg-secondary hover:border">
                                        <TableCell className="text-center">{ind + 1}</TableCell>
                                        <TableCell className="font-medium text-center flex-1">{expense.description}</TableCell>
                                        <TableCell className='text-center'>{expense.amount} {getDariCurrency(expense.currency.name)}</TableCell>
                                        <TableCell className='text-center'>{new Date(expense.date).toLocaleDateString('fa-AF')}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={1} className="text-center text-sm text-muted-foreground">
                                    جمله مصارف کلداری {totalExpenses['totalPKR']}
                                </TableCell>
                                <TableCell colSpan={1} className="text-center text-sm text-muted-foreground">
                                    جمله مصارف دالر {totalExpenses['totalUSD']}
                                </TableCell>
                                <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                                    جمله مصارف افغانی {totalExpenses['totalAfg']}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </div>
        </AppLayout>
    )
}

export default Index