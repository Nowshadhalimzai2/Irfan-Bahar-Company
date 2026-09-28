import { CustomeDropDownMenu } from '@/components/customer-dropdwon';
import { SalaryPaymentDialog } from '@/components/employee/salary-payment_dialog';
import { getDariEmpPosition } from '@/components/location-translator';
import { SectionTitle } from '@/components/section-title';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Employee, Salary } from '@/types';
import { router, usePage } from '@inertiajs/react';
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

const money = (value:number)=>value.toFixed(0);
const Show = ({ employee,  thisMonthSalary, grossMonthSalary, absentDays, perDay, paidThisMonth, remainingSalary }: Props) => {
    const toggleAttendance = async (employee: Employee) => {

        router.post('/employees/' + employee.id + '/attendance-toggle', { employee: employee.id });
    };
    const {user} = usePage().props.auth as unknown as {user: {role_id: number}};
    const moreList = [
        { name: 'ریکورد معاشات', url: '/employees/' + employee.id + '/salary-record' },
        { name: 'ریکورد حاضری', url: `/employees/${employee.id}/attendance-record` },
        { name: 'ویرایش کارمند', url: `/employees/${employee.id}/edit` },


    ];
    return (
        <AppLayout breadcrumbs={[
            {
                title: 'کارکنند ګان',
                href: '/stackholders',
            },
            {
                title: employee.name,
                href: `/employees/${employee.id}`,
            },
        ]}>
            <section>
                {(user.role_id === 1  || user.role_id ===2 ) && <div className="flex justify-end items-end mt-5 px-5">
                    <CustomeDropDownMenu items={moreList} deletion={{ id: employee.id, url: '/employees/' + employee.id }} />
                </div>}
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
                                    <strong>معاش ناخالص:</strong> {money(grossMonthSalary)}
                                </p>
                                <p className="text-muted-foreground py-1 text-sm text-end">
                                    <strong>معاش تعدیل‌شده:</strong> {money(thisMonthSalary)}
                                </p>
                                <p className="text-muted-foreground py-1 text-sm text-end">
                                    <strong>پرداخت‌شده این ماه:</strong> {money(paidThisMonth)}
                                </p>
                                <p className="text-muted-foreground py-1 text-sm text-end">
                                    <strong>باقی‌مانده قابل پرداخت:</strong> {money(remainingSalary)}
                                </p>
                                <p className="text-muted-foreground py-1 text-sm text-end">
                                    <strong>کسر به‌خاطر غیبت‌ها:</strong> {absentDays} روز (هر روز: {money(perDay)})
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
                            <CardItem Icon={Briefcase} title="وظیفه" value={getDariEmpPosition(employee.position)} />
                            <CardItem Icon={DollarSign} title="معاش ماهان" value={employee.salary} />
                        </div>
                        <div className="moreInformation grid grid-cols-1 md:grid-cols-3 py-5 rounded-md bg-secondary px-5 place-items-center mt-5">
                            <div className="flex">
                                <span>{employee.address}</span>
                                <span> : ادرس</span>
                            </div>
                            <div className="flex space-x-1">
                                <span>{new Date(employee.recruitment_date).toLocaleDateString('fa-AF')}</span>
                                <span>:  تاریخ استخدام    </span>
                            </div>
                            <div className="flex">
                                <span>{employee.shift === "day" ? "روز" : "شب"}</span>
                                <span> : شفت کاری</span>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </AppLayout>
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

