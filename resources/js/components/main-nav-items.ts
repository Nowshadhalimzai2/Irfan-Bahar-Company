import { dashboard } from "@/routes";
import { NavItem } from "@/types";
import { AlertCircle, BadgeMinus, BookOpen, Factory, FolderGit2, GroupIcon, LayoutGrid, PackageOpen, ShoppingCart, Store, Truck, Users } from "lucide-react";

export const mainNavItems: NavItem[] = [
    {
        title: 'دشبورد',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'فروشات',
        href: '/sales',
        icon: ShoppingCart,
    },

    {
        title: 'مصارف',
        href: '/expenses/create',
        icon: BadgeMinus,
    },
    {
        title: 'کار مندان',
        href: "/stackholders",
        icon: Users,
    },
    {
        title: 'ستاک',
        href: "/inventory-balances",
        icon: Store,
    },
    {
        title: ' انتقال اموال',
        href: "/receipts",
        icon: Truck,
    }, {
        title: 'کارخانه',
        href: "/factory/home",
        icon: Factory,
    },
     {
        title: 'اطلاعات',
        href: "/notifications",
        icon: AlertCircle,
    },

];

export const footerNavItems: NavItem[] = [
        // {
        //     title: 'Repository',
        //     href: 'https://github.com/laravel/react-starter-kit',
        //     icon: FolderGit2,
        // },
        // {
        //     title: 'Documentation',
        //     href: 'https://laravel.com/docs/starter-kits#react',
        //     icon: BookOpen,
        // },
    ];
