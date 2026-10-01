import { User } from '@/types';
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
import { SectionTitle } from '@/components/section-title';
import AppLayout from '@/layouts/app-layout';
import PageLinks from '@/components/page-links';
import PageHead from '@/components/page-head';
import { Logs } from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';

interface Props {
    logs: {
        data: {
            id: number;
            activity_type: "insert" | "update" | "delete";
            description: string;
            activity_date: string | Date;
            user: User;
            link: string;
        }[],
        current_page: number;
        from: number;
        last_page: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];

    };
}

const Index = ({ logs }: Props) => {
    return (
        <AppLayout breadcrumbs={[
            { title: 'دشبورد', href: "/dashboard" },
            { title: 'لوګ', href: "/logs" },
        ]}>
            <div className='px-2 md:px-4 py-5'>
                <PageHead
                    HeadIcon={Logs}
                    subtitle='تاریخچه اجراآت'
                    title='اجرات انجام شده'
                    description='اجراآت که در سیستم انجام شده توسط کاربردان مختلف'
                    tone='yellow'
                />
                <div className="grid grid-cols-1 gap-5  mt-5" dir='rtl'>
                    <Table className='bg-white shadow rounded-xl'>
                        <TableCaption>Logs</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-25">ID</TableHead>
                                <TableHead>Activity Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Activity Date</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Link</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.data.map((log, ind) => (
                                <TableRow key={log.id}>
                                    <TableCell>{ind + 1}</TableCell>
                                    <TableCell>{log.activity_type}</TableCell>
                                    <TableCell>{log.description}</TableCell>
                                    <TableCell>{new Date(log.activity_date).toLocaleString('fa-AF',{
                                        year:'numeric',
                                        month:'long',
                                        day:'numeric',
                                        hour:'numeric',
                                        minute:'numeric',
                                        second:'numeric',
                                        
                                    })}</TableCell>
                                    <TableCell>{log.user.name}</TableCell>
                                    <TableCell><a href={log
                                        .link} className="text-blue-500 hover:underline">View</a></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={6}>
                                    <PageLinks links={logs.links} />
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
};

export default Index;
