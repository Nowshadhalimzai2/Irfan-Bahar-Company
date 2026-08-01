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
import { SectionTitle } from '@/components/section-title';
import { Popover, PopoverContent, PopoverDescription, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';

interface Props {
    expenses: Expense[];
}
const Index = ({ expenses }: Props) => {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), 0, 12),
        to: addDays(new Date(new Date().getFullYear(), 0, 12), 30),
    });
    const [expensesList, setExpensesList] = useState<Expense[]>(expenses);

    const totalExpenses = useMemo(() => {
        const totalAfg = expensesList.filter(exp => exp.currency.name === 'AFG').reduce((acc, exp) => acc += exp.amount, 0);
        const totalUSD = expensesList.filter(exp => exp.currency.name === 'USD').reduce((acc, exp) => acc += exp.amount, 0);
        const totalPKR = expensesList.filter(exp => exp.currency.name === 'PKR').reduce((acc, exp) => acc += exp.amount, 0);

        return { 'totalAfg': totalAfg, 'totalUSD': totalUSD, 'totalPKR': totalPKR }
    }, [expensesList]);

    useEffect(() => {
        const getExpenses = async () => {
            if (!dateRange?.from || !dateRange?.to) {
                return;
            }

            try {
                const expensesResponse = await axios.get('/expenses/expenses-range', {
                    params: {
                        from: dateRange.from.toISOString(),
                        to: dateRange.to.toISOString(),
                    },
                });

                if (expensesResponse.status === 200) {
                    setExpensesList(expensesResponse.data.expenses ?? []);
                }
            } catch (error) {
                console.error(error);
            }
        };

        void getExpenses();
    }, [dateRange]);
    return (
        <AppLayout breadcrumbs={
            [
                { title: 'فورم مصارف', href: '/expenses/create' },
                { title: 'ریکوردمصارف ', href: "/expesnes" }
            ]
        }>
            <div className="section">
                <SectionTitle title="ریکورد مصارف " description="مصارف امروز اینجا دیده میتانی" />
                <div className="max-w-3xl mx-auto flex justify-center items-center w-full p-5">
                    <Popover>
                        <PopoverTrigger className="w-full"><Button variant={'outline'} className="w-full">{new Date(dateRange?.from ?? '').toDateString()} - to - {new Date(dateRange?.to ?? '').toDateString()}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <PopoverDescription className="text-center pt-1 text-sm"> لطف نموده تاریخ را انتخاب کنین</PopoverDescription>
                            <Calendar
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                                className="rounded-lg border"
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="max-w-3xl mx-auto  bg-white rounded-md shadow p-5">
                    <Table>
                        <TableCaption className=""> مصارف تاریخ {new Date().toLocaleDateString()} را اینجا دیده میتانی</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>تاریخ </TableHead>
                                <TableHead>واحد پول</TableHead>
                                <TableHead>مقدار پول</TableHead>
                                <TableHead>توضیحات</TableHead>
                                <TableHead className="">شماره</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expensesList.map((expense, ind) => {
                                return (
                                    <TableRow key={ind} className="hover:bg-secondary hover:border">
                                        <TableCell>{new Date(expense.date).toDateString()}</TableCell>
                                        <TableCell>{expense.currency.name}</TableCell>
                                        <TableCell>{expense.amount}</TableCell>
                                        <TableCell className="font-medium flex-1">{expense.description}</TableCell>
                                        <TableCell className="text-center">{ind + 1}</TableCell>
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