import EmployeeHistory from '@/components/employee/employee-history';
import SalaryHistory from '@/components/employee/employee-history';
import { SalaryPaymentDialog } from '@/components/employee/salary-payment_dialog';
import { SectionTitle } from '@/components/section-title';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import employees from '@/routes/employees';
import { Employee, Salary } from '@/types';
import { router } from '@inertiajs/react';
import { BadgeDollarSign, Briefcase, CalendarDays, DollarSign, Dot, ListStart, LocateFixedIcon, LucideIcon, LucideProps, LucideTrendingUp, MapPin, Moon, OctagonIcon, Phone, Sun, User, UserCheck2Icon, UserX } from 'lucide-react';
import React from 'react'

interface Props {
    employee: Employee;
    currentMonthSalaries: Salary[];
    previousMonthSalaries: Salary[];
    thisMonthSalary:number;
}
const Show = ({ employee, currentMonthSalaries, previousMonthSalaries,thisMonthSalary }: Props) => {
    console.log('current month salary', thisMonthSalary);
    

    const toggleAttendance = async (employee: Employee) => {

        router.post('/employees/' + employee.id + '/attendance-toggle', { employee: employee.id });
    };

    return (
        <div className="section">
            <SectionTitle title={`توضیحات ${employee.name}`} />
            ‍‍<div className="mx-auto max-w-3xl px-2 md:px-8">
                <div className="grid grid-cols-2 gap-2 mb-5">
                    <div>
                        <SalaryPaymentDialog employee={employee} />

                        <p className="text-muted-foreground py-1 text-sm text-end">
                            بقایه معاش: 5000.0
                        </p>
                    </div>
                    <div>
                        <Button variant={"secondary"} className="hover:bg-primary/10 w-full" onClick={() => toggleAttendance(employee)}> {employee.today_attendance?.is_present ? (
                            <>
                                <span> غیر حاضر کردن</span>
                                <UserX className="text-red-500 size-5" />
                            </>
                        ) : (
                            <>
                                <span>حاضر کردن</span>
                                <UserCheck2Icon className="text-green-500 size-5" />
                            </>
                        )}</Button>
                        <p className="text-muted-foreground py-1 text-sm text-end">
                            {employee.today_attendance?.is_present ? " در سیستم حاضر است" : " در سیستم غیر حاضر است"}
                        </p>
                    </div>
                </div>

                {/* ====================== CARD ITEMS OF EMPLOYEE ======================= */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    <CardItem Icon={User} title="نام کار کن" value={employee.name} />
                    <CardItem Icon={User} title="نام پدر" value={employee.f_name} />
                    <div className="border flex justify-center items-center flex-col  rounded-sm p-4 shadow gap-y-2">
                        <Dot className={`size-12 p-0  ${employee.status ? "text-green-500" : "text-red-500"}`} />
                        <span className="text-primary">{employee.status ? "Active" : "Left"}</span>
                    </div>
                    <CardItem Icon={Phone} title="شماره تماس" value={employee.phone} />
                    <CardItem Icon={Briefcase} title="وظیفه" value={employee.position} />
                    <CardItem Icon={DollarSign} title="معاش ماهان" value={employee.salary} />
                    <CardItem Icon={MapPin} title="آدرس" value={employee.address} />
                    <div className="border flex justify-center items-center flex-col  rounded-sm p-4 shadow gap-y-2">
                        <ListStart className="size-9 text-accent" />
                        <span className="text-primary">{new Date(employee.recruitment_date).toDateString()}</span>
                    </div>

                    <CardItem Icon={employee.shift == "day" ? Sun : Moon} title="شفت کاری" value={employee.shift} />

                </div>
                <div className=" mt-5">
                    <EmployeeHistory currentMonthSalary={currentMonthSalaries} previousMonthSalary={previousMonthSalaries} salaryPerMonth={employee.salary} />
                </div>
            </div>
        </div>
    )
}

export default Show

interface CardItem {
    title: string;
    value: string | number;
    Icon: typeof LucideTrendingUp;

}
const CardItem = ({ title, value, Icon }: CardItem) => {

    return (
        <div title={title} className="border flex justify-center items-center flex-col  rounded-sm p-4 shadow gap-y-2">
            <Icon className="size-9 text-accent" />
            <span className="text-primary">{value}</span>
        </div>
    )
}

