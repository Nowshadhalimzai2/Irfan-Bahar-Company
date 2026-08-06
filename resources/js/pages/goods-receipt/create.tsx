import { SectionTitle } from '@/components/section-title';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { Currency, Location, Supplier } from '@/types';
import { GoodsReceiptLine, Item } from '@/types/item';

interface Props {
    suppliers: Supplier[];
    locations: Location[];
    currencies: Currency[];
    items: Item[];
}

type ReceiptLine = {
    item_id: number;
    quantity: number;
    unit_cost: number;
    currency_id: number;
}

type GoodReceiptType = {
    supplier_id: number;
    reference_no: string;
    destination_location_id: number;
    receiptLines: ReceiptLine[];
}

const Create = ({ suppliers, locations, currencies, items }: Props) => {
    const [receiptLines, setReceiptLines] = useState<ReceiptLine[]>([]);
    const [currentLine, setCurrentLine] = useState<ReceiptLine>(() => ({
        item_id: items[0]?.id ?? 0,
        quantity: 1,
        unit_cost: 0,
        currency_id: currencies[0]?.id ?? 0,
    }));

    const { data, setData, errors, reset, post, processing } = useForm<GoodReceiptType>({
        supplier_id: suppliers[0]?.id ?? 0,
        reference_no: '',
        destination_location_id: locations[0]?.id ?? 0,
        receiptLines,
    });

    useEffect(() => {
        setData('receiptLines', receiptLines);
    }, [receiptLines, setData]);

    const handleReceipt = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        post('/receipts', {
            onFinish: () => {
                reset('reference_no');
                setReceiptLines([]);
                setCurrentLine({
                    item_id: items[0]?.id ?? 0,
                    quantity: 1,
                    unit_cost: 0,
                    currency_id: currencies[0]?.id ?? 0,
                });
            },
        });
    };

    const handleAddLine = () => {
        console.log('added,',data);
        
        if (!currentLine.item_id || !currentLine.currency_id || currentLine.quantity <= 0) {
            return;
        }

        setReceiptLines((prev) => [...prev, currentLine]);
        setCurrentLine((prev) => ({
            ...prev,
            quantity: 1,
            unit_cost: 0,
        }));
    };

    const handleRemoveLine = (index: number) => {
        setReceiptLines((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'اموال امده', href: '/receipts' },
                { title: 'جنس نو را ثبت کنید', href: '/receipts/create' },
            ]}
        >
            <div className="section">
                <section>
                    <div className="max-w-3xl mx-auto p-5">
                        <SectionTitle
                            title="فورم اجناس نو "
                            description="لطفا دقت نماید. این فورم برای اجناس که نو امده برای شرکت، است"
                        />
                        <div className="section">
                            <form onSubmit={handleReceipt} name="receipt" id="receipt">
                                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                    <div className="grid gap-2">
                                        <Label htmlFor="supplier_id">نام تأمین کننده</Label>
                                        <select
                                            className="border p-1.5 rounded-md"
                                            name="supplier_id"
                                            tabIndex={1}
                                            value={data.supplier_id}
                                            onChange={(e) => setData('supplier_id', Number(e.target.value))}
                                        >
                                            <option value={0}>تأمین کننده را انتخاب کنید</option>
                                            {suppliers.map((supplier) => (
                                                <option value={supplier.id} key={supplier.id}>
                                                    {supplier.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.supplier_id} className="mt-2" />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="destination_location_id">موقعیت</Label>
                                        <select
                                            className="border p-1.5 rounded-md"
                                            tabIndex={2}
                                            name="destination_location_id"
                                            value={data.destination_location_id}
                                            onChange={(e) =>
                                                setData('destination_location_id', Number(e.target.value))
                                            }
                                        >
                                            <option value={0}>موقعیت را انتخاب کنید</option>
                                            {locations.map((location) => (
                                                <option value={location.id} key={location.id}>
                                                    {location.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.destination_location_id} className="mt-2" />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="reference_no">نمبر حواله</Label>
                                        <Input
                                            id="reference_no"
                                            type="text"
                                            required
                                            autoFocus
                                            tabIndex={3}
                                            autoComplete="reference_no"
                                            name="reference_no"
                                            value={data.reference_no}
                                            onChange={(e) => setData('reference_no', e.target.value)}
                                            placeholder="نمبر حواله "
                                        />
                                        <InputError message={errors.reference_no} className="mt-2" />
                                    </div>
                                </div>

                                <section className="section ITEMSection mt-8">
                                    <div>
                                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                            <div className="grid gap-2">
                                                <Label htmlFor="currency_id">پولی واحد</Label>
                                                <select
                                                    className="border p-1.5 rounded-md"
                                                    name="currency_id"
                                                    tabIndex={4}
                                                    value={currentLine.currency_id}
                                                    onChange={(e) =>
                                                        setCurrentLine((prev) => ({
                                                            ...prev,
                                                            currency_id: Number(e.target.value),
                                                        }))
                                                    }
                                                >
                                                    <option value={0}>پولی واحد را انتخاب نماید</option>
                                                    {currencies.map((currency) => (
                                                        <option value={currency.id} key={currency.id}>
                                                            {currency.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="item_id">جنس</Label>
                                                <select
                                                    className="border p-1.5 rounded-md"
                                                    name="item_id"
                                                    tabIndex={5}
                                                    value={currentLine.item_id}
                                                    onChange={(e) =>
                                                        setCurrentLine((prev) => ({
                                                            ...prev,
                                                            item_id: Number(e.target.value),
                                                        }))
                                                    }
                                                >
                                                    <option value={0}>جنس را انتخاب نماید</option>
                                                    {items.map((item) => (
                                                        <option value={item.id} key={item.id}>
                                                            {item.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="quantity">مقدار</Label>
                                                <Input
                                                    id="quantity"
                                                    type="number"
                                                    min={1}
                                                    value={currentLine.quantity}
                                                    onChange={(e) =>
                                                        setCurrentLine((prev) => ({
                                                            ...prev,
                                                            quantity: Number(e.target.value),
                                                        }))
                                                    }
                                                    placeholder="مقدار"
                                                    className="border p-1.5 rounded-md"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="unit_cost">قیمت واحد</Label>
                                                <Input
                                                    id="unit_cost"
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    value={currentLine.unit_cost}
                                                    onChange={(e) =>
                                                        setCurrentLine((prev) => ({
                                                            ...prev,
                                                            unit_cost: Number(e.target.value),
                                                        }))
                                                    }
                                                    placeholder="قیمت واحد"
                                                    className="border p-1.5 rounded-md"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <Button
                                                type="button"
                                                className="w-full"
                                                variant={'secondary'}
                                                tabIndex={6}
                                                onClick={handleAddLine}
                                            >
                                                اضافه کردن جنس
                                            </Button>
                                        </div>
                                    </div>
                                </section>

                                {receiptLines.length > 0 && (
                                    <div className="mt-6 overflow-hidden rounded-lg border">
                                        <div className="bg-slate-50 px-4 py-3 text-sm font-medium">
                                            خطوط حواله
                                        </div>
                                        <div className="divide-y">
                                            {receiptLines.map((line, index) => (
                                                <div
                                                    key={`${line.item_id}-${index}`}
                                                    className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <div className="space-y-1 text-sm">
                                                        <div>جنس: {items.find((item) => item.id === line.item_id)?.name || line.item_id}</div>
                                                        <div>پولی واحد: {currencies.find((cur) => cur.id === line.currency_id)?.name || line.currency_id}</div>
                                                        <div>مقدار: {line.quantity}</div>
                                                        <div>قیمت واحد: {line.unit_cost}</div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        onClick={() => handleRemoveLine(index)}
                                                    >
                                                        حذف
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6">
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        tabIndex={7}
                                        data-test="register-employee-button"
                                    >
                                        {processing && <Spinner />}
                                        ثبت کنید
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
};

export default Create;