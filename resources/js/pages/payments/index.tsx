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

type Payment = {
    id: number;
    amount: number;
    method: string;
    reference?: string;
    paidAt: string;
};
type Invoice = {
    id: number;
    saleId: number;
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
const methods = {
    cash: { label: 'نقدی', icon: Banknote },
    card: { label: 'کارت بانکی', icon: WalletCards },
    bank_transfer: { label: 'حواله بانکی', icon: Landmark },
    other: { label: 'سایر', icon: Receipt },
};
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
                                                        href={`/sales/${invoice.saleId}/invoice/print`}
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

function PaymentDialog({
    invoice,
    onClose,
}: {
    invoice: Invoice;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors } = useForm({
        invoice_id: invoice.id,
        amount: invoice.due,
        method: 'cash',
        reference: '',
        paid_at: new Date().toISOString().slice(0, 16),
        notes: '',
    });
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/payments', { onSuccess: onClose });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
                <div className="mb-5 flex items-start justify-between">
                    <div>
                        <p className="text-xs text-slate-500">
                            ثبت دریافت برای
                        </p>
                        <h2 className="mt-1 text-xl font-bold">
                            {invoice.number}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {invoice.customer}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400"
                    >
                        ×
                    </button>
                </div>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
                        <div>
                            <span className="block text-xs text-slate-500">
                                پرداخت‌شده تاکنون
                            </span>
                            <b className="mt-1 block text-emerald-600">
                                {money(invoice.paid, invoice.currency)}
                            </b>
                        </div>
                        <div>
                            <span className="block text-xs text-slate-500">
                                باقی‌مانده
                            </span>
                            <b className="mt-1 block text-amber-600">
                                {money(invoice.due, invoice.currency)}
                            </b>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>مبلغ دریافت</Label>
                        <Input
                            type="number"
                            min="0.01"
                            max={invoice.due}
                            step="0.01"
                            value={data.amount}
                            onChange={(event) =>
                                setData('amount', Number(event.target.value))
                            }
                            dir="ltr"
                        />
                        <InputError message={errors.amount} />
                    </div>
                    <div className="grid gap-2">
                        <Label>روش پرداخت</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(methods).map(([key, option]) => {
                                const Icon = option.icon;

                                return (
                                    <button
                                        type="button"
                                        key={key}
                                        onClick={() => setData('method', key)}
                                        className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${data.method === key ? 'border-primary bg-blue-50 text-primary' : 'border-slate-200 text-slate-500'}`}
                                    >
                                        <Icon className="size-4" />
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>شماره مرجع</Label>
                        <Input
                            value={data.reference}
                            onChange={(event) =>
                                setData('reference', event.target.value)
                            }
                            placeholder="اختیاری برای کارت یا حواله"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>یادداشت</Label>
                        <textarea
                            value={data.notes}
                            onChange={(event) =>
                                setData('notes', event.target.value)
                            }
                            className="min-h-20 rounded-lg border p-3 text-sm"
                            placeholder="یادداشت رسید..."
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button
                            disabled={processing}
                            type="submit"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Check className="size-4" />
                            {processing
                                ? 'در حال ثبت...'
                                : 'ثبت پرداخت و صدور رسید'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            انصراف
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
