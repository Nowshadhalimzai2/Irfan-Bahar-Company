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
import { Employee, Role } from "@/types";
import { router, usePage } from "@inertiajs/react";
import { UserCheck, UserCheck2Icon, UserIcon, Users2Icon, UserX } from "lucide-react";
import PageHead from "../page-head";
import { getDariEmpPosition } from "../location-translator";
import { User } from "@/types/auth";

interface Props {
  employees: Employee[];
}

function EmployeeList({ employees }: Props) {
  const { auth, roles } = usePage().props;
  const canAddEmployee = ['admin', 'super_admin', 'shop_clerk'].includes(
    roles[auth.user.role_id]?.name,
  );

  const toggleAttendance = async (employee: Employee) => {

    router.post('/employees/' + employee.id + '/attendance-toggle', { employee: employee.id });
  };

  return (
    <section className="py-5">
      <PageHead title='کارمندان' subtitle="کارمندان شرکت " HeadIcon={Users2Icon} description="کارمندان ثبت ګردیده در سیستم را اینجا دیده میتانی"
        actionTitle={canAddEmployee ? 'کارمند جدید' : ''}
        actionURL={canAddEmployee ? '/employees/create' : ''}
      />
      <div id="Summery" className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-5 lg:grid-cols-3 " dir="rtl">
        <div className="p-4 mt-5 rounded-xl shadow-lg   border bg-white">
          <div className="flex justify-between">
            <small className="text-muted-foreground text-sm">تعداد کل کارمندان</small>
            <span className="bg-blue-50 p-2 rounded-md">
              <UserIcon className="text-blue-500" />
            </span>
          </div>
          <p className="font-semibold text-2xl mt-3">{employees.length}</p>
        </div>
        <div className="p-4 mt-5 rounded-xl shadow-lg  border bg-white">
          <div className="flex justify-between">
            <small className="text-muted-foreground text-sm"> حاضر</small>
            <span className="bg-green-50 p-2 rounded-md">
              <UserCheck className="text-green-500" />
            </span>
          </div>
          <p className="font-semibold text-2xl mt-3">{employees.filter(emp => emp.today_attendance?.is_present).length}</p>
        </div>
        <div className="p-4 mt-5 rounded-xl shadow-lg  border bg-white">
          <div className="flex justify-between">
            <small className="text-muted-foreground text-sm">غیر حاضر</small>
            <span className="bg-red-50 p-2 rounded-md">
              <UserX className="text-red-500" />
            </span>
          </div>
          <p className="font-semibold text-2xl mt-3">{employees.filter(emp => !emp.today_attendance?.is_present).length}</p>
        </div>
      </div>
      <div className="p-2 border mt-6 bg-white shadow-xl rounded-lg" dir="rtl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-15 text-center">شماره</TableHead>
              <TableHead className="text-center">اسم</TableHead>
              <TableHead className="text-center">وظیفه</TableHead>
              <TableHead className="text-center">معاش</TableHead>
              <TableHead className="text-center">حاضر </TableHead>
              <TableHead className="text-center">غیر حاضر</TableHead>
              <TableHead className="text-center">وضیعت</TableHead>
              <TableHead className="text-center">حاضری</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee, ind) => {
              const isPresent = employee.today_attendance?.is_present ?? true;
              return (
                <TableRow key={employee.id} className="hover:bg-secondary hover:border" onClick={() => router.get("/employees/" + employee.id)}>
                  <TableCell>{ind + 1}</TableCell>
                  <TableCell className="font-medium text-center">{employee.name}</TableCell>
                  <TableCell className="text-center">{getDariEmpPosition(employee.position)}</TableCell>
                  <TableCell className="text-center">{employee.salary}</TableCell>
                  <TableCell className="text-center">{employee.present_days}</TableCell>
                  <TableCell className="text-center">{employee.absent_days}</TableCell>
                  <TableCell className={`text-center ${employee.status ? "text-green-500 " : "text-red-500"}`}>
                    {employee.status ? "Active" : "Left"}
                  </TableCell>
                  <TableCell className="flex justify-center items-center hover:border transition-all duration-200 rounded-md hover:bg-secondary-foreground border-primary">
                    <button type="button" onClick={() => toggleAttendance(employee)}>
                      {isPresent ? (
                        <UserCheck2Icon className="text-green-500" />
                      ) : (
                        <UserX className="text-red-500" />
                      )}
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="text-right" colSpan={6}>
                جمله معاشات کارمندان  {' '}
               {employees.reduce((acc, emp) => acc + emp.salary, 0)} افغانی
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </section>
  );
}

export default EmployeeList;

