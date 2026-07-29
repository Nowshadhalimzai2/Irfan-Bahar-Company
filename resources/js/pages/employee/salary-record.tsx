import { SectionTitle } from '@/components/section-title';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Employee, Salary } from '@/types';
import { useEffect, useMemo, useState } from 'react'
import { format } from "date-fns"
import { Button, buttonVariants } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';

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
import axios from 'axios';
import { route } from 'ziggy-js';
import { Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

interface Props {
    salaryRecords: Salary[];
    employee: Employee;
}

const SalaryRecrod = ({ salaryRecords, employee }: Props) => {
    type DateRangeType = { startOfMonth: Date | string, endOfMonth: Date | string };
    const [date, setDate] = useState<Date>(new Date());
    const [salaries, setSalaries] = useState<Salary[]>(salaryRecords);
    const [dateRange, setDateRange] = useState<DateRangeType>({ startOfMonth: 'جریان ', endOfMonth: 'جریان' });

    // Fetch salary records when the selected date or employee changes
    useEffect(() => {
        axios
            .post(`/employees/${employee.id}/salary-range`, { date })
            .then((res) => {
                setSalaries(res.data['salaries']);
                setDateRange({ startOfMonth: res.data['startOfMonth'], endOfMonth: res.data['endOfMonth'] });


            })

            .catch((err) => console.error(err));
    }, [employee.id, date]);
    const paidAmount: number = useMemo(() => salaries.reduce((acc, salary) => acc += salary.amount, 0), [salaries])
    useEffect(() => {
        console.log("records", salaries);
    }, [salaries]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کامندان', href: '/stackholders' },
                { title: employee.name, href: `/employees/${employee.id}` },
                { title: `${employee.name} رکورد معاشات`, href: `/employees/${employee.id}/-salary-record` },
            ]}
        >
            <div className="px-4 max-w-4xl mx-auto w-full">
                <SectionTitle title="لست ریکارد " />
                <div className="flex flex-row-reverse justify-between items-center bg-white rounded-md shadow mb-5">
                    <div className="text-end font-medium p-8">
                        <div className="y-1 ">نام : {employee.name}</div>
                        <div className="">معاش ماهانه : {employee.salary}</div>
                        <div className="">جمله پول اخد نموده : {paidAmount}</div>
                        <div className="">بقایه معاش : {employee.salary - paidAmount}</div>
                        <h2 className="text-red-500 text-xl font-bold">{employee.salary - paidAmount === 0 && 'وصول شده'}</h2>
                    </div>
                </div>
                <div className=" ">
                    <Field>
                        <Popover>
                            <Label htmlFor="date-picker-simple" className="text-end">ماه را انتخا کنین</Label>
                            <PopoverTrigger>
                                <Button type="button" variant="outline" id="date-picker-simple" className="justify-start w-full font-normal">
                                    {date ? format(date, "PPP") : <span>تاریخ را انتخاب کنید</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    required
                                    selected={date}
                                    onSelect={(selected) => {
                                        setDate(selected as Date);
                                        // setData('payment_date', selected as Date);
                                    }}
                                    defaultMonth={date}
                                />
                            </PopoverContent>
                        </Popover>
                    </Field>
                </div>
                <div className="text-center font-medium text-lg mt-10 "> {dateRange.endOfMonth.toString()} از تاریخ  {dateRange.startOfMonth.toString()}  الی </div>
                <Table className=" ">
                    <TableCaption> اخذ نموده {employee.name} رکورد معاشات</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-15">شماره</TableHead>
                            <TableHead>مقدار</TableHead>
                            <TableHead>تاریخ</TableHead>
                            <TableHead>رسید</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody >
                        {salaries.length > 0 ? salaries.map((salary, ind) => {
                            return (
                                <TableRow key={salary.id} className="hover:bg-secondary hover:border">
                                    <TableCell>{ind + 1}</TableCell>
                                    <TableCell className="font-medium">{salary.amount}</TableCell>
                                    <TableCell>{new Date(salary.payment_date).toDateString()}</TableCell>
                                    <TableCell>
                                        <Link href={'/employees/' + employee.id + '/salary-receipt/' + salary.id} className="text-primary underline">
                                            چاپ
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            );
                        }) : <TableRow >
                            <TableCell colSpan={3} className="flex items-center justify-center">
                                <Link href={`/employees/${employee.id}`} className={`${buttonVariants({ variant: 'link' })} text-sm font-normal`}>معاش پرداخت کنین</Link>
                                <p className="text-muted-foreground ">هیچ ریکار وجود ندارد دراین ماه</p></TableCell>
                        </TableRow>}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={3}>جمله معاش پرداخت شده</TableCell>
                            <TableCell className="text-right">
                                {salaries.reduce((acc, salary) => acc + salary.amount, 0)}
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </AppLayout >
    )
}

export default SalaryRecrod;

