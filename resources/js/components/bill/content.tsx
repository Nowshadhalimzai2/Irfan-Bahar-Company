import { StatusType } from '@/types';
import { FileWarning } from 'lucide-react';
import React from 'react';

interface Props {
    children: React.ReactNode;
    orderStatus? : StatusType;
}
const Content = ({ children, orderStatus = 'pending' }: Props) => {
    return (
        <div className="p-4 h-163 relative w-full">
            {/* ======================= BACKGROUND TEXT ============= */}
            <h2 className="absolute z-10 top-60 left-30 text-6xl opacity-30 -rotate-45 font-bold text-primary">شرکت عرفان بهار</h2>
            {orderStatus === 'cancelled' && <h2 className="absolute top-100 border-destructive bg-destructive/10 border-3 left-60 p-3 text-4xl opacity-80 font-bold text-destructive">
                <FileWarning className='inline size-10' />
                سفارش لغو شده
            </h2>}
            <div>
                {children}
            </div>
        </div>
    )
}

export default Content