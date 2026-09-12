import type { FormDataErrors } from '@inertiajs/core';
import type { SetDataAction } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Check, FileText, Wallet } from 'lucide-react';
import React from 'react'
import InputError from '../input-error';
import { getDariCurrency } from '../location-translator';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
type Currency = { id: number; name: string };
type SaleLine = { item_id: number; quantity: number; unit_price: number };

type DataType = {
    discount_total: number;
    customer_id:number;
    notes?: string;
    amount_paid: number;
    currency_id: number;
    saleLines: SaleLine[];
    create_invoice: boolean;
};
interface Props {
    subtotal: number;
    currency: Currency;
    data: DataType
    setData: SetDataAction<DataType>
    errors: FormDataErrors<DataType>
    grandTotal: number;
    processing: boolean;
    lines:SaleLine[];
    createInvoice: boolean;
    onCreateInvoiceChange: (value: boolean) => void;

}
const SalePayment = ({ subtotal, currency, data, setData, errors, grandTotal,processing,lines, createInvoice, onCreateInvoiceChange }: Props) => {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="space-y-3 text-sm">
                <div className="mb-5 flex items-center gap-3">
                    <Wallet className="size-5 text-emerald-600" />
                    <div>
                        <h2 className="font-bold">
                            جزئیات پرداخت
                        </h2>
                        <p className="text-xs text-slate-500">
                            اطلاعات فاکتور را تکمیل کنید.
                        </p>
                    </div>
                </div>
                <div className="flex justify-between text-slate-500">
                    <span>جمله پول</span>
                    <b>
                        {subtotal
                        }
                        {currency?.name ??
                            currency.name ?? ''}
                    </b>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">
                        تخفیف
                    </span>
                    <Input
                        type="number"
                        min="0"
                        value={data.discount_total}
                        dir="ltr"
                        onChange={(event) =>
                            setData(
                                'discount_total',
                                Number(event.target.value),
                            )
                        }
                        className="h-8 w-28 text-left"
                    />
                </div>
                <div className="flex justify-between border-t pt-3 text-base font-bold">
                    <span>قابل پرداخت</span>
                    <span className="text-primary">
                        {grandTotal.toFixed(2)
                        }
                        {getDariCurrency(currency?.name) ?? ''}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">
                        پرداخت پول
                    </span>
                    <Input
                        type="number"
                        min="0"
                        max={grandTotal}
                        value={data.amount_paid}

                        onChange={(event) =>
                            setData(
                                'amount_paid',
                                Number(event.target.value),
                            )
                        }
                        className="h-8 w-28"
                        dir="ltr"
                    />
                </div>
            </div>
            <div className="mt-5 grid gap-2">
                <Label htmlFor="notes">یادداشت فروش</Label>
                <textarea
                    id="notes"
                    value={data.notes}
                    onChange={(event) =>
                        setData('notes', event.target.value)
                    }
                    placeholder="یادداشت اختیاری..."
                    className="min-h-20 rounded-lg border p-3 text-sm"
                />
            </div>
            <InputError
                message={errors.saleLines}
                className="mt-3"
            />
            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/60">
                <input type="checkbox" checked={createInvoice || data.amount_paid<grandTotal || data.customer_id>0} onChange={(event) => onCreateInvoiceChange(event.target.checked)} className="size-4 accent-primary" />
                <FileText className="size-4 text-primary" />
                <span><b className="block">چاپ فاکتور بعد از ثبت</b><small className="text-xs text-slate-500">اختیاری است؛ فروش بدون فاکتور هم ثبت می‌شود.</small></span>
            </label>
            <Button
                disabled={processing || lines.length === 0}
                type="submit"
                className="mt-5 h-9 w-full bg-emerald-600 text-base hover:bg-emerald-700"
            >
                <Check className="size-5" />
                {processing ? 'در حال ثبت...' : 'ثبت فروش'}
            </Button>
            <Button
                asChild
                variant="ghost"
                type="button"
                className="w-full h-7"
            >
                <Link href="/sales">انصراف</Link>
            </Button>
        </section>
    )
}

export default SalePayment