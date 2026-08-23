import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Menu, MoreHorizontalIcon } from 'lucide-react';
import { Link, router } from "@inertiajs/react";

interface Props {
    items: { name: string; url: string; }[];
    deletion?: {
        id: number;
        url: string;
    }
    method?: 'get' | 'put';
}
export const CustomeDropDownMenu = ({ items, deletion, method = 'get' }: Props) => {
    
    const handleToggle = (url: string) => {
        if (method === 'put') {
            if (confirm('مطمئن هستین تا اجرآات کند؟'))
                router.put(url)
        }
        else if (method === "get")
            router.get(url);
    }

    return (
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger ><Button variant="ghost" size="icon" className="size-8"><Menu /><span className="sr-only">Open menu</span></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {items.map((item, ind) => <DropdownMenuItem key={ind} onClick={() => handleToggle(item.url)}>{item.name}</DropdownMenuItem>)}
                    {deletion?.id && <DropdownMenuItem variant="destructive">
                        <DropdownMenuSeparator />
                        <Link className="text-red-500  p-0 w-full h-full" onClick={() => {
                            if (confirm('مطمئین هستین که ریکورد خذف کنه؟'))
                                router.delete(deletion.url);
                        }}>حذف نمودن</Link>
                    </DropdownMenuItem>}
                </DropdownMenuContent>
            </DropdownMenu></div>
    )
}
