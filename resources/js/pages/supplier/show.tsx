import { Link, router, useForm } from '@inertiajs/react';
import { Banknote, Building2, CalendarDays, CreditCard, FileText, HandCoins, Mail, MapPin, Phone, Receipt, Wallet, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import InputError from '@/components/input-error';
import LocationTranslator, { getDariCurrency } from '@/components/location-translator';
import { formatGregorianDate, formatPersianDate, PersianDatePicker } from '@/components/persian-date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { Currency, Supplier } from '@/types';

type Account = {
    currency_id: number;
    currency: string;
    supplied: number;
    paid: number;
    remaining: number;
};

type ReceiptLine = {
    id: number;
    item: string | null;
    quantity: number;
    unit_cost: number;
    subTotal: number;
};

type SupplierReceipt = {
    id: number;
    reference_no: string | null;
    notes: string | null;
    destination: string | null;
    total_amount: number;
    amount_paid: number;
    remaining: number;
    received_at: string | null;
    currency_id: number;
    currency: string | null;
    lines: ReceiptLine[];
};

type PaymentAllocation = {
    receipt: string | null;
    amount: number;
};

type SupplierPayment = {
    id: number;
    payment_no: string;
    amount: number;
    payment_method: string;
    reference_no: string | null;
    notes: string | null;
    paid_at: string;
    currency_id: number;
    currency: string | null;
    allocations: PaymentAllocation[];
    unallocated: number;
};

type PaymentForm = {
    supplier_id: number;
    currency_id: number;
    amount: number;
    payment_method: 'cash' | 'bank_transfer' | 'card' | 'other';
    paid_at: string;
    reference_no: string;
    notes: string;
    allocations: { goods_receipt_id: number; amount: number }[];
};

interface Props {
    supplier: Supplier;
    accounts: Account[];
    receipts: SupplierReceipt[];
    payments: SupplierPayment[];
    currencies: Currency[];
}

const paymentMethods: Record<PaymentForm['payment_method'], string> = {
    cash: 'نقدی',
    bank_transfer: 'حواله بانکی',
    card: 'کارت بانکی',
    other: 'سایر',
};

const money = (value: number, currency: string) =>
    `${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${getDariCurrency(currency)}`;

export default function Show({ supplier, accounts, receipts, payments, currencies }: Props) {
    const [selectedCurrencyId, setSelectedCurrencyId] = useState(
        accounts[0]?.currency_id ?? currencies[0]?.id ?? 0,
    );
    const [paymentOpen, setPaymentOpen] = useState(false);
    const currentAccount = accounts.find((account) => account.currency_id === selectedCurrencyId);
    const currentCurrency = currencies.find((currency) => currency.id === selectedCurrencyId);
    const currencyName = currentAccount?.currency ?? currentCurrency?.name ?? '';
    const currencyReceipts = useMemo(
        () => receipts.filter((receipt) => receipt.currency_id === selectedCurrencyId),
        [receipts, selectedCurrencyId],
    );
    const currencyPayments = useMemo(
        () => payments.filter((payment) => payment.currency_id === selectedCurrencyId),
        [payments, selectedCurrencyId],
    );

    const { data, setData, post, processing, errors, reset } = useForm<PaymentForm>({
        supplier_id: supplier.id,
        currency_id: selectedCurrencyId,
        amount: 0,
        payment_method: 'cash',
        paid_at: formatGregorianDate(new Date()),
        reference_no: '',
        notes: '',
        allocations: [],
    });

    const closePayment = () => {
        setPaymentOpen(false);
        reset();
        setData({
            supplier_id: supplier.id,
            currency_id: selectedCurrencyId,
            amount: 0,
            payment_method: 'cash',
            paid_at: formatGregorianDate(new Date()),
            reference_no: '',
            notes: '',
            allocations: [],
        });
    };

    const changeCurrency = (currencyId: number) => {
        setSelectedCurrencyId(currencyId);
        setData({
            ...data,
            currency_id: currencyId,
            allocations: [],
        });
    };

    const toggleAllocation = (receipt: SupplierReceipt, checked: boolean) => {
        const allocations = checked
            ? [...data.allocations, { goods_receipt_id: receipt.id, amount: Math.max(0, receipt.remaining) }]
            : data.allocations.filter((allocation) => allocation.goods_receipt_id !== receipt.id);
        setData('allocations', allocations);
    };

    const setAllocationAmount = (receiptId: number, amount: number) => {
        setData(
            'allocations',
            data.allocations.map((allocation) =>
                allocation.goods_receipt_id === receiptId ? { ...allocation, amount } : allocation,
            ),
        );
    };

    const submitPayment = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/supplier-payments', {
            onSuccess: closePayment,
        });
    };

    const paidTotal = currentAccount?.paid ?? 0;
    const suppliedTotal = currentAccount?.supplied ?? 0;
    const remainingTotal = currentAccount?.remaining ?? 0;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'تأمین‌کنندگان', href: '/stackholders' },
                { title: supplier.name, href: `/suppliers/${supplier.id}` },
            ]}
        >
            <main dir="rtl" className="min-h-screen space-y-6 bg-slate-50 p-3 pb-10 md:p-6 dark:bg-slate-950">
                <section className="overflow-hidden rounded-3xl bg-linear-to-l from-[#092b4c] to-[#125b78] p-6 text-white shadow-lg md:p-8">
                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex size-14 items-center justify-center rounded-2xl bg-white/10">
                                <Building2 className="size-7" />
                            </div>
                            <div>
                                <p className="text-sm text-cyan-100">حساب تأمین‌کننده</p>
                                <h1 className="mt-1 text-2xl font-bold md:text-3xl">{supplier.name}</h1>
                                <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs ${supplier.status ? 'bg-emerald-300/20 text-emerald-100' : 'bg-red-300/20 text-red-100'}`}>
                                    {supplier.status ? 'فعال' : 'غیرفعال'}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href={`/suppliers/${supplier.id}/edit`} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-50">
                                ویرایش اطلاعات
                            </Link>
                            <Button onClick={() => setPaymentOpen(true)} className="rounded-xl bg-emerald-500 text-white hover:bg-emerald-600">
                                <HandCoins className="ml-2 size-4" /> ثبت پرداخت
                            </Button>
                            <button
                                type="button"
                                onClick={() => router.put(`/suppliers/status/${supplier.id}`)}
                                className="rounded-xl border border-white/30 px-4 py-2 text-sm hover:bg-white/10"
                            >
                                {supplier.status ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                            </button>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/15 pt-5 text-sm text-blue-50">
                        {supplier.phone && <span className="inline-flex items-center gap-2"><Phone className="size-4" />{supplier.phone}</span>}
                        {supplier.email && <span className="inline-flex items-center gap-2"><Mail className="size-4" />{supplier.email}</span>}
                        {supplier.address && <span className="inline-flex items-center gap-2"><MapPin className="size-4" />{supplier.address}</span>}
                    </div>
                </section>

                <div className="flex flex-col gap-2 sm:max-w-xs">
                    <Label htmlFor="account-currency">نمایش حساب بر اساس واحد پول</Label>
                    <select
                        id="account-currency"
                        className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:bg-slate-900"
                        value={selectedCurrencyId}
                        onChange={(event) => changeCurrency(Number(event.target.value))}
                    >
                        {currencies.map((currency) => (
                            <option key={currency.id} value={currency.id}>{getDariCurrency(currency.name)}</option>
                        ))}
                    </select>
                </div>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard title="مجموع اجناس تأمین‌شده" value={money(suppliedTotal, currencyName)} icon={<Receipt />} tone="blue" />
                    <StatCard title="مجموع پرداخت‌شده" value={money(paidTotal, currencyName)} icon={<HandCoins />} tone="emerald" />
                    <StatCard title={remainingTotal < 0 ? 'اعتبار پیش‌پرداخت' : 'باقی‌مانده قابل پرداخت'} value={money(Math.abs(remainingTotal), currencyName)} icon={<Wallet />} tone="amber" />
                    <StatCard title="تعداد رسیدها" value={`${currencyReceipts.length} رسید`} icon={<FileText />} tone="violet" />
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b p-5">
                        <div>
                            <h2 className="text-lg font-bold">رسیدها و اجناس تأمین‌شده</h2>
                            <p className="mt-1 text-sm text-slate-500">باقی‌مانده هر رسید بر اساس پرداخت‌های تخصیص‌یافته</p>
                        </div>
                        <Receipt className="size-5 text-cyan-700" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-212.5 text-sm">
                            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800">
                                <tr>
                                    <th className="px-4 py-3 text-right">رسید / تاریخ</th>
                                    <th className="px-4 py-3 text-right">اجناس</th>
                                    <th className="px-4 py-3 text-right">موقعیت</th>
                                    <th className="px-4 py-3 text-left">مجموع</th>
                                    <th className="px-4 py-3 text-left">پرداخت‌شده</th>
                                    <th className="px-4 py-3 text-left">باقی‌مانده</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {currencyReceipts.map((receipt) => (
                                    <tr key={receipt.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                        <td className="px-4 py-4">
                                            <Link href={`/receipts/${receipt.id}`} className="font-semibold text-cyan-700 hover:underline">
                                                {receipt.reference_no || `GR-${receipt.id}`}
                                            </Link>
                                            <span className="mt-1 block text-xs text-slate-500">{formatPersianDate(receipt.received_at ?? undefined)}</span>
                                        </td>
                                        <td className="max-w-xs px-4 py-4">
                                            {receipt.lines.length ? receipt.lines.map((line) => `${line.item ?? 'جنس'} (${line.quantity})`).join('، ') : '—'}
                                        </td>
                                        <td className="px-4 py-4">{LocationTranslator(receipt.destination ?? '—') }</td>
                                        <td className="px-4 py-4 text-left">{money(receipt.total_amount, currencyName)}</td>
                                        <td className="px-4 py-4 text-left text-emerald-700">{money(receipt.amount_paid, currencyName)}</td>
                                        <td className="px-4 py-4 text-left font-semibold text-amber-700">{money(receipt.remaining, currencyName)}</td>
                                    </tr>
                                ))}
                                {currencyReceipts.length === 0 && <EmptyRow columns={6} message="برای این واحد پول رسیدی ثبت نشده است." />}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b p-5">
                        <div>
                            <h2 className="text-lg font-bold">تاریخچه پرداخت‌ها</h2>
                            <p className="mt-1 text-sm text-slate-500">پرداخت‌ها، رسیدهای تسویه‌شده و اعتبار باقی‌مانده</p>
                        </div>
                        <Banknote className="size-5 text-emerald-700" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-sm">
                            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800">
                                <tr>
                                    <th className="px-4 py-3 text-right">شماره / تاریخ</th>
                                    <th className="px-4 py-3 text-right">روش پرداخت</th>
                                    <th className="px-4 py-3 text-right">تخصیص به رسید</th>
                                    <th className="px-4 py-3 text-left">مبلغ پرداخت</th>
                                    <th className="px-4 py-3 text-left">اعتبار تخصیص‌نیافته</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {currencyPayments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td className="px-4 py-4">
                                            <span className="font-semibold">{payment.payment_no}</span>
                                            <span className="mt-1 block text-xs text-slate-500">{formatPersianDate(payment.paid_at)}</span>
                                        </td>
                                        <td className="px-4 py-4">{paymentMethods[payment.payment_method as PaymentForm['payment_method']] ?? payment.payment_method}</td>
                                        <td className="px-4 py-4">
                                            {payment.allocations.length
                                                ? payment.allocations.map((allocation) => `${allocation.receipt ?? 'رسید'} (${money(allocation.amount, currencyName)})`).join('، ')
                                                : 'پیش‌پرداخت'}
                                        </td>
                                        <td className="px-4 py-4 text-left font-semibold">{money(payment.amount, currencyName)}</td>
                                        <td className="px-4 py-4 text-left">{money(payment.unallocated, currencyName)}</td>
                                    </tr>
                                ))}
                                {currencyPayments.length === 0 && <EmptyRow columns={5} message="برای این واحد پول پرداختی ثبت نشده است." />}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            {paymentOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 md:p-6">
                    <section dir="rtl" className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 md:p-7">
                        <div className="mb-5 flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold">ثبت پرداخت تأمین‌کننده</h2>
                                <p className="mt-1 text-sm text-slate-500">{supplier.name}</p>
                            </div>
                            <button type="button" onClick={closePayment} aria-label="بستن" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                                <X className="size-5" />
                            </button>
                        </div>
                        <form onSubmit={submitPayment} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="payment-currency">واحد پول</Label>
                                    <select
                                        id="payment-currency"
                                        className="h-10 rounded-md border bg-background px-3"
                                        value={data.currency_id}
                                        onChange={(event) => {
                                            const currencyId = Number(event.target.value);
                                            setData({ ...data, currency_id: currencyId, allocations: [] });
                                        }}
                                    >
                                        {currencies.map((currency) => <option key={currency.id} value={currency.id}>{getDariCurrency(currency.name)}</option>)}
                                    </select>
                                    <InputError message={errors.currency_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="payment-amount">مبلغ پرداخت</Label>
                                    <Input id="payment-amount" type="number" min="0.01" step="0.01" value={data.amount || ''} onChange={(event) => setData('amount', Number(event.target.value))} />
                                    <InputError message={errors.amount} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="payment-date">تاریخ پرداخت</Label>
                                <PersianDatePicker id="payment-date" value={data.paid_at} onChange={(value) => setData('paid_at', value)} />
                                <InputError message={errors.paid_at} />
                            </div>

                            <fieldset className="space-y-2 rounded-xl border p-4">
                                <legend className="px-2 text-sm font-semibold">تخصیص به رسیدهای پرداخت‌نشده (اختیاری)</legend>
                                {receipts.filter((receipt) => receipt.currency_id === data.currency_id && receipt.remaining > 0).map((receipt) => {
                                    const allocation = data.allocations.find((item) => item.goods_receipt_id === receipt.id);

                                    return (
                                        <div key={receipt.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(allocation)}
                                                onChange={(event) => toggleAllocation(receipt, event.target.checked)}
                                                aria-label={`تخصیص به رسید ${receipt.reference_no}`}
                                            />
                                            <span className="min-w-32 flex-1 text-sm">{receipt.reference_no} · باقی‌مانده {money(receipt.remaining, receipt.currency ?? '')}</span>
                                            {allocation && (
                                                <Input
                                                    type="number"
                                                    min="0.01"
                                                    max={receipt.remaining}
                                                    step="0.01"
                                                    value={allocation.amount}
                                                    onChange={(event) => setAllocationAmount(receipt.id, Number(event.target.value))}
                                                    className="w-36"
                                                    aria-label={`مبلغ تخصیص به ${receipt.reference_no}`}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                                {!receipts.some((receipt) => receipt.currency_id === data.currency_id && receipt.remaining > 0) && (
                                    <p className="text-sm text-slate-500">رسید پرداخت‌نشده‌ای با این واحد پول وجود ندارد؛ این مبلغ به‌عنوان پیش‌پرداخت ثبت می‌شود.</p>
                                )}
                                <InputError message={errors.allocations} />
                                {Object.entries(errors).filter(([key]) => key.startsWith('allocations.')).map(([key, message]) => (
                                    <InputError key={key} message={message} />
                                ))}
                            </fieldset>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="payment-method">روش پرداخت</Label>
                                    <select
                                        id="payment-method"
                                        className="h-10 rounded-md border bg-background px-3"
                                        value={data.payment_method}
                                        onChange={(event) => setData('payment_method', event.target.value as PaymentForm['payment_method'])}
                                    >
                                        {Object.entries(paymentMethods).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="payment-reference">شماره مرجع</Label>
                                    <Input id="payment-reference" value={data.reference_no} onChange={(event) => setData('reference_no', event.target.value)} />
                                    <InputError message={errors.reference_no} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="payment-notes">یادداشت</Label>
                                <textarea id="payment-notes" value={data.notes} onChange={(event) => setData('notes', event.target.value)} className="min-h-20 rounded-md border bg-background p-3 text-sm" />
                                <InputError message={errors.notes} />
                            </div>
                            <p className="text-xs text-slate-500">تاریخ نمایشی با تقویم هجری خورشیدی است؛ تاریخ پرداخت در سیستم به‌صورت میلادی ذخیره می‌شود.</p>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={closePayment}>انصراف</Button>
                                <Button type="submit" disabled={processing || currencies.length === 0}>
                                    <CreditCard className="ml-2 size-4" />{processing ? 'در حال ثبت...' : 'ثبت پرداخت'}
                                </Button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </AppLayout>
    );
}

function StatCard({ title, value, icon, tone }: { title: string; value: string; icon: ReactNode; tone: string }) {
    const colors: Record<string, string> = {
        blue: 'bg-sky-50 text-sky-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        amber: 'bg-amber-50 text-amber-700',
        violet: 'bg-violet-50 text-violet-700',
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900">
            <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{title}</span>
                <span className={`rounded-xl p-2 ${colors[tone]}`}>{icon}</span>
            </div>
            <p className="mt-4 text-xl font-bold">{value}</p>
        </div>
    );
}

function EmptyRow({ columns, message }: { columns: number; message: string }) {
    return (
        <tr>
            <td colSpan={columns} className="px-4 py-10 text-center text-slate-500">
                <CalendarDays className="mx-auto mb-2 size-5 opacity-60" />
                {message}
                <Link href="/receipts/create" className="mr-2 text-cyan-700 hover:underline">
                    ثبت رسید
                </Link>
            </td>
        </tr>
    );
}
