import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SectionTitle } from "../section-title";
import { Employee } from "@/types";
import { Link } from "@inertiajs/react";
import { buttonVariants } from "../ui/button";

interface Props {
  employees: Employee[];
}
function EmployeeList({ employees }: Props) {
  return (
    <section className="section">
      <div className="flex flex-col justify-end items-end">
        <Link href={'/employees/create'} className={buttonVariants({
          variant:'default'
        })}>کاریګر اضافه  کنین</Link>
      </div>
      <div>
        <SectionTitle title="Employee List" description="Here you can see the list of all employees" />
        <Table>
          <TableCaption>A list of your recent invoices.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-25">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="">Salary</TableHead>
              <TableHead className="">Status</TableHead>

            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee, ind) => (
              <TableRow key={employee.id}>
                <TableCell>{ind + 1}</TableCell>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>{employee.salary}</TableCell>
                <TableCell className={employee.status?"text-green-500":"text-red-500"}>{employee.status?"Active":"Left"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total employees salary</TableCell>
              <TableCell className="text-right">  معاش دارد {employees.reduce((acc,emp)=>acc+=emp.salary,0)} کار کن/ګان  {employees.length}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </section>
  )
}

export default EmployeeList;