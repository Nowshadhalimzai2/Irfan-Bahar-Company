import { Head, Link, useForm } from '@inertiajs/react';
import {
    Banknote,
    Check,
    CircleDollarSign,
    Landmark,
    Printer,
    Receipt,
    Search,
    WalletCards,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { getDariCurrency } from '@/components/location-translator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import PaymentDialog from '@/components/sale/payment-dialog';

type Payment = { id: number; amount: number; method: string; reference?: string; paid_at: string };

type Invoice = {
    id: number;
    number: string;
    customer: string;
    phone?: string;
    currency: string;
    total: number;
    paid: number;
    due: number;
    status: string;
    issuedOn: string;
    payments: Payment[];
};
type Props = { invoices: Invoice[] };

const money = (value: number, currency: string) =>
    `${value.toFixed(2).toString()} ${getDariCurrency(currency)}`;

export default function Payments({ invoices }: Props) {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<Invoice | null>(null);
    const filtered = useMemo(
        () =>
            invoices.filter((invoice) =>
                `${invoice.number} ${invoice.customer} ${invoice.phone ?? ''}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
            ),
        [invoices, query],
    );
    const outstanding = invoices.reduce((sum, invoice) => sum + invoice.due, 0);
    const collected = invoices.reduce((sum, invoice) => sum + invoice.paid, 0);

    return (
        <AppLayout breadcrumbs={[{ title: 'پرداخت‌ها', href: '/payments' }]}>
            <Head title="مدیریت پرداخت‌ها" />
            <div
                dir="rtl"
                className="min-h-full space-y-5 bg-[#f6f9fc] px-1 pb-10 dark:bg-transparent"
            >
                <div className="mx-auto max-w-7xl space-y-5">
                    <section className="relative overflow-hidden rounded-[1.75rem] bg-[#092b4c] px-6 py-7 text-white shadow-xl sm:px-8">
                        <div className="absolute -top-16 -left-10 h-48 w-48 rounded-full border-24 border-cyan-300/10" />
                        <div className="relative flex items-center justify-between gap-5">
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-sm text-cyan-200">
                                    <Receipt className="size-4" /> مرکز
                                    دریافت‌ها
                                </div>
                                <h1 className="text-2xl font-bold sm:text-3xl">
                                    مدیریت پرداخت و رسید
                                </h1>
                                <p className="mt-2 text-sm text-blue-100">
                                    پرداخت‌های فاکتورها را ثبت، پیگیری و رسید
                                    آن‌ها را چاپ کنید.
                                </p>
                            </div>
                            <Link
                                href="/sales"
                                className="hidden rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20 sm:block"
                            >
                                بازگشت به فروشات
                            </Link>
                        </div>
                    </section>
                    <section className="grid gap-4 sm:grid-cols-3">
                        <Summary
                            title="جمع دریافت‌شده"
                            value={money(
                                collected,
                                invoices[0]?.currency ?? 'AFG',
                            )}
                            icon={CircleDollarSign}
                            tone="blue"
                        />
                        <Summary
                            title="بل های بقایه"
                            value={invoices.filter(inv=>inv.status!='paid').length.toString()}
                            icon={Receipt}
                            tone="green"
                        />
                        <Summary
                            title="باقی‌مانده قابل دریافت"
                            value={money(
                                outstanding,
                                invoices[0]?.currency ?? 'AFG',
                            )}
                            icon={CircleDollarSign}
                            tone="amber"
                        />
                    </section>
                    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex flex-col justify-between gap-4 border-b p-5 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-lg font-bold">فاکتورها</h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    برای ثبت دریافت، یک فاکتور را انتخاب کنید.
                                </p>
                            </div>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    className="pr-10"
                                    placeholder="جستجوی شماره یا مشتری..."
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-200 text-right text-sm">
                                <thead className="border-b text-xs text-slate-400">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">
                                            فاکتور
                                        </th>
                                        <th className="py-3 font-medium">
                                            مشتری
                                        </th>
                                        <th className="py-3 font-medium">کل</th>
                                        <th className="py-3 font-medium">
                                            دریافت
                                        </th>
                                        <th className="py-3 font-medium">
                                            باقی‌مانده
                                        </th>
                                        <th className="py-3 font-medium">
                                            وضعیت
                                        </th>
                                        <th className="py-3 font-medium">
                                            عملیات
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((invoice) => (
                                        <tr
                                            key={invoice.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-5 py-4">
                                                <b className="text-primary">
                                                    {invoice.number}
                                                </b>
                                                <small className="mt-1 block text-xs text-slate-400">
                                                    {invoice.issuedOn}
                                                </small>
                                            </td>
                                            <td className="py-4 font-medium">
                                                {invoice.customer =='مشتری ګذری' ? 'پرچون' : invoice.customer}
                                                <small className="mt-1 block text-xs text-slate-400">
                                                    {invoice.phone ??
                                                        'پرچون'}
                                                </small>
                                            </td>
                                            <td className="py-4 font-semibold">
                                                {money(
                                                    invoice.total,
                                                    invoice.currency,
                                                )}
                                            </td>
                                            <td className="py-4 text-emerald-600">
                                                {money(
                                                    invoice.paid,
                                                    invoice.currency,
                                                )}
                                            </td>
                                            <td className="py-4 font-bold text-amber-600">
                                                {money(
                                                    invoice.due,
                                                    invoice.currency,
                                                )}
                                            </td>
                                            <td className="py-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-[11px] ${invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
                                                >
                                                    {invoice.status === 'paid'
                                                        ? 'تکمیل شده'
                                                        : 'نیازمند دریافت'}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            invoice.due <= 0
                                                        }
                                                        onClick={() =>
                                                            setSelected(invoice)
                                                        }
                                                        className="text-xs font-semibold text-primary disabled:text-slate-300"
                                                    >
                                                        ثبت دریافت
                                                    </button>
                                                    <Link
                                                        href={`/sales/${invoice.id}/invoice/print`}
                                                        title="چاپ فاکتور"
                                                        className="text-slate-400 hover:text-primary"
                                                    >
                                                        <Printer className="size-4" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filtered.length === 0 && (
                                <div className="p-12 text-center text-sm text-slate-500">
                                    فاکتوری پیدا نشد.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
            {selected && (
                <PaymentDialog
                    invoice={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </AppLayout>
    );
}

function Summary({
    title,
    value,
    icon: Icon,
    tone,
}: {
    title: string;
    value: string;
    icon: typeof CircleDollarSign;
    tone: 'blue' | 'green' | 'amber';
}) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
    };

    return (
        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3">
                <div className={`rounded-xl p-2.5 ${colors[tone]}`}>
                    <Icon className="size-5" />
                </div>
                <div>
                    <p className="text-xs text-slate-500">{title}</p>
                    <b className="mt-1 block text-xl">{value}</b>
                </div>
            </div>
        </div>
    );
}

// f
