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
import { Role, User } from "@/types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button, buttonVariants } from "../ui/button";
import { MoreHorizontalIcon, User2Icon, UserIcon, Users2Icon } from "lucide-react";
import { Link, router, usePage } from "@inertiajs/react";
import axios from "axios";
import { register } from "@/routes";
import PageHead from "../page-head";
interface Props {
    users: User[];
}
function UserList({ users }: Props) {
    const { auth, roles } = usePage().props;
    const canAddUser = ['admin', 'super_admin'].includes(
        roles[auth.user.role_id]?.name,
    ); return (
        <section className="py-5">
            <PageHead
                HeadIcon={Users2Icon}
                title="کاربران سیستم"
                subtitle="لیست کاربران سیستم"
                description="در اینجا میتوانید لیست تمام کاربران که اکانت در سیستم دارند را مشاهده کنید."
                actionTitle={canAddUser ? 'ایجاد کاربر جدید' : ''}
                actionURL={canAddUser ? '/register' : ''}

            />
          
            <div className="p-2 border mt-6 bg-white shadow-2xl rounded-lg">
                <Table>
                    <TableCaption>You can manage the users.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-25">No</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead >Status</TableHead>
                            <TableHead >Role</TableHead>
                            {(auth.user.id === 1 || auth.user.id === 2) && <TableHead >Action</TableHead>}

                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user, ind) => (
                            <TableRow key={user.id} >
                                <TableCell>{ind + 1}</TableCell>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell className={` rounded-md ${user.status ? "text-green-500  border-primary/30" : "text-destructive  border-destructive/30"}`}>{user.status ? "Activted" : "Deactiveted"}</TableCell>

                                <TableCell>{user.role.name.replace("_", " ")}</TableCell>
                                {(auth.user.id === 1 || auth.user.id === 2) && <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger>
                                            <Button variant="ghost" size="icon" className="size-8"><MoreHorizontalIcon /><span className="sr-only">Open menu</span></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {
                                                // simple roles list; adjust as needed
                                                roles.map((role) => (
                                                    <DropdownMenuItem key={role.id} onClick={async () => {
                                                        try {
                                                            const res = await axios.put(`/users/${user.id}/role`, { role: role.name });
                                                            console.log('success response: ', res.data);

                                                            router.reload();
                                                        } catch (e) {
                                                            console.error(e);
                                                        }
                                                    }}>
                                                        {role.name.replace('_', ' ')}
                                                    </DropdownMenuItem>
                                                ))
                                            }
                                            <DropdownMenuItem variant="destructive" className=" py-0 mt-1 border-t">
                                                <Button variant={'ghost'} className={`${!user.status ? "text-green-500" : "text-red-500"}`} onClick={() => router.put('/users/' + user.id + `${user.status ? "/false" : "/true"}`)} disabled={user.id === auth.user.id}>{user.status ? "Deactivate" : "Activate"}</Button>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>}
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={4}>Total Users</TableCell>
                            <TableCell className="text-right">{users.length}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
            <div className="flex justify-end flex-col items-end">
                <Link href={register()} className={buttonVariants({
                    variant: 'default'
                }) + "  "}>ایجاد یوزر جدید</Link>
            </div>
        </section>
    )
}

export default UserList;