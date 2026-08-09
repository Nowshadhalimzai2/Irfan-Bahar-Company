import { dashboard } from "@/routes";
import { NavItem } from "@/types";
import { BadgeMinus, BookOpen, FolderGit2, GroupIcon, LayoutGrid, PackageOpen, Truck } from "lucide-react";

export const mainNavItems: NavItem[] = [
    {
        title: 'دشبورد',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'مصارف',
        href: '/expenses/create',
        icon: BadgeMinus,
    },
    {
        title: 'کار کننده ګان',
        href: "/stackholders",
        icon: GroupIcon,
    },
    {
        title: 'اجناس',
        href: "/items",
        icon: PackageOpen,
    },
     {
        title: ' انتقال اموال',
        href: "/receipts",
        icon: Truck,
    },
   
];

export
    const footerNavItems: NavItem[] = [
        {
            title: 'Repository',
            href: 'https://github.com/laravel/react-starter-kit',
            icon: FolderGit2,
        },
        {
            title: 'Documentation',
            href: 'https://laravel.com/docs/starter-kits#react',
            icon: BookOpen,
        },
    ];
