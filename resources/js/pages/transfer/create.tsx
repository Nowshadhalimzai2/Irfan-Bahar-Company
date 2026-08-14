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
import LocationTranslator, { getDariItemUnit } from '@/components/location-translator';

interface Props {
    locations: Location[];
    items: Item[];
}

type TransferLine = {
    item_id: number;
    quantity: number;
}

type TransferType = {
    source_id: number;
    destination_id: number;
    notes: string;
    transferLines: TransferLine[];
}

const Create = ({ locations, items }: Props) => {
    const [transferLine, setTransferLine] = useState<TransferLine[]>([]);
    const [currentLine, setCurrentLine] = useState<TransferLine>(() => ({
        item_id: items[0]?.id ?? 0,
        quantity: 1,
    }));

    const { data, setData, errors, reset, post, processing } = useForm<TransferType>({
        'source_id': locations[0]?.id ?? 1,
        'destination_id': locations[1]?.id ?? 1,
        'notes': '',
        'transferLines': [],
    });

    useEffect(() => {
        setData('transferLines', transferLine);
    }, [transferLine, setData]);

    const handleReceipt = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        post('/transfers', {
            onFinish: () => {
                setTransferLine([]);
                setCurrentLine({
                    item_id: items[0]?.id ?? 1,
                    quantity: 1,
                });
            },
        });
    };

    const handleAddLine = () => {

        if (!currentLine.item_id || currentLine.quantity <= 0) {
            return;
        }

        setTransferLine((prev) => [...prev, currentLine]);
        setCurrentLine((prev) => ({
            ...prev,
            quantity: 1,
        }));
    };

    const handleRemoveLine = (index: number) => {
        setTransferLine((prev) => prev.filter((_, i) => i !== index));
    };

    const itemUnit = useMemo(() => {
        if (items.length === 0)
            return 'unit';
        return items.filter(item => item.id === currentLine.item_id)[0].unit;

    }, [currentLine]);
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'اجناس انتقال شده', href: '/receipts' },
                { title: 'انتقال جنس', href: '/transfers/create' },
            ]}
        >
            <div className="section">
                <section>
                    <div className="max-w-3xl mx-auto p-5">
                        <SectionTitle
                            title="فورم اجناس انتقال "
                            description="لطفا دقت نماید. این فورم برای اجناس که نو امده برای شرکت، است"
                        />
                        <div className="section">
                            <form onSubmit={handleReceipt} name="receipt" id="receipt">
                                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 ">
                                    <div className="grid gap-2">
                                        <Label htmlFor="source_id">مرجع</Label>
                                        <select
                                            className="border p-1.5 rounded-md"
                                            name="source_id"
                                            tabIndex={1}
                                            value={data.source_id}
                                            onChange={(e) => setData('source_id', Number(e.target.value))}
                                        >
                                            <option value={0}>از جای که میایه را انتخاب کنید</option>
                                            {locations.map((location) => (
                                                <option className={`${location.id === data.destination_id && 'bg-secondary'}`} value={location.id} key={location.id} disabled={location.id === data.destination_id}>
                                                    {LocationTranslator(location.name)}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.source_id} className="mt-2" />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="destination_id">مقصود</Label>
                                        <select
                                            className="border p-1.5 rounded-md"
                                            tabIndex={2}
                                            name="destination_id"
                                            value={data.destination_id}
                                            onChange={(e) =>
                                                setData('destination_id', Number(e.target.value))
                                            }
                                        >
                                            <option value={0}>جای کی پایین می شود را انتخاب کنید</option>
                                            {locations.map((location) => (
                                                <option className={`${location.id === data.source_id && 'bg-secondary'}`} value={location.id} key={location.id} disabled={location.id === data.source_id}>
                                                    {LocationTranslator(location.name)}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.destination_id} className="mt-2" />
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
                                                <InputError message={errors.transferLines} className="mt-2" />

                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="quantity" className="flex justify-between">
                                                    <span>  مقدار  </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {currentLine.quantity} {getDariItemUnit(itemUnit)}
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="quantity"
                                                    type="number"
                                                    min={1}
                                                    // max={items[currentLine.item_id]}
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
                                                <InputError message={errors.transferLines} className="mt-2" />

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
                                {transferLine.length > 0 && (
                                    <div className="mt-6 overflow-hidden rounded-lg border">
                                        <div className="bg-slate-50 px-4 py-3 text-sm font-medium">
                                            خطوط حواله
                                        </div>
                                        <div className="divide-y">
                                            {transferLine.map((line, index) => (
                                                <div
                                                    key={`${line.item_id}-${index}`}
                                                    className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <div>
                                                        <div className="space-y-1 gap-3 text-sm grid grid-cols-3">
                                                            <div className=" p-5 border rounded-sm bg-white">جنس: {items.find((item) => item.id === line.item_id)?.name || line.item_id}</div>

                                                            <div className=" p-5 border rounded-sm bg-white">مقدار: {line.quantity}</div>

                                                            {/* <div className=" p-5 border rounded-sm bg-white">قیمت واحد: {line.unit_cost}</div> */}

                                                        </div>
                                                        {/* <div className="p-5 text-end font-medium">توتل : {line.unit_cost * line.quantity}</div> */}
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
                                                    {/* {transferLine.reduce((acc, line) => acc += (line.quantity * line.unit_cost), 0)}  :جمله */}
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