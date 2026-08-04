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
                        {logs.data.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell>{log.id}</TableCell>
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
                                <div className="flex justify-center items-center space-x-2">
                                    {logs.links.map((link, index) => (
                                        <a
                                            key={index}
                                            href={link.url ?? '#'}
                                            className={`px-3 py-1.5 border rounded ${link.active ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </AppLayout>
    );
};

export default Index;
