import { Input } from '../ui/input';
import { File, UserRound } from 'lucide-react';
import InputError from '../input-error';
import { Label } from '../ui/label';
import { SetDataAction } from '@inertiajs/react';
import { FormDataErrors } from '@inertiajs/core';
import LocationTranslator, { getDariCurrency } from '../location-translator';
import { useEffect, useState } from 'react';
import axios from 'axios';
type Customer = { id: number; name: string; phone?: string };
type Currency = { id: number; name: string };
type Location = { id: number; name: string; address: string };
type DataType = {
    location_id: number;
    customer_id: number;
    customer_name: string;
    currency_id: number;
};
interface Props {
    customers: Customer[];
    currencies: Currency[];
    locations: Location[];
    data: DataType
    setData: SetDataAction<DataType>
    errors: FormDataErrors<DataType>
}
const SaleDetail = ({ currencies, customers, locations, data, setData, errors }: Props) => {
    const [customerOwe, setCustomerOwe] = useState<number>();

    useEffect(() => {
        async function getCustomerRecord(customerID: number) {
            const res = await axios.get(`/sales/${customerID}/${data.currency_id}`)
            if (res.status == 200)
                setCustomerOwe(res.data);
            else {
                console.log('error getting customer', res.data);
            }
        }
        if (data.customer_id !== 0) {
            getCustomerRecord(data.customer_id);
        }
    }, [data.customer_id, data.currency_id])
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-3">
                <File className="size-5 text-orange-800" />
                <div>
                    <h2 className="font-bold">
                        جزئیات فروش
                    </h2>
                    <p className="text-xs text-slate-500">
                        اطلاعات فاکتور را تکمیل کنید.
                    </p>
                </div>
            </div>
            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label>محل فروش</Label>
                    <select
                        value={data.location_id}
                        onChange={(event) =>
                            setData(
                                'location_id',
                                Number(event.target.value),
                            )
                        }
                        className="h-10 rounded-lg border px-3 text-sm"
                    >
                        {locations.map((entry) => (
                            <option
                                key={entry.id}
                                value={entry.id}
                            >
                                {LocationTranslator(entry.name)}
                            </option>
                        ))}
                    </select>
                    <InputError
                        message={errors.location_id}
                    />
                </div>
                <div className="grid gap-2">
                    <Label>
                        مشتری
                        {data.customer_id !== 0 && <span className='text-gray-400 text-xs mr-1 inline'>{customerOwe} {getDariCurrency(currencies.filter(cur => cur.id == data.currency_id)[0].name)}</span>}
                    </Label>
                    <select
                        value={data.customer_id}
                        onChange={(event) =>
                            setData(
                                'customer_id',
                                Number(event.target.value),
                            )
                        }
                        className="h-10 rounded-lg border px-3 text-sm"
                    >
                        <option value={0}>
                            مشتری گذری
                        </option>
                        {customers.map((customer) => (
                            <option
                                key={customer.id}
                                value={customer.id}
                            >
                                {customer.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="customer_name">
                        نام مشتری گذری
                    </Label>
                    <div className="relative">
                        <UserRound className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            id="customer_name"
                            value={data.customer_name}
                            onChange={(event) =>
                                setData(
                                    'customer_name',
                                    event.target.value,
                                )
                            }
                            className="pr-9"
                            placeholder="در صورت نیاز وارد کنید"
                        />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label>واحد پول</Label>
                    <select
                        value={data.currency_id}
                        onChange={(event) =>
                            setData(
                                'currency_id',
                                Number(event.target.value),
                            )
                        }
                        className="h-10 rounded-lg border px-3 text-sm"
                    >
                        {currencies.map((entry) => (
                            <option
                                key={entry.id}
                                value={entry.id}
                            >
                                {getDariCurrency(entry.name)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </section>
    )
}

export default SaleDetail