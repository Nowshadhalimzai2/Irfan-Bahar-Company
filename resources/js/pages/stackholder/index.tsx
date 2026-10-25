import CustomerList from "@/components/customer/customer-list";
import EmployeeList from "@/components/employee/employee-list";
import SupplierList from "@/components/supplier/supplier-list";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import UserList from "@/components/user/user-list";
import AppLayout from "@/layouts/app-layout";
import { usePage } from "@inertiajs/react";
interface Stackholders {
    customers?: any[];
    employees?: any[];
    users?: any[];
    suppliers?: any[];
}

type StackholdersData = Stackholders[];
interface Props {
    stackholders: StackholdersData;
}

export default function Index({ stackholders }: Props) {
    const data = stackholders[0];

    const { auth } = usePage().props;
    const userRole = auth.role;
    
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
                        <Tabs defaultValue={userRole=== 'factory_clerk' ? "suppliers" : 'customers'} className="w-full px-2 md:px-8">
                            <TabsList className="flex justify-between items-center w-full">

                                {data.customers && <TabsTrigger value="customers">مشتری ها</TabsTrigger>}
                                {data.employees && <TabsTrigger value="employees">کاریګر ها</TabsTrigger>}
                                {data.suppliers && <TabsTrigger value="suppliers">تامین کنندگان</TabsTrigger>}
                                {data.users && <TabsTrigger value="users">استفاده کنندګان سیستم</TabsTrigger>}
                            </TabsList>
                            {/*1: CUSTOMERS  */}
                           {data.customers && <TabsContent value="customers">
                                <CustomerList customers={data.customers} />
                            </TabsContent>}
                            {/* 2: EMPLOYEES */}
                            {data.employees && <TabsContent value="employees">
                                <EmployeeList employees={data.employees} />
                            </TabsContent>}
                            {/* 3: USERS */}
                            {data.suppliers && <TabsContent value="suppliers">
                                <SupplierList suppliers={data.suppliers} />
                            </TabsContent>}
                            {/* 4: SUPPLIERS */}
                            {data.users && <TabsContent value="users">
                                <UserList users={data.users} />
                            </TabsContent>}
                        </Tabs>
                    </div>
                </div>
            </section>
        </AppLayout>

    )
}

