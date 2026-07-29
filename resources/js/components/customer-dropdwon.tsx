import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { MoreHorizontalIcon } from 'lucide-react';
import { Link, router } from "@inertiajs/react";

interface Props {
    items: { name: string; url: string; }[];
    deletion?: {
        id: number;
        url: string;
    }
}
export const CustomeDropDownMenu = ({ items, deletion }: Props) => {
    return (
        <div>  <DropdownMenu>
            <DropdownMenuTrigger ><Button variant="ghost" size="icon" className="size-8"><MoreHorizontalIcon /><span className="sr-only">Open menu</span></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {items.map((item, ind) => <DropdownMenuItem key={ind} onClick={() => router.get(item.url)}>{item.name}</DropdownMenuItem>)}
                <DropdownMenuSeparator />
                {deletion?.id && <DropdownMenuItem variant="destructive">
                    <Link className="text-red-500  p-0 w-full h-full" onClick={() => router.delete(deletion.url)}>حذف نمودن</Link>
                </DropdownMenuItem>}
            </DropdownMenuContent>
        </DropdownMenu></div>
    )
}
