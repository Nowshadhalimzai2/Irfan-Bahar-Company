import React from 'react'
import { CustomeDropDownMenu } from './customer-dropdwon';
import { Link } from '@inertiajs/react';
import { buttonVariants } from './ui/button';
import { LucideIcon, Plus } from 'lucide-react';

interface Props {
    title: string;
    description: string;
    subtitle: string;
    HeadIcon: LucideIcon;
    menuItems?: { name: string; url: string }[];
    actionTitle?: string;
    actionURL?:string;
    ActionIcon?:LucideIcon;
    tone?: 'emerald' | 'yellow' | 'cyan' | 'pink' | 'indigo';
}
const PageHead = ({ title, subtitle, description, HeadIcon, menuItems, actionTitle,actionURL,ActionIcon=Plus ,tone='emerald'}: Props) => {
    const lighting = tone==='emerald' ? 'bg-emerald-400/60' : tone==='cyan' ? 'bg-cyan-400/60' : tone==='indigo' ? 'bg-indigo-400/60' : tone==='pink' ? 'bg-pink-400/60' : tone==='yellow' ? 'bg-yellow-400/60' : '';
    const titleStyle = tone==='emerald' ? 'text-emerald-300' : tone==='cyan' ? 'text-cyan-300' : tone==='indigo' ? 'text-indigo-300' : tone==='pink' ? 'text-pink-300' : tone==='yellow' ? 'text-yellow-300' : '';
    return (
        <div className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 md:px-10">
            <div className={`absolute -left-12 -top-16 h-48 w-48 rounded-full ${lighting} blur-3xl`} />
            <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="space-y-3">
                    <div className={`flex items-center gap-2 text-sm font-medium ${titleStyle}`}><HeadIcon className="size-4" /> {title}</div>
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{subtitle}</h1>
                    <p className="max-w-xl text-sm leading-6 text-slate-300">{description}</p>
                </div>
                <div className="flex gap-2">
                    {menuItems && <CustomeDropDownMenu items={menuItems} />}
                    {actionTitle && <Link href={actionURL} className={`${buttonVariants({ variant: 'secondary' })} gap-2 bg-emerald-400 text-slate-950 hover:bg-emerald-300`}><ActionIcon className="size-4" /> {actionTitle}</Link>}
                </div>
            </div>
        </div>
    )
}

export default PageHead