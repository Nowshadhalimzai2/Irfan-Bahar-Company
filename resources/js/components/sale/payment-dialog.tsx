import { Banknote, Check, Landmark, Receipt, WalletCards } from "lucide-react";
import { Label } from "recharts";
import { Input } from "../ui/input";
import InputError from "../input-error";
import { FormEvent } from "react";
import { getDariCurrency } from "../location-translator";
import { useForm } from "@inertiajs/react";
import { Button } from "../ui/button";

const methods = {
    cash: { label: 'نقدی', icon: Banknote },
    card: { label: 'کارت بانکی', icon: WalletCards },
    bank_transfer: { label: 'حواله بانکی', icon: Landmark },
    other: { label: 'سایر', icon: Receipt },
};
const money = (value: number, currency: string) =>{
    const total = value ?? 0;
    return `${total.toFixed(2).toString()} ${getDariCurrency(currency)}`;}

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
function PaymentDialog({
    invoice,
    onClose,
}: {
    invoice: Invoice;
    onClose: () => void;
}) {

    console.log('dialog inoive', invoice);
    
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
                                {money(invoice.paid , invoice.currency)}
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

export default PaymentDialog