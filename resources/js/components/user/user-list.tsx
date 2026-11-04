import { router, usePage } from "@inertiajs/react";
import { MoreHorizontalIcon, Users2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { User } from "@/types";
import PageHead from "../page-head";
import { Button } from "../ui/button";
interface Props {
    users: User[];
}

type userRole = { id: number, name: string };
function UserList({ users }: Props) {
    const { auth, roles } = usePage().props;
    const rls: userRole[] = roles as userRole[];
    const canAddUser = ['admin', 'super_admin'].includes(auth.role);
    const canManageUsers = auth.role === 'super_admin';
    const [processingUserId, setProcessingUserId] = useState<number | null>(null);

    const updateRole = (user: User, role: userRole) => {
        if (user.role.id === role.id || !confirm(`نقش ${user.name} به ${role.name.replace(/_/g, ' ')} تغییر کند؟`)) {
            return;
        }

        setProcessingUserId(user.id);
        router.put(`/users/${user.id}/role`, { role_id: role.id }, {
            preserveScroll: true,
            onError: (errors) => toast.error(Object.values(errors).join('\n')),
            onFinish: () => setProcessingUserId(null),
        });
    };

    const updateStatus = (user: User) => {
        const status = !user.status;
        const action = status ? 'فعال' : 'مسدود';

        if (!confirm(`اکونت ${user.name} ${action} شود؟ کاربر مسدود فقط دسترسی خواندن خواهد داشت.`)) {
            return;
        }

        setProcessingUserId(user.id);
        router.put(`/users/${user.id}/status`, { status }, {
            preserveScroll: true,
            onError: (errors) => toast.error(Object.values(errors).join('\n')),
            onFinish: () => setProcessingUserId(null),
        });
    };

    return (
        <section className="py-5">
            <PageHead
                HeadIcon={Users2Icon}
                title="کاربران سیستم"
                subtitle="لیست کاربران سیستم"
                description="در اینجا میتوانید لیست تمام کاربران که اکانت در سیستم دارند را مشاهده کنید."
                actionTitle={canAddUser ? 'ایجاد کاربر جدید' : ''}
                actionURL={canAddUser ? '/register' : ''}

            />

            <div className="p-2 border mt-6 bg-white shadow-2xl rounded-lg" dir="rtl">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-25 text-center">شماره</TableHead>
                            <TableHead className="text-center">اسم یوزر</TableHead>
                            <TableHead className="text-center">ایمیل</TableHead>
                            <TableHead className="text-center" >وضیعت</TableHead>
                            <TableHead className="text-center" >نقش در سیستم</TableHead>
                            {canManageUsers && <TableHead className="text-center">اجراآت</TableHead>}

                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user, ind) => (
                            <TableRow key={user.id} >
                                <TableCell className="text-center">{ind + 1}</TableCell>
                                <TableCell className="font-medium text-center">{user.name}</TableCell>
                                <TableCell className="text-center">{user.email}</TableCell>
                                <TableCell className={`text-center rounded-md ${user.status ? "text-green-500  border-primary/30" : "text-destructive  border-destructive/30"}`}>{user.status ? "فعال" : "مسدود (فقط خواندن)"}</TableCell>

                                <TableCell className="text-center">{user.role.name.replace(/_/g, " ")}</TableCell>
                                {canManageUsers && <TableCell className="text-center">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger>
                                            <Button variant="ghost" size="icon" className="size-8"><MoreHorizontalIcon /><span className="sr-only">Open menu</span></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {rls.map((role) => (
                                                <DropdownMenuItem
                                                    key={role.id}
                                                    disabled={user.id === auth.user.id || processingUserId === user.id}
                                                    onSelect={() => updateRole(user, role)}
                                                >
                                                    تغییر نقش به {role.name.replace(/_/g, ' ')}
                                                </DropdownMenuItem>
                                            ))}
                                            <DropdownMenuItem
                                                variant={user.status ? "destructive" : "default"}
                                                disabled={user.id === auth.user.id || processingUserId === user.id}
                                                onSelect={() => updateStatus(user)}
                                            >
                                                {user.status ? "مسدود نمودن (فقط خواندن)" : "فعال نمودن"}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>}
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={canManageUsers ? 6 : 5}>تعداد یوزرها : {users.length}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>

        </section>
    )
}

export default UserList;