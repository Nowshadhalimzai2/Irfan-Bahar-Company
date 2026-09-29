import { Button, buttonVariants } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import React, { useRef } from 'react'
interface Props {
    children: React.ReactNode;
    className?: string;
    production_order_id?:number;
}
const Bill = ({ children, production_order_id=0, className = '' }: Props) => {
    const printAreaRef = useRef<HTMLDivElement>(null);

    const printBill = () => {
        if (!printAreaRef.current) return;
        else {
            window.print();
        }

    };
    return (
        <div className={className} dir='rtl'>
            <div className="max-w-4xl py-3 w-full mt-5 mx-auto ">
                <div className="p-5 flex justify-between items-center">
                    {/* ========== PRINT BUTTON  ================ */}
                    <Button onClick={() => printBill()}>
                        <Printer /> <span>پرینت</span>
                    </Button>
                    {production_order_id!==0 && <Link href={'/factory/production-orders/' + production_order_id + '/production-inputs'} className={buttonVariants({ variant: 'secondary' })}>ترکیبات</Link>
                    }
                </div>
            </div>
            <div className="BillSection p-1 overflow-hidden rounded-2xl bg-white shadow-xl print:rounded-none print:shadow-none" id="printArea" ref={printAreaRef}>
                {children}
            </div>
        </div>
    )
}

export default Bill