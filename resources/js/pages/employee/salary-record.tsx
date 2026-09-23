import { SectionTitle } from '@/components/section-title';
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Employee, Salary } from '@/types';
import React, { useEffect, useMemo, useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { addDays } from "date-fns"

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
import { Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';
import PageHead from '@/components/page-head';
import { Coins } from 'lucide-react';

interface Props {
    salaryRecords: Salary[];
    employee: Employee;
}

const SalaryRecrod = ({ salaryRecords, employee }: Props) => {
    const [date, setDate] = useState<string>(new Date().toDateString());

    const [salaries, setSalaries] = useState<Salary[]>(salaryRecords);

    // Fetch salary records when the selected date or employee changes
    useEffect(() => {
        axios
            .post(`/employees/${employee.id}/salary-range`, { date })
            .then((res) => {
                setSalaries(res.data['salaries']);
            })

            .catch((err) => console.error(err));
    }, [employee.id, date]);
    const paidAmount: number = useMemo(() => salaries.reduce((acc, salary) => acc += salary.amount, 0), [salaries])


    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کامندان', href: '/stackholders' },
                { title: employee.name, href: `/employees/${employee.id}` },
                { title: `${employee.name} رکورد معاشات`, href: `/employees/${employee.id}/-salary-record` },
            ]}
        >
            <div className="px-4 max-w-4xl mx-auto w-full mt-5">
                <PageHead
                    HeadIcon={Coins}
                    title='معلومات معاش'
                    subtitle={'معاش ' + employee.name}
                    description={'شما اینجا معلومات معاشات با مشخص نمودن تاریخ دیده میتانین'}
                    tone='cyan'

                />
                <div className="grid grid-cols-1 gap-3">

                    <div id='DATE Selection' className='p-2 mt-5 shadow-lg bg-white  rounded-lg'>
                        <Input type={'month'} value={date.slice(0, 7)} onChange={(event) => setDate(event.target.value)} className="mt-1 block h-10 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none ring-primary focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                    </div>

                    <div className="shadow-lg bg-white rounded-lg ">
                        <div className="text-end font-medium p-8">
                            <div className="y-1 ">نام : {employee.name}</div>
                            <div className="">معاش ماهانه : {employee.salary}</div>
                            <div className="">جمله پول اخد نموده : {paidAmount}</div>
                            <div className="">بقایه معاش : {employee.salary - paidAmount}</div>
                            <h2 className="text-red-500 text-xl font-bold">{employee.salary - paidAmount === 0 && 'وصول شده'}</h2>
                        </div>
                    </div>

                    <div className="shadow-lg bg-white rounded-lg p-2">
                        <Table dir='rtl'>
                            <TableCaption> اخذ نموده {employee.name} رکورد معاشات</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-15 text-center">شماره</TableHead>
                                    <TableHead className='text-center'>مقدار</TableHead>
                                    <TableHead className='text-center'>تاریخ</TableHead>
                                    <TableHead className='text-center'>رسید</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody >
                                {salaries.length > 0 ? salaries.map((salary, ind) => {
                                    return (
                                        <TableRow key={salary.id} className="hover:bg-secondary hover:border">
                                            <TableCell className='text-center'>{ind + 1}</TableCell>
                                            <TableCell className="font-medium text-center">{salary.amount}</TableCell>
                                            <TableCell className='text-center'>{new Date(salary.payment_date).toLocaleDateString('fa-AF')}</TableCell>
                                            <TableCell className='text-center'>
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
                </div>
            </div>
        </AppLayout >
    )
}

export default SalaryRecrod;

