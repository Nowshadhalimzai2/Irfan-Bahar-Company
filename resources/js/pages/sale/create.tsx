import { Head, Link, useForm } from '@inertiajs/react';
import {
    Barcode,
    Check,
    CircleAlert,
    File,
    Minus,
    Package,
    Plus,
    ScanLine,
    Search,
    Sheet,
    ShoppingCart,
    Trash2,
    UserRound,
    Wallet,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { getDariCurrency, getDariItemUnit } from '@/components/location-translator';
import SaleItem from '@/components/sale-item';
import SaleItemList from '@/components/sale/sale-item-list';
import SaleDetail from '@/components/sale/sale-detail';
import custoemrs from '@/routes/custoemrs';

type Balance = {
    location_id: number;
    quantity_on_hand: number;
    reserved: number;
};
type Item = {
    id: number;
    name: string;
    code: string;
    sku: string;
    unit: string;
    default_sale_price: number;
    product?: { barcode: string, weight: number, per_pack: number };
    inventory_balances?: Balance[];
};
type Currency = { id: number; name: string };
type Location = { id: number; name: string; address: string };
type SaleLine = { item_id: number; quantity: number; unit_price: number };
type Customer = { id: number; name: string; phone?: string };

type Props = {
    items: Item[];
    currencies: Currency[];
    locations: Location[];
        customers: Customer[];

};

// const money = (value: number, currency: string) =>
//     `${value.toLocaleString('fa-AF', { maximumFractionDigits: 2 })} ${currency}`;


export default function Create({
    items,
    currencies,
    locations,
    customers
}: Props) {
    const [barcode, setBarcode] = useState('');
    const [search, setSearch] = useState('');
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);
    const [lines, setLines] = useState<SaleLine[]>([]);
    const barcodeRef = useRef<HTMLInputElement>(null);
    const defaultCurrency = currencies[0];
    const { data, setData, post, processing, errors } = useForm({
        location_id: locations[0]?.id ?? 0,
        customer_id: 0,
        customer_name: '',
        currency_id: defaultCurrency?.id ?? 0,
        sold_at: new Date().toISOString().slice(0, 16),
        discount_total: 0,
        amount_paid: 0,
        notes: '',
        saleLines: [] as SaleLine[],
    });
    const currency = currencies.find((entry) => entry.id === data.currency_id) ?? defaultCurrency;

    useEffect(() => setData('saleLines', lines), [lines, setData]);

    const getStock = (item: Item) => {
        const balance = item.inventory_balances?.find(
            (entry) => entry.location_id === data.location_id,
        );

        return Math.max(
            0,
            Number(balance?.quantity_on_hand ?? 0) -
            Number(balance?.reserved ?? 0),
        );
    };

    const filteredItems = items
        .filter((item) =>
            `${item.name} ${item.code} ${item.sku} ${item.product?.barcode ?? ''}`
                .toLowerCase()
                .includes(search.toLowerCase()),
        )
        .slice(0, 8);
    const subtotal = lines.reduce(
        (sum, line) => sum + line.quantity * line.unit_price,
        0,
    );
    const grandTotal = Math.max(0, subtotal - Number(data.discount_total || 0));
    const addItem = (item: Item) => {
        const existing = lines.find((line) => line.item_id === item.id);
        const quantity = (existing?.quantity ?? 0) + 1;

        if (quantity > getStock(item)) {
            setMessage({
                type: 'error',
                text: `موجودی ${item.name} کافی نیست.`,
            });

            return;
        }

        setLines((current) =>
            existing
                ? current.map((line) =>
                    line.item_id === item.id ? { ...line, quantity } : line,
                )
                : [
                    ...current,
                    {
                        item_id: item.id,
                        quantity: 1,
                        unit_price: Number(item.default_sale_price),
                    },
                ],
        );
        setBarcode('');
        setSearch('');
        setMessage({ type: 'success', text: `${item.name} به سبد اضافه شد.` });
        barcodeRef.current?.focus();
    };
    const scan = (event?: { preventDefault: () => void }) => {
        event?.preventDefault();
        const code = barcode.trim().toLowerCase();

        if (!code) {
            return;
        }

        const item = items.find((entry) =>
            [entry.product?.barcode, entry.code, entry.sku].some(
                (value) => value?.toLowerCase() === code,
            ),
        );

        if (item) {
            addItem(item);
        } else {
            setMessage({
                type: 'error',
                text: 'جنس با این بارکد در سیستم پیدا نشد.',
            });
        }
    };
    const updateLine = (itemId: number, change: number) =>
        setLines((current) =>
            current.map((line) =>
                line.item_id === itemId
                    ? {
                        ...line,
                        quantity: Math.min(
                            getStock(
                                items.find((item) => item.id === itemId)!,
                            ),
                            Math.max(1, line.quantity + change),
                        ),
                    }
                    : line,
            ),
        );
    const removeLine = (itemId: number) =>
        setLines((current) =>
            current.filter((line) => line.item_id !== itemId),
        );
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/sales');
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'فروشات', href: '/sales' },
                { title: 'فروش نو', href: '/sales/create' },
            ]}
        >
            <Head title="ثبت فروش جدید" />
            <div
                dir="rtl"
                className="min-h-full bg-[#f6f9fc] px-1 pb-10 dark:bg-transparent"
            >
                <div className="mx-auto max-w-7xl space-y-5">
                    <section className="relative overflow-hidden rounded-[1.75rem] bg-[#092b4c] px-6 py-7 text-white shadow-[0_20px_50px_rgba(9,43,76,0.2)] sm:px-8">
                        <div className="absolute -top-16 -left-8 h-48 w-48 rounded-full border-24 border-cyan-300/10" />
                        <div className="absolute -bottom-16 right-80 h-48 w-48 rounded-full border-24 border-cyan-300/10" />
                        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-sm text-cyan-200">
                                    <ScanLine className="size-4" />فورم فروشات
                                </div>
                                <h1 className="text-2xl font-bold sm:text-3xl">
                                    فروش جدید را سریع ثبت کنید
                                </h1>
                                <p className="mt-2 text-sm text-blue-100">
                                    بارکد را اسکن کنید؛ قیمت، موجودی و جمع
                                    فاکتور خودکار آماده می‌شود.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm">
                                <Barcode className="size-5 text-[#ffc107]" />{' '}
                                اسکنر آماده است{' '}
                                <span className="size-2 rounded-full bg-emerald-400" />
                            </div>
                        </div>
                    </section>
                    <form
                        onSubmit={submit}
                        className="grid gap-5 xl:grid-cols-[1fr_380px]"
                    >
                        <div className="space-y-5">
                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
                                <div className="mb-5 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold">
                                            افزودن جنس
                                        </h2>
                                        <p className="mt-1 text-xs text-slate-500">
                                            بارکدخوان را روی فیلد زیر بگیرید یا
                                            جنس را جستجو کنید.
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-blue-50 p-2.5 text-primary">
                                        <ScanLine className="size-5" />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Barcode className="absolute top-1/2 right-3 size-5 -translate-y-1/2 text-primary" />
                                        <Input
                                            ref={barcodeRef}
                                            autoFocus
                                            value={barcode}
                                            onChange={(event) =>
                                                setBarcode(event.target.value)
                                            }
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    scan(event);
                                                }
                                            }}
                                            placeholder="بارکد را اسکن کنید و Enter بزنید..."
                                            className="h-12 border-blue-200 bg-blue-50/40 pr-11 text-base"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => scan()}
                                        className="h-12 px-5"
                                    >
                                        <ScanLine className="size-4" /> افزودن
                                    </Button>
                                </div>
                                {message && (
                                    <div
                                        className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
                                    >
                                        {message.type === 'success' ? (
                                            <Check className="size-4" />
                                        ) : (
                                            <CircleAlert className="size-4" />
                                        )}
                                        {message.text}
                                        <button
                                            type="button"
                                            className="mr-auto"
                                            onClick={() => setMessage(null)}
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </div>
                                )}
                                <div className="relative mt-5">
                                    <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="جستجوی نام، کد یا SKU..."
                                        className="pr-10"
                                    />
                                </div>
                                {search && (
                                    <div className="mt-2 divide-y rounded-xl border bg-white shadow-lg dark:bg-slate-900">
                                        {filteredItems.map((item) => (
                                            <button
                                                type="button"
                                                key={item.id}
                                                onClick={() => addItem(item)}
                                                className="flex w-full items-center gap-3 p-2 text-right hover:bg-slate-50"
                                            >
                                                <Package className="size-4 text-primary" />
                                                <span className="min-w-0 flex-1">
                                                    <b className="block truncate text-sm">
                                                        {item.name}  <small className='text-gray-500 text-xs'>
                                                            :
                                                            ({getStock(item)} {getDariItemUnit(item.unit)})
                                                        </small>
                                                    </b>
                                                    <small className="text-xs text-slate-400">
                                                        {item.product
                                                            ?.barcode ??
                                                            item.sku}{' '}

                                                    </small>
                                                </span>
                                                <div className='flex flex-col'>
                                                    <span className="text-sm font-bold">
                                                        {item.default_sale_price}
                                                        {' '} {getDariCurrency(currency?.name ?? 'AFG')}
                                                    </span>
                                                    {item.product &&
                                                        <small className='text-xs text-gray-400'>
                                                            {((item?.product?.weight ?? 1) / (item.product?.per_pack ?? 1)) * 1000} وزن
                                                        </small>}
                                                </div>
                                            </button>
                                        ))}
                                        {filteredItems.length === 0 && (
                                            <p className="p-4 text-center text-xs text-slate-500">
                                                جنسی پیدا نشد.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </section>
                            {/* ============== SALE ITEM LIST  */}
                            <SaleItemList 
                                currency={currency}
                                getStock={getStock}
                                items={items}
                                lines={lines}
                                setLines={setLines}
                                removeLine={removeLine}
                                updateLine={updateLine}
                                
                            />
                           
                        </div>
                        <aside className="space-y-5">
                            {/* =========== DETAIL OF SALE (CUSTOMER, CURRENCY, SHOP ,...) */}
                            <SaleDetail 
                                currencies={currencies}
                                customers={customers}
                                locations={locations}
                                data={data}
                                setData={setData}
                                errors={errors}
                            />
                          
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
                                            پرداخت‌شده
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
                        </aside>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
