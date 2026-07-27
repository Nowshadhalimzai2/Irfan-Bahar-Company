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
import { SectionTitle } from "../section-title";
import { Employee } from "@/types";
import { Link, router } from "@inertiajs/react";
import { buttonVariants } from "../ui/button";
import { UserCheck2Icon, UserX } from "lucide-react";
import { route } from 'ziggy-js';
import axios from "axios";
interface Props {
  employees: Employee[];
}

function EmployeeList({ employees }: Props) {

  const toggleAttendance = async (employee: Employee) => {
    console.log(employee.today_attendance?.is_present);
    
    router.post('/employees/' + employee.id + '/attendance-toggle', { employee: employee.id });
  };
  console.log(employees);

  return (
    <section className="section">
      <div className="flex flex-col justify-end items-end">
        <Link href={"/employees/create"} className={buttonVariants({ variant: "default" })}>
          کاریګر اضافه کنین
        </Link>
      </div>
      <div>
        <SectionTitle title="Employee List" description="Here you can see the list of all employees" />
        <Table>
          <TableCaption>A list of your recent attendance.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-15">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Present </TableHead>
              <TableHead>Absent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attendance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee, ind) => {
              const isPresent = employee.today_attendance?.is_present ?? true;

              return (
                <TableRow key={employee.id} className="hover:bg-secondary hover:border" onClick={()=>router.get("/employees/"+employee.id)}>
                  <TableCell>{ind + 1}</TableCell>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.position.replace('_',' ')}</TableCell>
                  <TableCell>{employee.salary}</TableCell>
                  <TableCell>{employee.present_days}</TableCell>
                  <TableCell>{employee.absent_days}</TableCell>
                  <TableCell className={employee.status ? "text-green-500 " : "text-red-500 "}>
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
              <TableCell colSpan={3}>Total employees salary</TableCell>
              <TableCell className="text-right">
                معاش دارد {employees.reduce((acc, emp) => acc + emp.salary, 0)} کار کن/ګان {employees.length}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </section>
  );
}

export default EmployeeList;