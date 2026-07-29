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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Link } from '@inertiajs/react';
import { salary } from "@/routes/employees/pay";
import { Salary } from "@/types";
import { ArrowDown } from "lucide-react";

interface Props {
    employeeId: number;
    currentMonthSalary: Salary[];
    previousMonthSalary: Salary[];
    salaryPerMonth: number;
}
export default function EmployeeHistory({ employeeId, currentMonthSalary, previousMonthSalary, salaryPerMonth }: Props) {
    return (
        <div className="mt-2">
            <Tabs defaultValue="overview" className="w-full ">
                <TabsList className="flex justify-between items-center w-full">
                    <TabsTrigger value="current-month-salary">تاریخ معاشات پرداخت شده ماه جریان</TabsTrigger>
                    <TabsTrigger value="previous-month-salary">تاریخ معاش پرداخت شده ما پیشین</TabsTrigger>

                    <TabsTrigger value="atendance-history">حاضری</TabsTrigger>

                </TabsList>
                <TabsContent value="current-month-salary">
                    <SalaryHitory employeeId={employeeId} salaries={currentMonthSalary} salaryPerMonth={salaryPerMonth} />
                </TabsContent>
                <TabsContent value="previous-month-salary">
                    <SalaryHitory employeeId={employeeId} salaries={previousMonthSalary} salaryPerMonth={salaryPerMonth} />
                </TabsContent>
                <TabsContent value="atendance-history">
                    User content
                </TabsContent>


            </Tabs>
        </div>
    )
}

interface SalaryHistoryProps {
    employeeId: number;
    salaries: Salary[];
    salaryPerMonth: number;
}
const SalaryHitory = ({ employeeId, salaries, salaryPerMonth }: SalaryHistoryProps) => {


    
    const paidSalary = salaries.reduce((acc, salary) => acc + salary.amount, 0);
    return (
        <Table>
            <TableCaption>معاش پرداخت شده در ماه جریان</TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-15">ID</TableHead>
                    <TableHead>مقدار معاش</TableHead>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>رسید</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {salaries.length > 0 ? salaries.map((salary, ind) => {

                    return (
                        <TableRow key={salary.id} className="hover:bg-secondary hover:border">
                            <TableCell>{ind + 1}</TableCell>
                            <TableCell className="font-medium">{salary.amount}</TableCell>
                            <TableCell>{new Date(salary.payment_date).toLocaleString()}</TableCell>
                            <TableCell>
                                <Link href={'/employees/'+employeeId+'/salary-receipt/'+salary.id} className="text-primary underline">
                                    چاپ
                                </Link>
                            </TableCell>
                        </TableRow>
                    );
                }) : <TableRow><TableCell colSpan={3} className="text-sm text-muted">در ماه جریان هیج معاش تا هنوز نګرفته</TableCell></TableRow>}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={3} className="text-right">
                        {paidSalary}
                    </TableCell>
                    <TableCell colSpan={1}>جمله معاش پرداخت شده</TableCell>
                </TableRow>
                
            </TableFooter>
        </Table>
    )
}