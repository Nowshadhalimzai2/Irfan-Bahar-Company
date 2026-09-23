import { SectionTitle } from '@/components/section-title';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverDescription, PopoverTrigger } from '@/components/ui/popover';
import AppLayout from '@/layouts/app-layout';
import { Attendance, Employee } from '@/types';
import React, { useEffect, useState } from 'react'
import { addDays } from "date-fns"
import { DateRange } from 'react-day-picker';
import axios from 'axios';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import PageHead from '@/components/page-head';
import { CalendarCheck } from 'lucide-react';

interface Props {
    totalAbsentDays: number;
    employee: Employee;
}
const AttendanceRecord = ({ totalAbsentDays, employee }: Props) => {

    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [presentDays, setPresentDays] = useState<number>(0);
    const [absentDays, setAbsentDays] = useState<number>(0);
    const [date, setDate] = useState<string>(new Date().toDateString());

    useEffect(() => {
        axios
            .post(`/employees/${employee.id}/attendance-range`, { date })
            .then((res) => {
                setAttendances(res.data['attendances']);
                setPresentDays(res.data['presentDays']);
                setAbsentDays(res.data['absentDays']);

            })

            .catch((err) => console.error(err));
    }, [employee.id, date])
    return (
        <AppLayout breadcrumbs={
            [
                { title: 'کارمندان', href: "/stackholders" },
                { title: employee.name, href: "/employees/" + employee.id },
                { title: `${employee.name} ریکورد حاضری`, href: `/emplyees/${employee.id}/attendance-record` },

            ]
        }>
            <div className="">
                <PageHead
                    HeadIcon={CalendarCheck}
                    title='معلومات حاضری'
                    subtitle={'حاضری ' + employee.name}
                    description={'شما اینجا معلومات حاضری با مشخص نمودن تاریخ دیده میتانین'}
                    tone='indigo'

                />
                <div className="grid grid-cols-1 gap-4 md:px-3 px-1">
                    <div id='DATE Selection' className='p-2 mt-5 shadow-lg bg-white  rounded-lg'>
                        <Input type={'month'} value={date.slice(0, 7)} onChange={(event) => setDate(event.target.value)} className="mt-1 block h-10 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none ring-primary focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                    </div>

                    <div className="mt-5  rounded-lg">
                        <div className="grid grid-cols-2 gap-2 md:gap-5 w-full place-items-center">
                            <div className={`font-medium  shadow-lg py-5 text-center text-sm bg-red-50 border-red-100 text-red-500 px-3 border-2 rounded-md w-full`}><span className="font-medium pr-1 text-primary">{absentDays}</span> تعداد روز های غیر حاضر</div>
                            <div className={`font-medium  shadow-lg py-5 text-center text-sm bg-green-50 border-green-100 text-green-500 px-3 border-2 rounded-md w-full `}> <span className="font-medium pr-1 text-primary">{presentDays}</span>تعداد روز های حاضر</div>
                        </div>

                    </div>
                    <div className="shadow-lg rounded-lg overflow-hidden bg-white">
                        <Table>
                            <TableCaption className="pb-2">لیست حاضری بین تاریخ ها انتخاب شده</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="flex-1 text-center">حاضری</TableHead>
                                    <TableHead className="flex-1 text-center">تاریخ</TableHead>
                                    <TableHead className="text-center">شماره</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendances.length > 0 ? attendances.map((attendance, ind) =>
                                    <TableRow key={ind}>
                                        <TableCell className="text-center">{attendance.is_present ? <span className="text-green-500">حاضر</span> : <span className="text-red-500"> غیر حاضر</span>}</TableCell>
                                        <TableCell className="text-center">{new Date(attendance.date).toLocaleDateString('fa-AF')}</TableCell>
                                        <TableCell className="text-center">{ind + 1}</TableCell>
                                    </TableRow>) : <p className="text-sm w-full ml-8 py-2 text-muted-foreground text-center mt-5">ریکورد موجود نیست، لطفا یک رنج دیګر را انتخاب کنین</p>}
                            </TableBody>

                        </Table>
                    </div>
                </div>


            </div>
        </AppLayout>)
}

export default AttendanceRecord