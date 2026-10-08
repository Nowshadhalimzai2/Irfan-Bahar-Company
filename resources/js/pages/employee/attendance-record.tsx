
import axios from 'axios';
import { CalendarCheck, GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react'
import PageHead from '@/components/page-head';
import PersionDatePicker from '@/components/persion-date-picker';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { Attendance, Employee } from '@/types';

interface Props {
    totalAbsentDays: number;
    employee: Employee;
}
const AttendanceRecord = ({ employee }: Props) => {

    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [presentDays, setPresentDays] = useState<number>(0);
    const [absentDays, setAbsentDays] = useState<number>(0);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [persianDate, setPersianDate] = useState<string | null>(null);

    useEffect(() => {
        axios
            .post<{ attendances: Attendance[]; presentDays: number; absentDays: number }>(
                `/employees/${employee.id}/attendance-range`,
                { persianDate },
            )
            .then((res) => {
                setAttendances(res.data.attendances);
                setPresentDays(res.data.presentDays);
                setAbsentDays(res.data.absentDays);
            })
            .catch((err) => console.error(err));
    }, [employee.id, persianDate]);

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
                    ActionIcon={GraduationCap}
                    actionTitle={`تاریخ استخدام ${new Date(employee.recruitment_date).toLocaleDateString('fa-AF')}`}
                />
                <div className="grid grid-cols-1 gap-4 md:px-3 px-1">
                    <div className="my-3 shadow-lg border bg-white rounded-lg p-3 ">
                        <PersionDatePicker
                            id='persion_date'
                            key={'persiond'}
                            label='انتخاب تاریخ'
                            type='month'
                            onChange={(date, formattedDate) => {
                                setSelectedDate(date)
                                setPersianDate(formattedDate);
                            }}
                            initialDate={new Date()}
                            
                        />
                       
                    </div>
                    <div className="mt-5  rounded-lg">
                        <div className="grid grid-cols-2 gap-2 md:gap-5 w-full place-items-center">
                            <div className={`font-medium  shadow-lg py-5 text-center text-sm bg-red-50 border-red-100 text-red-500 px-3 border-2 rounded-md w-full`}><span className="font-medium pr-1 text-primary">{absentDays}</span> تعداد روز های غیر حاضر</div>
                            <div className={`font-medium  shadow-lg py-5 text-center text-sm bg-green-50 border-green-100 text-green-500 px-3 border-2 rounded-md w-full `}> <span className="font-medium pr-1 text-primary">{presentDays}</span>تعداد روز های حاضر</div>
                        </div>

                    </div>
                    <div className="shadow-lg rounded-lg overflow-hidden bg-white">
                        <Table>
                            <TableCaption className="pb-2">لیست حاضری در ماه انتخاب شده</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="flex-1 text-center">حاضری</TableHead>
                                    <TableHead className="flex-1 text-center">تاریخ</TableHead>
                                    <TableHead className="text-center">شماره</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendances.length > 0 ? attendances.filter(att=>!att.is_present).map((attendance, ind) =>
                                    <TableRow key={attendance.id}>
                                        <TableCell className="text-center">{attendance.is_present ? <span className="text-green-500">حاضر</span> : <span className="text-red-500"> غیر حاضر</span>}</TableCell>
                                        <TableCell className="text-center">{new Date(attendance.date).toLocaleDateString('fa-AF')}</TableCell>
                                        <TableCell className="text-center">{ind + 1}</TableCell>
                                    </TableRow>) : <TableRow><TableCell colSpan={3} className="py-4 text-center text-sm text-muted-foreground">در این ماه {employee.name} غیر حاضری ندارد</TableCell></TableRow>}
                            </TableBody>

                        </Table>
                    </div>
                </div>


            </div>
        </AppLayout>)
}

export default AttendanceRecord