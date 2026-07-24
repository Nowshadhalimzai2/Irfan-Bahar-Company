import EmployeeList from "@/components/employee/employee-list";
import { SectionTitle } from "@/components/section-title";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import UserList from "@/components/user/user-list";
import { Role, User } from "@/types";
import { router } from "@inertiajs/core";
import { useMemo } from "react";
interface Props{
    users:User[];
    roles:Role[]
}
export default function Index({users,roles}:Props) {
    return (
        <section className="">
            <div>
                <div className="mt-2">
                    <Tabs defaultValue="overview" className="w-full px-2 md:px-8">
                        <TabsList className="flex justify-between items-center w-full">
                            <TabsTrigger value="employees">کاریګر ها</TabsTrigger>
                            <TabsTrigger value="users">استفاده کنندګان سیستم</TabsTrigger>
                            <TabsTrigger value="tellers">Tellers</TabsTrigger>
                            <TabsTrigger value="vendors">Vendor</TabsTrigger>
                        </TabsList>
                        <TabsContent value="employees">
                            <EmployeeList />
                        </TabsContent>
                        <TabsContent value="users">
                            <UserList  users={users} roles={roles}/>
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
                        <TabsContent value="vendors">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Settings</CardTitle>
                                    <CardDescription>
                                        Manage your account preferences and options. Customize your
                                        experience to fit your needs.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Configure notifications, security, and themes.
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </section>
    )
}

Index.layout = {
    breadcrumbs: [
        {
            title: 'Stackholders',
            href: '/stackholders',
        },
    ],
};