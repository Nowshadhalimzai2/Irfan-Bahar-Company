import { CustomeDropDownMenu } from '@/components/customer-dropdwon';
import EmployeeHistory from '@/components/employee/employee-history';
import { SalaryPaymentDialog } from '@/components/employee/salary-payment_dialog';
import { SectionTitle } from '@/components/section-title';
import { Button } from '@/components/ui/button';
import { Employee, Salary } from '@/types';
import { router } from '@inertiajs/react';
import { Briefcase, DollarSign, Dot, LucideTrendingUp, Phone, User, UserCheck2Icon, UserX } from 'lucide-react';

interface Props {
    employee: Employee;
    currentMonthSalaries: Salary[];
    previousMonthSalaries: Salary[];
    thisMonthSalary: number;
    grossMonthSalary: number;
    absentDays: number;
    perDay: number;
    paidThisMonth: number;
    remainingSalary: number;
}
const Show = ({ employee, currentMonthSalaries, previousMonthSalaries, thisMonthSalary, grossMonthSalary, absentDays, perDay, paidThisMonth, remainingSalary }: Props) => {
    console.log('gross', grossMonthSalary, 'adjusted', thisMonthSalary, 'absent', absentDays);


    const toggleAttendance = async (employee: Employee) => {

        router.post('/employees/' + employee.id + '/attendance-toggle', { employee: employee.id });
    };
    const moreList = [
        { name: 'رکورد معاشات پرداخت شده', url: '/employees/' + employee.id + '/salary-record' },
        { name: 'رکورد حاضری', url: '/attendance-record' },

    ];
    return (
        <section>
            <div className="flex justify-end items-end">
                <CustomeDropDownMenu items={moreList} deletion={{id:employee.id, url:'/employees/'+employee.id}}/>
            </div>
            <div className="section">

                <SectionTitle title={`توضیحات ${employee.name}`} />
                ‍‍<div className="mx-auto max-w-3xl px-2 md:px-8">
                    <div className="grid grid-cols-2 gap-2 mb-5">
                        <div>
                            <SalaryPaymentDialog
                                employee={employee}
                                defaultAmount={remainingSalary}
                                maxAmount={remainingSalary}
                                grossMonthSalary={grossMonthSalary}
                                adjustedSalary={thisMonthSalary}
                                absentDays={absentDays}
                                perDay={perDay}
                                paidThisMonth={paidThisMonth}
                                remainingSalary={remainingSalary}
                            />
                            <p className="text-muted-foreground py-1 text-sm text-end">
                                <strong>معاش ناخالص:</strong> {grossMonthSalary}
                            </p>
                            <p className="text-muted-foreground py-1 text-sm text-end">
                                <strong>معاش تعدیل‌شده:</strong> {thisMonthSalary}
                            </p>
                            <p className="text-muted-foreground py-1 text-sm text-end">
                                <strong>پرداخت‌شده این ماه:</strong> {paidThisMonth}
                            </p>
                            <p className="text-muted-foreground py-1 text-sm text-end">
                                <strong>باقی‌مانده قابل پرداخت:</strong> {remainingSalary}
                            </p>
                            <p className="text-muted-foreground py-1 text-sm text-end">
                                <strong>کسر به‌خاطر غیبت‌ها:</strong> {absentDays} روز (هر روز: {perDay})
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

                    </div>
                    <div className="moreInformation grid grid-cols-1 md:grid-cols-3 py-5 rounded-md bg-secondary px-5 place-items-center mt-5">
                        <div className="flex">
                            <span>ادرس</span>
                            <span>{employee.address}</span>
                        </div>
                        <div className="flex">
                            <span>تاریخ استخدام</span>
                            <span>{new Date(employee.recruitment_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex">
                            <span>شفت کاری</span>
                            <span>{employee.shift === "day" ? "روز" : "شب"}</span>
                        </div>

                    </div>
                    <div className="">
                        <EmployeeHistory employeeId={employee.id} currentMonthSalary={currentMonthSalaries} previousMonthSalary={previousMonthSalaries} salaryPerMonth={employee.salary} />
                    </div>
                </div>
            </div>
        </section>
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

