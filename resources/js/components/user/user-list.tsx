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
import { Button } from "../ui/button";
import { MoreHorizontalIcon } from "lucide-react";
import { router, usePage } from "@inertiajs/react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import axios from "axios";
interface Props {
    users: User[];
    roles: Role[]
}
function UserList({ users, roles }: Props) {
    const { auth } = usePage().props;

    return (
        <section className="section">
            <div>
                <SectionTitle title="System User List" description="Here you can see the list of all users have accounts in the system." />
                <Table>
                    <TableCaption>You can manage the users.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-25">No</TableHead>
                            <TableHead>name</TableHead>
                            <TableHead>email</TableHead>
                            <TableHead >Role</TableHead>
                            <TableHead >Action</TableHead>

                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user, ind) => (
                            <TableRow key={user.id}>
                                <TableCell>{ind + 1}</TableCell>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role.name}</TableCell>
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
                                                        {role.name}
                                                    </DropdownMenuItem>
                                                ))
                                            }
                                            <DropdownMenuItem variant="destructive">
                                                <Button variant={'destructive'} onClick={() => router.get('/users/'+user.id)} disabled={user.id === auth.user.id}>Delete</Button>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={3}>Total Users</TableCell>
                            <TableCell className="text-right">{users.length}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </section>
    )
}

export default UserList;