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
import { SearchX } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageLinks from '@/components/page-links';

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
            <SectionTitle title="Logs" description="This is a protected area. only authorized should see this area." />
            <div className="overflow-x-auto w-full px-8">
                <Table>
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
                        {logs.data.map((log,ind) => (
                            <TableRow key={log.id}>
                                <TableCell>{ind+1}</TableCell>
                                <TableCell>{log.activity_type}</TableCell>
                                <TableCell>{log.description}</TableCell>
                                <TableCell>{new Date(log.activity_date).toLocaleString()}</TableCell>
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
        </AppLayout>
    );
};

export default Index;
