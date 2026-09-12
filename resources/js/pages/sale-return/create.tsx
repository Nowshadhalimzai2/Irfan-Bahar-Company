import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, PackageCheck, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';

type Location = { id: number; name: string };
type ReturnableLine = { id: number; item_id: number; item_name: string; unit?: string; quantity: number; returned_quantity: number; remaining_quantity: number; unit_price: number };
type Sale = { id: number; total: number; after_descount_total: number; sold_at: string; customer?: { name: string }; currency?: { name: string }; invoice?: { invoice_number: string }, discount_total: number };
type Props = {
    sale: Sale;
    locations: Location[];
    returnableLines: ReturnableLine[];
    paidAmount: number;
};
type ReturnLine = { sale_line_id: number; quantity: number; condition: string; restock_action: 'restock' | 'none'; notes: string };

const money = (value: number, currency = 'AFG') => `${Number(value || 0).toString()} ${currency === 'AFG' ? 'افغانی' : currency === 'PKR' ? 'کلداری' : 'دالر'}`;

export default function Create({ sale, locations, returnableLines, paidAmount }: Props) {
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [restock, setRestock] = useState<Record<number, boolean>>({});
    const currency = sale.currency?.name ?? 'AFG';
    const selectedTotal = useMemo(() => returnableLines.reduce((sum, line) => sum + (quantities[line.id] || 0) * line.unit_price, 0), [quantities, returnableLines]);
    const form = useForm({ location_id: locations[0]?.id?.toString() ?? '', reason: '', notes: '', refund_amount: '', refund_method: '', refund_reference: '', lines: [] as ReturnLine[] });
    const colculateRefundableAmount = (total: number, paid: number, returnTotal: number, discount: number) => {
        // total = 1350.4
        // paid = 1350
        // returnTotal = 1350.4
        // DISCOUNT: 54
        // refundable = ?
        console.log(total + ' : ', paid + ' : ', returnTotal);

        const balance = Math.max(total - paid, 0);
        console.log('balance : ', balance);
        console.log('refundable : ', Math.max(returnTotal - balance - discount, 0))

        return Math.max(returnTotal - balance - discount, 0);
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({ ...data, location_id: Number(data.location_id), refund_amount: data.refund_amount === '' ? 0 : Number(data.refund_amount), lines: returnableLines.filter((line) => (quantities[line.id] || 0) > 0).map((line) => ({ sale_line_id: line.id, quantity: quantities[line.id], condition: 'good', restock_action: restock[line.id] === false ? 'none' : 'restock', notes: '' })) }));
        form.post(`/sales/${sale.id}/returns`);
    }

    return <AppLayout breadcrumbs={[{ title: 'فروشات', href: '/sales' }, { title: 'برگشت فروش', href: `/sales/${sale.id}/returns/create` }]}>
        <Head title="برگشت فروش" />

        <div dir="rtl" className="min-h-screen space-y-6 bg-[#f6f9fc] p-3 pb-10 md:p-6">
            <section className="relative overflow-hidden rounded-4xl bg-[#092b4c] p-6 text-white shadow-xl md:p-8">
                <div className="relative flex items-center justify-between gap-5">
                    <div><p className="mb-2 flex items-center gap-2 text-sm text-cyan-200"><RotateCcw className="size-4" /> مرکز برگشت فروش</p>
                        <h1 className="text-2xl font-bold md:text-3xl">ثبت برگشت برای {sale.invoice?.invoice_number || `فروش #${sale.id}`}</h1><p className="mt-2 text-blue-100">{sale.customer?.name || 'مشتری نقدی'} · مبلغ فروش {money(sale.after_descount_total, currency)}</p>

                    </div>
                    <PackageCheck className="hidden size-12 text-cyan-200 sm:block" />
                </div>

            </section>
            <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.7fr)]">
                <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-5"><h2 className="text-xl font-bold text-slate-800">اقلام قابل برگشت</h2><p className="mt-1 text-sm text-slate-500">مقدار برگشتی را وارد و مشخص کنید که جنس دوباره به موجودی اضافه شود.</p>

                    </div>

                    <div className="divide-y divide-slate-100">{returnableLines.map((line) =>
                        <div key={line.id} className="grid gap-4 p-5 md:grid-cols-[1fr_140px_150px]">
                            <div><p className="font-semibold text-slate-800">{line.item_name}</p>
                                <p className="mt-1 text-xs text-slate-500">فروخته‌شده: {line.quantity} {line.unit || ''} · باقی‌مانده برای برگشت: {line.remaining_quantity}</p>
                                <p className="mt-1 text-xs text-slate-400">قیمت واحد: {money(line.unit_price, currency)}</p>

                            </div>

                            <label className="text-sm text-slate-600">مقدار برگشت<input type="number" min="0" max={line.remaining_quantity} step="0.001" value={quantities[line.id] ?? ''} onChange={(event) => setQuantities({ ...quantities, [line.id]: Math.min(Number(event.target.value), line.remaining_quantity) })} className="mt-2 w-full rounded-xl border-slate-200" />
                            </label>
                            <label className="flex items-center gap-2 self-end rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><input type="checkbox" checked={restock[line.id] !== false} onChange={(event) => setRestock({ ...restock, [line.id]: event.target.checked })} /> بازگشت به موجودی
                            </label>
                        </div>
                    )}
                    </div>
                    {!returnableLines.some((line) => line.remaining_quantity > 0) && <p className="p-8 text-center text-sm text-slate-500">تمام اقلام این فروش قبلاً برگشت داده شده‌اند.</p>
                    }
                </section>

                <div className="space-y-6"><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-800">جزئیات برگشت</h2>
                    <div className="mt-4 space-y-4">
                        <label className="block text-sm text-slate-600">محل برگشت<select value={form.data.location_id} onChange={(event) => form.setData('location_id', event.target.value)} className="mt-2 w-full rounded-xl border-slate-200"><option value="">انتخاب محل</option>
                            {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>
                            )}</select>
                        </label>
                        <label className="block text-sm text-slate-600">دلیل برگشت<input value={form.data.reason} onChange={(event) => form.setData('reason', event.target.value)} placeholder="مثلاً جنس خراب یا اشتباه" className="mt-2 w-full rounded-xl border-slate-200" />
                        </label>
                        <label className="block text-sm text-slate-600">یادداشت<textarea value={form.data.notes} onChange={(event) => form.setData('notes', event.target.value)} rows={3} className="mt-2 w-full rounded-xl border-slate-200" />

                        </label>
                    </div>

                </section>
                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-800">بازپرداخت اختیاری</h2>
                        {/* <div className="mt-4 space-y-4"><p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">حداکثر بازپرداخت قابل ثبت: {money(Math.min(selectedTotal, Number(sale.total || 0)), currency)}</p> */}
                        <div className="mt-4 space-y-4"><p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">حداکثر بازپرداخت قابل ثبت: {money(colculateRefundableAmount(sale.after_descount_total, paidAmount, selectedTotal, sale.discount_total), currency)}</p>

                            <label className="block text-sm text-slate-600">مبلغ بازپرداخت<input type="number" min="0" max={colculateRefundableAmount(sale.after_descount_total, paidAmount, selectedTotal, sale.discount_total)} step="0.01" value={form.data.refund_amount} onChange={(event) => form.setData('refund_amount', event.target.value)} className="mt-2 w-full rounded-xl border-slate-200" />
                            </label>
                            <label className="block text-sm text-slate-600">روش بازپرداخت<select value={form.data.refund_method} onChange={(event) => form.setData('refund_method', event.target.value)} className="mt-2 w-full rounded-xl border-slate-200"><option value="">انتخاب روش</option>
                                <option value="cash">نقدی</option>
                                <option value="bank_transfer">حواله بانکی</option>
                                <option value="office">دفتر</option>
                            </select>
                            </label>
                            <label className="block text-sm text-slate-600">مرجع بازپرداخت<input value={form.data.refund_reference} onChange={(event) => form.setData('refund_reference', event.target.value)} className="mt-2 w-full rounded-xl border-slate-200" />
                            </label>
                        </div>

                    </section>
                    <div className="rounded-3xl bg-[#092b4c] p-5 text-white shadow-lg">
                        <div className="flex items-center justify-between"><span className="text-blue-100">مجموع برگشت</span><strong className="text-xl">{money(selectedTotal, currency)}</strong>
                        </div>
                        <button type="submit" disabled={form.processing || selectedTotal <= 0 || !form.data.location_id} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-bold text-[#092b4c] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"><CheckCircle2 size={18} /> ثبت برگشت</button>{form.errors.lines && <p className="mt-3 text-sm text-red-200">{form.errors.lines}</p>
                        }{form.errors.refund_amount && <p className="mt-3 text-sm text-red-200">{form.errors.refund_amount}</p>
                        }
                    </div>
                    <Link href={`/sales/${sale.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700"><ArrowRight size={17} /> بازگشت به فروش</Link>
                </div>

            </form>

        </div>

    </AppLayout>;
}
