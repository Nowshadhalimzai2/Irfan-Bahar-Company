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
import { Employee, Role, Supplier, User } from "@/types";
import { usePage } from "@inertiajs/react";
interface Props {
    users: User[];
    employees: Employee[];
    suppliers: Supplier[];
}
export default function Index({ users, employees, suppliers }: Props) {
    const { auth } = usePage().props;
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
                        <Tabs defaultValue="employees" className="w-full px-2 md:px-8">
                            <TabsList className="flex justify-between items-center w-full">
                                <TabsTrigger value="tellers">مشتریان</TabsTrigger>
                                <TabsTrigger value="employees">کاریګر ها</TabsTrigger>
                                {(auth.user.role_id === 1 || auth.user.role_id === 2) && <TabsTrigger value="users">استفاده کنندګان سیستم</TabsTrigger>}
                                <TabsTrigger value="suppliers">تامین کنندگان</TabsTrigger>
                            </TabsList>
                            <TabsContent value="employees">
                                <EmployeeList employees={employees} />
                            </TabsContent>
                            <TabsContent value="users">
                                <UserList users={users} />
                            </TabsContent>
                            <TabsContent value="tellers">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Reports</CardTitle>
                                        <CardDescription>
                                            Generate and download your detailed reports. Export data in
                                            multiple formats for analysis.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground">
                                        You have 5 reports ready and available to export.
                                    </CardContent>
                                </Card>
                            </TabsContent>
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

