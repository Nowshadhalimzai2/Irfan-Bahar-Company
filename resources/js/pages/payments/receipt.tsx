import { Head, router } from '@inertiajs/react';
import { ArrowRight, Printer, Receipt, WalletCards } from 'lucide-react';
import { getDariCurrency } from '@/components/location-translator';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

type ReceiptPageProps = {
    payment: {
        receiptNumber: string;
        amount: number;
        method: string;
        reference?: string;
        paidAt: Date;
        notes?: string;
    };
    invoice: {
        number: string;
        customer: string;
        phone?: string;
        currency: string;
        total: number;
        paid: number;
        remaining: number;
    };
};
const labels: Record<string, string> = {
    cash: 'نقدی',
    card: 'کارت بانکی',
    bank_transfer: 'حواله بانکی',
    other: 'سایر',
};
const money = (value: number, currency: string) =>
    `${value.toString()} ${getDariCurrency(currency)}`;

export default function PaymentReceipt({ payment, invoice }: ReceiptPageProps) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'پرداخت‌ها', href: '/payments' },
                {
                    title: `رسید ${payment.receiptNumber}`,
                    href: `/payments/${payment.receiptNumber}/receipt`,
                },
            ]}
        >
            <Head title={`رسید ${payment.receiptNumber}`} />
            <div
                dir="rtl"
                className=" bg-slate-100 px-2 py-6 dark:bg-slate-950 print:bg-white print:p-0"
            >
                <div className="mx-auto max-w-2xl space-y-4 print:max-w-none">
                    <div className="flex items-center justify-between print:hidden">
                        <Button
                            variant="ghost"
                            onClick={() => router.visit('/payments')}
                        >
                            <ArrowRight className="size-4" /> بازگشت
                        </Button>
                        <Button onClick={() => window.print()}>
                            <Printer className="size-4" /> چاپ رسید
                        </Button>
                    </div>
                    <article
                        id="printArea"
                        className="overflow-hidden relative rounded-2xl bg-white shadow-xl print:rounded-none print:shadow-none h-240"
                    >
                        <header className="bg-[#092b4c] px-8 py-8 text-white">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-cyan-200">
                                        رسید دریافت وجه
                                    </p>
                                    <h1 className="mt-2 text-3xl font-bold">
                                        عرفان بهار
                                    </h1>
                                    <p className="mt-2 text-sm text-blue-100">
                                        تأیید دریافت پرداخت مشتری
                                    </p>
                                </div>
                                <div className="text-left">
                                    <Receipt className="ml-auto size-8 text-[#ffc107]" />
                                    <p className="mt-3 text-xs text-blue-200">
                                        شماره رسید
                                    </p>
                                    <p className="mt-1 text-lg font-bold">
                                        {payment.receiptNumber}
                                    </p>
                                </div>
                            </div>
                        </header>
                        <div className="space-y-6 px-8 py-8">
                            <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs text-slate-400">
                                        دریافت از
                                    </p>
                                    <p className="mt-1 font-bold text-slate-800">
                                        {invoice.customer}
                                    </p>
                                    {invoice.phone && (
                                        <p className="mt-1 text-sm text-slate-500">
                                            {invoice.phone}
                                        </p>
                                    )}
                                </div>
                                <div className="sm:text-left">
                                    <p className="text-xs text-slate-400">
                                        مرتبط با بل
                                    </p>
                                    <p className="mt-1 font-bold text-primary">
                                        {invoice.number}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {new Date(payment.paidAt).toLocaleString('fa-AF')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl border-2 border-emerald-100 bg-emerald-50 p-5">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-emerald-600 p-3 text-white">
                                        <WalletCards className="size-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-emerald-700">
                                            مبلغ دریافت‌شده
                                        </p>
                                        <p className="mt-1 text-2xl font-bold text-emerald-800">
                                            {money(
                                                payment.amount,
                                                invoice.currency,
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                                    {labels[payment.method] ?? payment.method}
                                </span>
                            </div>
                            <div className="grid gap-3 text-sm">
                                <div className="flex justify-between border-b border-slate-100 pb-3">
                                    <span className="text-slate-500">
                                        مبلغ کل بل
                                    </span>
                                    <b>
                                        {money(invoice.total, invoice.currency)}
                                    </b>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-3">
                                    <span className="text-slate-500">
                                        مجموع پرداخت‌ها
                                    </span>
                                    <b className="text-emerald-600">
                                        {money(invoice.paid, invoice.currency)}
                                    </b>
                                </div>
                                <div className="flex justify-between text-base font-bold">
                                    <span>باقی‌مانده بل</span>
                                    <span
                                        className={
                                            invoice.remaining > 0
                                                ? 'text-amber-600'
                                                : 'text-emerald-600'
                                        }
                                    >
                                        {money(
                                            invoice.remaining,
                                            invoice.currency,
                                        )}
                                    </span>
                                </div>
                            </div>
                            {payment.reference && (
                                <p className="text-sm text-slate-500">
                                    <b>شماره مرجع:</b> {payment.reference}
                                </p>
                            )}
                            {payment.notes && (
                                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                                    <b>یادداشت:</b> {payment.notes}
                                </div>
                            )}
                        </div>
                        <footer className="fixed bottom-10 ">
                        <div className='mb-1 py-2 px-8'>
                            <b className='text-xs text-gray-400'>مهر یا امضا: .............................</b>
                        </div>
                            <div className='border-slate-200 px-8 py-2 text-center text-xs text-slate-400 border-t'>این رسید توسط سیستم مدیریت عرفان بهار صادر شده است.</div>
                        </footer>
                    </article>
                </div>
            </div>
        </AppLayout>
    );
}
