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

interface Props {
    totalAbsentDays: number;
    employee: Employee;
}
const AttendanceRecord = ({ totalAbsentDays, employee }: Props) => {
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), 0, 12),
        to: addDays(new Date(new Date().getFullYear(), 0, 12), 30),
    });
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [presentDays, setPresentDays] = useState<number>(0);
    const [absentDays, setAbsentDays] = useState<number>(0);

    useEffect(() => {
        axios
            .post(`/employees/${employee.id}/attendance-range`, { from: dateRange?.from, to: dateRange?.to })
            .then((res) => {
                setAttendances(res.data['attendances']);
                setPresentDays(res.data['presentDays']);
                setAbsentDays(res.data['absentDays']);

            })

            .catch((err) => console.error(err));
    }, [employee.id, dateRange])
    return (
        <AppLayout breadcrumbs={
            [
                { title: 'کارمندان', href: "/stackholders" },
                { title: employee.name, href: "/employees/" + employee.id },
                { title: `${employee.name} ریکورد حاضری`, href: `/emplyees/${employee.id}/attendance-record` },

            ]
        }>
            <div className="max-w-2xl px-3 mx-auto w-full section">
                <SectionTitle title={`${employee.name} ریکورد حاضری`} />
                <div className="flex flex-col justify-center items-center">
                    <div className="">
                        <div className="w-full">
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
                        <div className="text-end space-x-5 font-medium md:text-lg mt-8 text-accent"><span>{new Date(dateRange?.to ?? '')
                            .toDateString()}  : الی </span> <span>{new Date(dateRange?.from ?? '').toDateString()}  : از تاریخ</span></div>
                    </div>
                    <div className="flex justify-end items-end w-full mt-5">
                        <div className="grid grid-cols-2 gap-2 md:gap-5 w-full place-items-center">
                            <div className={`font-medium py-5 text-center text-sm bg-red-50 border-red-100 text-red-500 px-3 border-2 rounded-md w-full`}><span className="font-medium pr-1 text-primary">{absentDays}</span> تعداد روز های غیر حاضر</div>
                            <div className={`font-medium py-5 text-center text-sm bg-green-50 border-green-100 text-green-500 px-3 border-2 rounded-md w-full `}> <span className="font-medium pr-1 text-primary">{presentDays}</span>تعداد روز های حاضر</div>
                        </div>

                    </div>
                    <div className="w-full mt-8 bg-muted text-primary border rounded-sm">
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
                                        <TableCell className="text-center">{new Date(attendance.date).toDateString()}</TableCell>
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