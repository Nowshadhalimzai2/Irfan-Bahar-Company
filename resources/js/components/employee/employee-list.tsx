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
import { Filter, FilterIcon, UserCheck, UserCheck2Icon, UserIcon, Users2Icon, UserX } from "lucide-react";
import PageHead from "../page-head";
import { getDariEmpPosition } from "../location-translator";
import { Input } from "../ui/input";
import { useEffect, useState } from "react";

interface Props {
  employees: Employee[];
}

function EmployeeList({ employees }: Props) {
  const [emps,setEmps] = useState<Employee[]>(employees);
  const [searchTerm,setSearchTerm] = useState<string>('');
  const [filter,setFilter] = useState<'all' | 'absent' | 'present'>('all');
  const { role } = usePage().props.auth;
  const canAddEmployee = ['admin', 'super_admin',].includes(
      role.toLowerCase()
  );
  useEffect(()=>{
    const tremmedTerm=searchTerm.trim().toLowerCase();
    if(searchTerm==='')
      setEmps(employees);
    else{
      const fileteredEmps= employees.filter(({name,position}:Employee)=>name.trim().toLowerCase().includes(tremmedTerm) ||
      position.trim().toLowerCase().includes(tremmedTerm)
    );
      setEmps(fileteredEmps);
    }
    
  },[searchTerm]);
  useEffect(()=>{
    if(filter=='all')
      setEmps(employees)
    else{
       const filteredEmps=employees.filter(emp=>filter=='present' ? emp.today_attendance?.is_present:filter==='absent'? !emp.today_attendance?.is_present: emps);
      setEmps(filteredEmps);
    }

  },[filter]);
  const toggleAttendance = async (employee: Employee) => {

    router.post('/employees/' + employee.id + '/attendance-toggle', { employee: employee.id },{preserveScroll:true});
  };

  
  return (
    <section className="py-5">
      <PageHead title='کارمندان' subtitle="کارمندان شرکت " HeadIcon={Users2Icon} description="کارمندان ثبت ګردیده در سیستم را اینجا دیده میتانی"
        actionTitle={canAddEmployee ? 'کارمند جدید' : ''}
        actionURL={canAddEmployee ? '/employees/create' : ''}
      />
      <div className="grid gap-5" dir="rtl">
        <div id="Summery" className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-5 lg:grid-cols-3 " >
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
            <p className="font-semibold text-2xl mt-3">{emps.filter(emp => emp.today_attendance?.is_present).length}</p>
          </div>
          <div className="p-4 mt-5 rounded-xl shadow-lg  border bg-white">
            <div className="flex justify-between">
              <small className="text-muted-foreground text-sm">غیر حاضر</small>
              <span className="bg-red-50 p-2 rounded-md">
                <UserX className="text-red-500" />
              </span>
            </div>
            <p className="font-semibold text-2xl mt-3">{emps.filter(emp => !emp.today_attendance?.is_present).length}</p>
          </div>
        </div>


        <div className="FilterSection grid gap-5 bg-white rounded-xl p-3 shadow-xl  border">
          <div className="flex justify-between items-center ">
            <h4 className="text-primary text-md font-medium p-2 rounded-sm">فلتر</h4>
            <div className="p-1.5 text-primary bg-blue-50 rounded-sm"> <Filter className="size-4" /></div>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <div>
              <button onClick={()=>setFilter(filter!=='present'?'present':'all')} className={`${filter==='present' && 'bg-primary/10'} border rounded-sm h-9 hover:bg-primary/10 hover:text-primary font-medium w-full`}>حاضر</button></div>
            <div>
              <button onClick={()=>setFilter(filter!=='absent'?'absent':'all')} className={`${filter==='absent' && 'bg-primary/10'} border rounded-sm h-9 hover:bg-primary/10 hover:text-primary font-medium w-full`}> غیر حاضر</button></div>
            <div><Input placeholder="جستجوی کارمندان به اساس اسم و دظیفه" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)}/></div>
          </div>
        </div>


        <div className="p-2 border  bg-white shadow-xl rounded-lg" >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className=" text-center">شماره</TableHead>
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
              {emps.map((employee, ind) => {
                const isPresent = employee.today_attendance?.is_present ?? true;
                return (
                  <TableRow key={employee.id} className="hover:bg-secondary hover:border" onDoubleClick={() => router.get("/employees/" + employee.id)}>
                    <TableCell className="text-center">{ind + 1}</TableCell>
                    <TableCell className="font-medium text-center">{employee.name}</TableCell>
                    <TableCell className="text-center">{getDariEmpPosition(employee.position)}</TableCell>
                    <TableCell className="text-center">{employee.salary}</TableCell>
                    <TableCell className="text-center">{employee.present_days}</TableCell>
                    <TableCell className="text-center">{employee.absent_days}</TableCell>
                    <TableCell className={`text-center ${employee.status ? "text-green-500 " : "text-red-500"}`}>
                      {employee.status ? "Active" : "Left"}
                    </TableCell>
                    <TableCell className="flex justify-center items-center transition-all duration-200 rounded-md hover:bg-primary">
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
      </div>
    </section>
  );
}

export default EmployeeList;

