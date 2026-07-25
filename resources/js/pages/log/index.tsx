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

interface Props {
    logs: {
        id: number;
        activity_type: "insert" | "update" | "delete";
        description: string;
        activity_date: Date;
        user: User;
        link: string;
    }[];
    newLogs:number;
}
const Index = ({ logs,newLogs }: Props) => {
    return (
        <div>
            <SectionTitle title="Logs" description="This is a protected area. only authorized should see this area." />
            <Table>
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
                    {logs.length > 0 ? logs.map((log, ind) => (
                        <TableRow key={log.id}>
                            <TableCell>{ind + 1}</TableCell>
                            <TableCell>{log.user.name}</TableCell>
                            <TableCell className="font-medium">{log.activity_type}</TableCell>
                            <TableCell>{log.description.length>50? log.description.slice(50):log.description}</TableCell>
                            <TableCell>{new Date(log.activity_date).toLocaleString()}</TableCell>
                        </TableRow>
                    )) : <>
                        <TableCell colSpan={2}></TableCell>
                        <TableCell colSpan={1} className="  text-yellow-500">
                            <div className="text-center">No logs availible yet! <SearchX className="ml-50"/> </div>
                        </TableCell>
                        <TableCell colSpan={2}></TableCell>

                    </>}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={4}>Total logs</TableCell>
                        <TableCell className="text-right">{logs.length}</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    )
}

export default Index