import { Link, usePage } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';
interface Notification {
    data: [{ read_at: string | null }],
    links: [],
    meta: {
        total: number,
        per_page: number,
        current_page: number,
        last_page: number,
        from: number,
        to: number
    }
};
export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const notifications = usePage().props.notifications as Notification;

    // EXTRACT the count of unread notifications
    const notificationCount = isCurrentUrl('/notifications') ? notifications.data.filter((item) => item?.read_at == null).length : notifications.unread_count;

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title} className='flex justify-between items-center'>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch className={`${item.title === 'اطلاعات' ? 'flex justify-between items-center w-full' : ''}`} title={notificationCount + ' اطلاعات'}>
                                <div className='flex items-center gap-2'>
                                    {item.icon && <item.icon className="size-4" />}
                                    {item.title}
                                </div>

                                {notificationCount > 0 ? (
                                    item.title === 'اطلاعات' && (
                                        <small className="bg-secondary-foreground text-secondary rounded-full px-1 py-0.5 text-xs font-semibold">
                                            {notificationCount > 9 ? '9+' : notificationCount}
                                        </small>
                                    )
                                ) : null}
                            </Link>
                        </SidebarMenuButton>

                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
