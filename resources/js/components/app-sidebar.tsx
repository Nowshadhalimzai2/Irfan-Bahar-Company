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
    let navItems: NavItem[] = [];
    const { auth } = usePage().props;
    const roleName = auth.role;

    if (roleName === 'super_admin' || roleName === 'admin') {
        navItems = mainNavItems;
    } else if (roleName === 'shop_clerk') {
        navItems = mainNevShopClerkItems;
    } else if (roleName === 'factory_clerk') {
        navItems = mainNavFactoryClerkItems;
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
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
