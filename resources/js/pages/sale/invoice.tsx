import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

import ThermalReceipt, { ReceiptData } from '@/components/ThermalReceipt';

type SaleLine = { name: string; unit: string; quantity: number; unitPrice: number; total: number, code:string};
type InvoicePageProps = {
    sale: { id: number; status:string; customer: string; phone?: string; address?: string; soldAt: Date; lines: SaleLine[], amount_paid: number,discount:number };
    invoice: {
        number: string; issuedOn: Date;
        status: 'paid' | 'partially_paid' | 'refunded' | 'partially_refunded';
        currency: string; subtotal: number; discount: number; total: number; notes?: string
    };
};


export default function Invoice({ sale, invoice }: InvoicePageProps) {

    type ReceiptItem = {
        itemName: string;
        quantity: number;
        unit_price: number;
        unit:string;
        code:string;
    };
    const lines:ReceiptItem[] = sale.lines.map(line=>{
        return {itemName:line.name,quantity:line.quantity,unit_price:line.unitPrice,unit:line.unit,code:line.code}
    });
    
    const invoiceTemplate: ReceiptData = {
        storeName: "Irfan Bahar Detergent Company",
        invoiceNumber: invoice.number,
        date: new Date(invoice.issuedOn).toLocaleString(),
        cashier: usePage().props.auth.user.name,
        items: lines,
        discount: sale.discount ?? 0,
        paid: sale.amount_paid,
        paymentMethod: "none",
        currency: "AFN",
        status:sale.status,
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'فروشات', href: '/sales' }, { title: `بل${invoice.number}`, href: `/sales/${sale.id}/invoice/print` }]}>
            <Head title={`بل${invoice.number}`} />
            <div dir="rtl" className="bg-slate-100 px-2 py-6 dark:bg-slate-950 print:bg-white print:p-0">
                <div className="mx-auto max-w-3xl space-y-4 print:max-w-none">
                    {/* ================================= buttons ===========================*/}
                    <div className="flex items-center justify-end">
                        <Button variant="ghost" onClick={() => router.visit('/sales')}>
                            برگشت به فروشات
                            <ArrowLeft className="size-4" />
                        </Button>
                    </div>
                    <div dir='ltr'>
                        <ThermalReceipt receipt={invoiceTemplate} showPrintButton/>
                    </div>

                </div>
            </div>
        </AppLayout>);
}
