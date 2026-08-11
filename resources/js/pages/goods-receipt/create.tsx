import { SectionTitle } from '@/components/section-title';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { Currency, Location, Supplier } from '@/types';
import { GoodsReceiptLine, Item } from '@/types/item';
import { LineChart } from 'lucide-react';
import { getDariItemUnit } from '@/components/location-translator';

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
    destination_location_id: number;
    notes: string;
    receiptLines: ReceiptLine[];
}

const Create = ({ suppliers, locations, currencies, items }: Props) => {
    const [receiptLines, setReceiptLines] = useState<ReceiptLine[]>([]);
    const [currentLine, setCurrentLine] = useState<ReceiptLine>(() => ({
        item_id: items[0]?.id ?? 0,
        quantity: 1,
        unit_cost: 10,
        currency_id: currencies[0]?.id ?? 0,
    }));

    const { data, setData, errors, reset, post, processing } = useForm<GoodReceiptType>({
        supplier_id: suppliers[0]?.id ?? 0,
        destination_location_id: locations[0]?.id ?? 0,
        notes: '',
        receiptLines,
    });

    useEffect(() => {
        setData('receiptLines', receiptLines);
    }, [receiptLines, setData]);

    const handleReceipt = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        post('/receipts', {
            onFinish: () => {
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

    const itemUnit = useMemo(() => {
        return items.filter(item => item.id === currentLine.item_id)[0].unit;

    }, [currentLine])
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
                                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 ">
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

                                </div>
                                <div className="grid gap-2 mt-5">
                                    <Label htmlFor="notes">نوت</Label>
                                    <textarea
                                        className="border p-1.5 rounded-md text-sm"
                                        tabIndex={2}
                                        name="notes"
                                        value={data.notes}
                                        onChange={(e) =>
                                            setData('notes', e.target.value)
                                        }
                                        placeholder="نوت اختیاری است"
                                    />

                                    <InputError message={errors.notes} className="mt-2" />
                                </div>

                                <section className="section ITEMSection mt-8">
                                    <div>
                                        <div className="grid gap-6   grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
                                                <InputError message={errors.receiptLines} className="mt-2" />

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
                                                    {items.map((item) => (
                                                        <option value={item.id} key={item.id}>
                                                            {item.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError message={errors.receiptLines} className="mt-2" />

                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="quantity" className="flex justify-between">
                                                    <span>  مقدار  </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {currentLine.quantity}   {getDariItemUnit(itemUnit)}
                                                    </span>
                                                </Label>
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
                                                <InputError message={errors.receiptLines} className="mt-2" />

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
                                                <InputError message={errors.receiptLines} className="mt-2" />

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



                                {/* ================================  RESULTS  =============================================== */}
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
                                                    <div>
                                                        <div className="space-y-1 gap-3 text-sm grid grid-cols-3">
                                                            <div className=" p-5 border rounded-sm bg-white">جنس: {items.find((item) => item.id === line.item_id)?.name || line.item_id}</div>
                                                            <div className=" p-5 border rounded-sm bg-white">پولی واحد: {currencies.find((cur) => cur.id === line.currency_id)?.name || line.currency_id}</div>
                                                            <div className=" p-5 border rounded-sm bg-white">مقدار: {line.quantity}</div>
                                                            <div className=" p-5 border rounded-sm bg-white">قیمت واحد: {line.unit_cost}</div>

                                                        </div>
                                                        <div className="p-5 text-end font-medium">توتل : {line.unit_cost * line.quantity}</div>
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
                                            <div className="p-3 text-end">
                                                <div>
                                                    {receiptLines.reduce((acc, line) => acc += (line.quantity * line.unit_cost), 0)}  :جمله
                                                </div>
                                            </div>
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