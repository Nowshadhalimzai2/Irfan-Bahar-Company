import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import React, { useRef } from 'react'
interface Props {
    children: React.ReactNode;
    className?: string;
}
const Bill = ({ children, className = '' }: Props) => {
    const printAreaRef = useRef<HTMLDivElement>(null);

    const printBill = () => {
        if (!printAreaRef.current) return;
        else {
            window.print();
        }

    };
    return (
        <div className={className}>
            <div className="max-w-4xl py-5 w-full mt-5 mx-auto ">
                <div className="p-5">
                    {/* ========== PRINT BUTTON  ================ */}
                    <Button onClick={() => printBill()}>
                        <Printer /> <span>پرینت</span>
                    </Button>
                </div>
            </div>
            <div className="BillSection p-1" id="printArea" ref={printAreaRef}>
                {children}
            </div>
        </div>
    )
}

export default Bill