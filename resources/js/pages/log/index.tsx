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

// const parseLogDate = (date: string | Date) => {
//     if (date instanceof Date) return date;
//     const value = date.trim();
//     if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(value)) {
//         return new Date(value.replace(' ', 'T') + 'Z');
//     }
//     return new Date(value);
// };

const Index = ({ logs }: Props) => {
    return (
        <AppLayout breadcrumbs={[
            { title: 'دشبورد', href: "/dashboard" },
            { title: 'لوګ', href: "/logs" },

        ]}>
            <SectionTitle title="Logs" description="This is a protected area. only authorized should see this area." />
            <Table className="max-w-3xl mx-auto bg-white p-5 rounded-sm shadow">
                <TableCaption>You can manage the users.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-25">No</TableHead>
                        <TableHead>User Name</TableHead>
                        <TableHead>Activity Type</TableHead>
                        <TableHead >Description</TableHead>
                        <TableHead >Date</TableHead>

                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.data.length > 0 ? logs.data.map((log, ind) => (
                        <TableRow key={log.id}>
                            <TableCell>{ind + 1}</TableCell>
                            <TableCell>{log.user.name}</TableCell>
                            <TableCell className="font-medium">{log.activity_type}</TableCell>
                            <TableCell>{log.description.length > 50 ? `${log.description.slice(0, 50)}...` : log.description}</TableCell>
                            <TableCell>{new Date(log.activity_date).toLocaleString()}</TableCell>
                        </TableRow>
                    )) : <>
                        <TableCell colSpan={5} className="text-center text-yellow-500 py-6">
                            <div className="inline-flex items-center gap-2 py-5">No logs available yet! <SearchX /> </div>
                        </TableCell>

                    </>}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={3}>Total logs</TableCell>
                        <TableCell className="text-right" colSpan={2}>{logs.links ? logs.from + ' - ' + logs.current_page : logs.data.length}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={5}>
                            <nav className="mt-2 flex justify-center items-center space-x-2">
                                {logs.links && logs.links.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.url ?? '#'}
                                        className={`px-3 py-1 rounded border ${link.active ? 'bg-primary/80 text-white' : 'bg-white text-slate-700'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </nav>
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </AppLayout>
    )
}

export default Index