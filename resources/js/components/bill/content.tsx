import { StatusType } from '@/types';
import { usePage } from '@inertiajs/react';
import { FileWarning } from 'lucide-react';
import React from 'react';

interface Props {
    children: React.ReactNode;
    status?: string;
    title?:string;
    className?:string;
}
const Content = ({ children, status = 'pending' , title='سفارش لغو شده',className}: Props) => {
    return (
        <div className={`p-4 h-163 relative w-full ${className}`}>
            {/* ======================= BACKGROUND TEXT ============= */}
            <h2 className="absolute z-10 top-0 left-50 text-6xl opacity-10 -rotate-45 font-bold text-primary">
                <img className='h-95 w-75' src={usePage().props.logo as string} alt="شرکت عرفان بهار" />
            </h2>            {status === 'cancelled' && <h2 className="absolute top-100 border-destructive bg-destructive/10 border-3 left-60 p-3 text-4xl opacity-80 font-bold text-destructive">
                <FileWarning className='inline size-10' />
                {title}
            </h2>}
            <div>
                {children}
            </div>
        </div>
    )
}

export default Content