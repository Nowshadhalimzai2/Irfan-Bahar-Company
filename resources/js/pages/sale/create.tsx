import { Head, useForm } from '@inertiajs/react';
import {
    Barcode,
    Check,
    CircleAlert,
    Package,
    ScanLine,
    Search,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { getDariCurrency } from '@/components/location-translator';
import SaleDetail from '@/components/sale/sale-detail';
import SaleItemList from '@/components/sale/sale-item-list';
import SalePayment from '@/components/sale/sale-payment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

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
    product?: { weight?: number };
    inventory_balances?: Balance[];
    base_unit?: ItemUnit | null;
    units?: ItemUnit[];
};
type ItemUnit = {
    id: number;
    item_id: number;
    name: string;
    symbol?: string | null;
    conversion_to_base: number;
    code: string;
    barcode?: string | null;
    selling_price: number;
    is_active: boolean;
};
type Currency = { id: number; name: string };
type Location = { id: number; name: string; address: string };
type SaleLine = {
    item_id: number;
    item_unit_id: number;
    quantity: number;
    unit_price: number;
};
type Customer = { id: number; name: string; phone?: string };

type Props = {
    items: Item[];
    currencies: Currency[];
    locations: Location[];
    customers: Customer[];
    nextInvoiceID: number;
};

export default function Create({
    items,
    currencies,
    locations,
    customers,
    nextInvoiceID,
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
        create_invoice: false,
        notes: '',
        saleLines: [] as SaleLine[],
    });
    const currency =
        currencies.find((entry) => entry.id === data.currency_id) ??
        defaultCurrency;

    const getUnits = (item?: Item): ItemUnit[] =>
        item?.units?.filter((unit) => unit.is_active) ??
        (item?.base_unit ? [item.base_unit] : []);

    useEffect(() => setData('saleLines', lines), [lines, setData]);

    const getStock = (itemId: number) => {
        const item = items.find((entry) => entry.id === itemId);
        const balance = item?.inventory_balances?.find(
            (entry) => entry.location_id === data.location_id,
        );

        return Math.max(
            0,
            Number(balance?.quantity_on_hand ?? 0) -
                Number(balance?.reserved ?? 0),
        );
    };
    const getCartBaseQuantity = (itemId: number, excludedUnitId?: number) =>
        lines
            .filter(
                (line) =>
                    line.item_id === itemId &&
                    line.item_unit_id !== excludedUnitId,
            )
            .reduce((total, line) => {
                const item = items.find(
                    (candidate) => candidate.id === line.item_id,
                );
                const unit = getUnits(item).find(
                    (candidate) => candidate.id === line.item_unit_id,
                );

                return (
                    total +
                    line.quantity *
                        Number(unit?.conversion_to_base ?? 1)
                );
            }, 0);

    const filteredItems = items
        .filter((item) =>
            `${item.name} ${item.code} ${item.sku} ${getUnits(item)
                .map((unit) => `${unit.code} ${unit.barcode ?? ''}`)
                .join(' ')}`
                .toLowerCase()
                .includes(search.toLowerCase()),
        )
        .slice(0, 8);
    const subtotal = lines.reduce(
        (sum, line) =>
            sum + Math.round(line.quantity * line.unit_price * 100) / 100,
        0,
    );
    const grandTotal = Math.max(0, subtotal - Number(data.discount_total || 0));

    useEffect(() => {
        setData('amount_paid', grandTotal);
    }, [grandTotal, setData]);

    const addItem = (item: Item, selectedUnit = getUnits(item)[0]) => {
        if (!selectedUnit) {
            return;
        }

        const existing = lines.find(
            (line) => line.item_unit_id === selectedUnit.id,
        );

        if (!existing && lines.length >= 12) {
            setMessage({
                type: 'error',
                text: 'حداکثر ۱۲ قلم را می‌توانید به سبد اضافه کنید.',
            });

            return;
        }

        const requiredBaseQuantity =
            getCartBaseQuantity(item.id) +
            Number(selectedUnit.conversion_to_base);

        if (requiredBaseQuantity > getStock(item.id) + 0.000001) {
            setMessage({
                type: 'error',
                text: `موجودی ${item.name} کافی نیست.`,
            });

            return;
        }

        setLines((current) =>
            current.some((line) => line.item_unit_id === selectedUnit.id)
                ? current.map((line) =>
                      line.item_unit_id === selectedUnit.id
                          ? { ...line, quantity: line.quantity + 1 }
                          : line,
                  )
                : [
                      ...current,
                      {
                          item_id: item.id,
                          item_unit_id: selectedUnit.id,
                          quantity: 1,
                          unit_price: Number(selectedUnit.selling_price),
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
            [
                entry.code,
                entry.sku,
                ...getUnits(entry).flatMap((unit) => [
                    unit.code,
                    unit.barcode ?? '',
                ]),
            ].some((value) => value?.toLowerCase() === code),
        );
        const selectedUnit = item
            ? getUnits(item).find((unit) =>
                  [unit.code, unit.barcode ?? ''].some(
                      (value) => value?.toLowerCase() === code,
                  ),
              )
            : undefined;

        if (item) {
            addItem(item, selectedUnit ?? getUnits(item)[0]);
        } else {
            setMessage({
                type: 'error',
                text: 'جنس با این بارکد در سیستم پیدا نشد.',
            });
        }
    };
    const updateLine = (itemUnitId: number, nextQuantity: number): boolean => {
        const line = lines.find(
            (candidate) => candidate.item_unit_id === itemUnitId,
        );

        if (!line || !Number.isFinite(nextQuantity)) {
            return false;
        }

        if (nextQuantity <= 0) {
            setLines((current) =>
                current.filter(
                    (candidate) => candidate.item_unit_id !== itemUnitId,
                ),
            );

            return true;
        }

        const item = items.find(
            (candidate) => candidate.id === line.item_id,
        );

        if (!item) {
            return false;
        }

        const unit = getUnits(item).find(
            (candidate) => candidate.id === itemUnitId,
        );
        const requiredBaseQuantity =
            getCartBaseQuantity(line.item_id, itemUnitId) +
            nextQuantity * Number(unit?.conversion_to_base ?? 1);

        if (requiredBaseQuantity > getStock(item.id) + 0.000001) {
            setMessage({
                type: 'error',
                text: `موجودی ${item?.name ?? ''} کافی نیست.`,
            });

            return false;
        }

        setLines((current) =>
            current.map((candidate) =>
                candidate.item_unit_id === itemUnitId
                    ? { ...candidate, quantity: nextQuantity }
                    : candidate,
            ),
        );

        return true;
    };
    const removeLine = (itemUnitId: number) => {
        setLines((current) =>
            current.filter((line) => line.item_unit_id !== itemUnitId),
        );
    };

    const changeUnit = (itemUnitId: number, nextUnitId: number) => {
        const line = lines.find(
            (candidate) => candidate.item_unit_id === itemUnitId,
        );
        const item = items.find(
            (candidate) => candidate.id === line?.item_id,
        );
        const currentUnit = getUnits(item).find(
            (candidate) => candidate.id === itemUnitId,
        );
        const nextUnit = getUnits(item).find(
            (candidate) => candidate.id === nextUnitId,
        );

        if (!line || !item || !currentUnit || !nextUnit) {
            return;
        }

        const baseQuantity =
            line.quantity * Number(currentUnit.conversion_to_base);
        const nextQuantity =
            Math.round(
                (baseQuantity / Number(nextUnit.conversion_to_base)) * 1000,
            ) / 1000;
        const requiredBaseQuantity =
            getCartBaseQuantity(line.item_id, itemUnitId) +
            nextQuantity * Number(nextUnit.conversion_to_base);

        if (requiredBaseQuantity > getStock(item.id) + 0.000001) {
            setMessage({
                type: 'error',
                text: `موجودی ${item?.name ?? ''} کافی نیست.`,
            });

            return;
        }

        setLines((current) => {
            const withoutCurrentLine = current.filter(
                (candidate) => candidate.item_unit_id !== itemUnitId,
            );
            const existing = withoutCurrentLine.find(
                (candidate) => candidate.item_unit_id === nextUnitId,
            );

            return existing
                ? withoutCurrentLine.map((candidate) =>
                      candidate.item_unit_id === nextUnitId
                          ? {
                                ...candidate,
                                quantity:
                                    candidate.quantity + nextQuantity,
                            }
                          : candidate,
                  )
                : [
                      ...withoutCurrentLine,
                      {
                          ...line,
                          item_unit_id: nextUnitId,
                          quantity: nextQuantity,
                          unit_price: Number(nextUnit.selling_price),
                      },
                  ];
        });
    };
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
                className="bg-[#f6f9fc] px-1 pb-10 dark:bg-transparent"
            >
                <div className="mx-auto max-w-7xl space-y-5">
                    <section className="relative overflow-hidden rounded-[1.75rem] bg-[#092b4c] px-6 py-7 text-white shadow-[0_20px_50px_rgba(9,43,76,0.2)] sm:px-8">
                        <div className="absolute -top-16 -left-8 h-48 w-48 rounded-full border-24 border-cyan-300/10" />
                        <div className="absolute right-80 -bottom-16 h-48 w-48 rounded-full border-24 border-cyan-300/10" />
                        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-sm text-cyan-200">
                                    <ScanLine className="size-4" />
                                    فورم فروشات
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
                        name="sale"
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
                                <div
                                    className="flex gap-2"
                                    aria-disabled={lines.length >= 12}
                                >
                                    <div className="relative flex-1">
                                        <Barcode className="absolute top-1/2 right-3 size-5 -translate-y-1/2 text-primary" />
                                        {barcode && (
                                            <X
                                                className="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-primary hover:text-destructive"
                                                onClick={() => {
                                                    setBarcode('');
                                                    barcodeRef.current?.focus();
                                                }}
                                            />
                                        )}
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
                                            disabled={lines.length >= 12}
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
                                        disabled={lines.length >= 12}
                                    />
                                </div>
                                {search && (
                                    <SearchSuggesstion
                                        addItem={addItem}
                                        currency={currency}
                                        filteredItems={filteredItems}
                                        getStock={getStock}
                                        getUnits={getUnits}
                                    />
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
                                changeUnit={changeUnit}
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
                            <SalePayment
                                currency={currency}
                                data={data}
                                errors={errors}
                                grandTotal={grandTotal}
                                lines={lines}
                                processing={processing}
                                setData={setData}
                                subtotal={subtotal}
                                createInvoice={data.create_invoice}
                                onCreateInvoiceChange={(value) =>
                                    setData('create_invoice', value)
                                }
                                nextInvoiceID={nextInvoiceID}
                            />
                        </aside>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

interface SuggestProps {
    filteredItems: Item[];
    addItem: (item: Item) => void;
    getStock: (itemId: number) => number;
    getUnits: (item: Item) => ItemUnit[];
    currency: { id: number; name: string };
}
function SearchSuggesstion({
    filteredItems,
    addItem,
    getStock,
    getUnits,
    currency,
}: SuggestProps) {
    return (
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
                            {item.name}{' '}
                            <small className="text-xs text-gray-500">
                                        : (
                                        {(
                                            getStock(item.id) /
                                            Number(
                                                getUnits(item)[0]
                                                    ?.conversion_to_base ?? 1,
                                            )
                                        ).toFixed(3)}{' '}
                                        {getUnits(item)[0]?.name ?? item.unit})
                            </small>
                        </b>
                        <small className="text-xs text-slate-400">
                            {getUnits(item)[0]?.code ?? item.sku}{' '}
                        </small>
                    </span>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold">
                            {getUnits(item)[0]?.selling_price ??
                                item.default_sale_price}{' '}
                            {getDariCurrency(currency?.name ?? 'AFG')}
                        </span>
                    </div>
                </button>
            ))}
            {filteredItems.length === 0 && (
                <p className="p-4 text-center text-xs text-slate-500">
                    جنسی پیدا نشد.
                </p>
            )}
        </div>
    );
}
