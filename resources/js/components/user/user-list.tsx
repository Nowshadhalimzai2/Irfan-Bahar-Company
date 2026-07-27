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
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button, buttonVariants } from "../ui/button";
import { MoreHorizontalIcon } from "lucide-react";
import { Link, router, usePage } from "@inertiajs/react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import axios from "axios";
import { register } from "@/routes";
interface Props {
    users: User[];
    roles: Role[]
}
function UserList({ users, roles }: Props) {
    const { auth } = usePage().props;
    console.log(users[0].status);

    return (
        <section className="section">
            <div>
                <SectionTitle title="System User List" description="Here you can see the list of all users have accounts in the system." />
                <Table>
                    <TableCaption>You can manage the users.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-25">No</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead >Status</TableHead>
                            <TableHead >Role</TableHead>
                            <TableHead >Action</TableHead>

                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user, ind) => (
                            <TableRow key={user.id} >
                                <TableCell>{ind + 1}</TableCell>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell className={` rounded-md ${user.status?"text-green-500  border-primary/30":"text-destructive  border-destructive/30"}`}>{user.status?"Activted":"Deactiveted"}</TableCell>

                                <TableCell>{user.role.name.replace("_"," ")}</TableCell>
                                <TableCell>
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
                                                            const res = await axios.post(`/users/${user.id}/role`, { role: role.name });
                                                            console.log('success response: ', res.data);

                                                            router.reload();
                                                        } catch (e) {
                                                            console.error(e);
                                                        }
                                                    }}>
                                                        {role.name.replace('_',' ')}
                                                    </DropdownMenuItem>
                                                ))
                                            }
                                            <DropdownMenuItem variant="destructive" className=" py-0 mt-1 border-t">
                                                <Button variant={'ghost'} className={`${!user.status?"text-green-500":"text-red-500"}`} onClick={() => router.put('/users/'+!user.status+'/' + user.id)} disabled={user.id === auth.user.id}>{user.status?"Deactivate":"Activate"}</Button>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
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