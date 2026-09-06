import CustomerList from "@/components/customer/customer-list";
import EmployeeList from "@/components/employee/employee-list";
import SupplierList from "@/components/supplier/supplier-list";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import UserList from "@/components/user/user-list";
import AppLayout from "@/layouts/app-layout";
import { Customer, Employee, Role, Supplier, User } from "@/types";
import { usePage } from "@inertiajs/react";
interface Props {
    users: User[];
    employees: Employee[];
    suppliers: Supplier[];
    customers: Customer[];
}
export default function Index({ users, employees, suppliers, customers }: Props) {
    const { auth } = usePage().props;
    console.log(customers);
    
    return (
        <AppLayout breadcrumbs={[
            {
                title: 'کارمندان',
                href: '/stackholders',
            },

        ]}>

            <section className="">
                <div>
                    <div className="mt-2">
                        <Tabs defaultValue="customers" className="w-full px-2 md:px-8">
                            <TabsList className="flex justify-between items-center w-full">
                                <TabsTrigger value="customers">مشتریان</TabsTrigger>
                                <TabsTrigger value="employees">کاریګر ها</TabsTrigger>
                                {(auth.user.role_id === 1 || auth.user.role_id === 2) && <TabsTrigger value="users">استفاده کنندګان سیستم</TabsTrigger>}
                                <TabsTrigger value="suppliers">تامین کنندگان</TabsTrigger>
                            </TabsList>
                            {/*1: CUSTOMERS  */}
                            <TabsContent value="customers">
                                <CustomerList customers={customers} />
                            </TabsContent>
                            {/* 2: EMPLOYEES */}
                            <TabsContent value="employees">
                                <EmployeeList employees={employees} />
                            </TabsContent>
                            {/* 3: USERS */}
                            <TabsContent value="users">
                                <UserList users={users} />
                            </TabsContent>
                            {/* 4: SUPPLIERS */}
                            <TabsContent value="suppliers">
                                <SupplierList suppliers={suppliers} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </section>
        </AppLayout>

    )
}

