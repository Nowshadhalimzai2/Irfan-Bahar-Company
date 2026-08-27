import { SectionTitle } from '@/components/section-title';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { InventoryBalance, Location } from '@/types';
import { Item } from '@/types/item';
import LocationTranslator, { getDariItemUnit } from '@/components/location-translator';
import axios from 'axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteIcon } from 'lucide-react';

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
    const [itemsInLoc, setItemInLoc] = useState<Item[]>(items);
    const [transferLine, setTransferLine] = useState<TransferLine[]>([]);
    const [currentLine, setCurrentLine] = useState<TransferLine>(() => ({
        item_id: items[0]?.id ?? 0,
        quantity: 1,
    }));

    const { data, setData, errors, post, processing } = useForm<TransferType>({
        'source_id': locations[0]?.id ?? 1,
        'destination_id': locations[1]?.id ?? 1,
        'notes': '',
        'transferLines': [],
    });

    useEffect(() => {
        setData('transferLines', transferLine);
    }, [transferLine, setData]);

    //  Fetch availible qty foreach item of each location to display on the screen for user
    //  to know about available stock
    const [balance, setBalance] = useState<InventoryBalance>();
    useEffect(() => {
        if (currentLine.item_id === 0) {
            return;
        }

        const getItemBalance = async () => {
            const response = await axios.get(`/transfers/${data.source_id}/items/${currentLine.item_id}`);
            if (response.status === 200) {
                setBalance(response.data);
                // console.log(response.data);
            }
            else {
                console.log('failed fetching Item data : ', response.statusText);
            }
        }
        getItemBalance();

    }, [currentLine.item_id, data.source_id])
    useEffect(() => {
        const getAvailableItems = async () => {
            const response = await axios.get(`/transfers/${data.source_id}/create`);
            if (response.status === 200) {
                const availableItems = response.data as Item[];
                setItemInLoc(availableItems);
                setCurrentLine({
                    item_id: availableItems[0]?.id ?? 0,
                    quantity: 1,
                });
            }
            else {
                console.log('failed fetching Item data : ', response.statusText);
            }
        }
        getAvailableItems();

    }, [data.source_id])

    const handleTransfer = (e: FormEvent<HTMLFormElement>) => {
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

    const removeItem = (index: number) => {
        setTransferLine((prev) => prev.filter((_, i) => i !== index));
    };

    const itemUnit = useMemo(() => {
        return itemsInLoc.find(item => item.id === currentLine.item_id)?.unit ?? 'unit';

    }, [currentLine.item_id, itemsInLoc]);
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'اجناس انتقال شده', href: '/receipts' },
                { title: 'انتقال جنس', href: '/transfers/create' },
            ]}
        >
            <div className="">
                <section>
                    <div className="max-w-3xl mx-auto p-5">
                        <SectionTitle
                            title="فورم اجناس انتقال "
                            description="لطفا دقت نماید. این فورم برای اجناس که نو امده برای شرکت، است"
                        />
                        <div className="section">
                            <form onSubmit={handleTransfer} className='' name="receipt" id="receipt">
                                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 ">
                                    <div className="grid gap-2">
                                        <Label htmlFor="source_id">مرجع</Label>
                                        <select
                                            className="border p-1.5 rounded-md"
                                            name="source_id"
                                            tabIndex={1}
                                            value={data.source_id}
                                            onChange={(e) => {
                                                setBalance(undefined);
                                                setData('source_id', Number(e.target.value));
                                            }}
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

                                {balance?.id !== undefined && <section className="ITEMSection mt-8">
                                    <div>
                                        {/* ============ STOCK MONITOR ========== */}
                                        {balance && <div>
                                            <BalanceMonitor balance={balance} location={locations[data.source_id - 1]} />
                                        </div>}

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
                                                    {itemsInLoc.map((item) => (
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
                                </section>}



                                {/* ================================  RESULTS  =============================================== */}
                                {transferLine.length > 0 && <>

                                    <h3 className='text-xl font-medium text-center p-3 text-accent mt-3'>لیست اجناس انتقال دهی</h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className='text-center'>شماره</TableHead>
                                                <TableHead className='text-center'>جنس</TableHead>
                                                <TableHead className='text-center'>مقدار</TableHead>
                                                <TableHead className='text-center'>حذف</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transferLine.length > 0 && (
                                                transferLine.map((transfer, ind) =>
                                                    <TableRow key={ind}>
                                                        <TableCell className='text-center'>{ind}</TableCell>
                                                        <TableCell className='text-center'>{items.filter(item => item.id === transfer.item_id)[0].name}</TableCell>
                                                        <TableCell className='text-center'>{transfer.quantity}</TableCell>
                                                        <TableCell className='flex justify-center items-center'>
                                                            <DeleteIcon onClick={() => removeItem(ind)} className='text-destructive' />
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            )}
                                        </TableBody>
                                    </Table>

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

                                </>}                            </form>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
};

const BalanceMonitor = ({ balance, location }: { balance: InventoryBalance, location: Location }) => {
    console.log(balance);

    return (
        <div className='mb-5 grid grid-cols-2'>
            <div className='bg-secondary border  rounded-sm p-3 shadow-md backdrop-blur-sm'>
                <h5 className='text-center font-medium'>{balance.item?.name ?? 'نامشخص'}</h5>
                <div className='grid place-items-center text-primary grid-cols-2 gap-3 p-3'>
                    <li className='list-none font-semibold text-2xl '> {balance.quantity_on_hand} {getDariItemUnit(balance.item?.unit ?? '')}</li>
                    <li className='list-none font-medium text-muted-foreground text-sm'><span className=''>حفظ شده</span>{balance.reserved}</li>
                </div>
                <small className='text-center w-full text-muted-foreground text-sm'>موجوده مقدار در {LocationTranslator(location.name) ?? 'جنس موجود نیست'}</small>
            </div>
        </div>
    )
}

export default Create;