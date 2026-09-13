import { Link, usePage } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import { footerNavItems, mainNavFactoryClerkItems, mainNavItems, mainNevShopClerkItems } from './main-nav-items';


export function AppSidebar() {
    let NavItems: NavItem[] = [];
    const { auth, roles } = usePage().props;
    const roleID: number = auth.user.role_id;
    const roleName = roles.filter(role=>role.id==roleID)[0].name;
    if (roleName === 'super_admin') {
        NavItems = mainNavItems;
    }
    else if (roleName === 'admin') {
        NavItems = mainNavItems;
    }
    else if (roleName === 'shop_clerk')
        NavItems = mainNevShopClerkItems;
    else if (roleName === 'factory_clerk') {
        NavItems = mainNavFactoryClerkItems;
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={NavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
