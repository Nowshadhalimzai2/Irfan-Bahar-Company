import { SectionTitle } from '@/components/section-title';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Location } from '@/types';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { CustomeDropDownMenu } from '@/components/customer-dropdwon';

type LocationType = {
    name: string;
    type: 'warehouse' | 'shop' | 'factory' | 'office' | 'other';
    is_active: boolean;
    address: string;
}

interface Props {
    locations: Location[];
}
const Index = ({ locations }: Props) => {
    const { data, setData, errors, reset, post, processing } = useForm<LocationType>({
        'name': '',
        'address': '',
        'type': 'shop',
        'is_active': true,
    });
    const handleLocation = (e: FormEvent<HTMLFormElement>) => {

        e.preventDefault();
        post('/locations');
    }
    const locationTypes = [
        { label: 'دوکان', value: 'shop' },
        { label: 'کارخانه', value: 'factory' },
        { label: 'ګودام', value: 'warehouse' },
        { label: 'دفتر', value: 'office' },
        { label: 'دیګر', value: 'other' },

    ]

    return (
        <AppLayout breadcrumbs={[
            { title: 'دشبورد', href: "/dashboard" },
            { title: 'موقعیت ها', href: '/locations' }]}>

            <section className="section">
                <div className="max-w-3xl mx-auto p-5">
                    <SectionTitle title='تمام موقعیت ها اجناس ' />
                    <div>
                        <Table>

                            <TableHeader>
                                <TableRow>
                                    <TableHead>شماره</TableHead>
                                    <TableHead>نام</TableHead>
                                    <TableHead>نوع</TableHead>
                                    <TableHead>آدرس</TableHead>
                                    <TableHead>حالت</TableHead>
                                    <TableHead>اجراآت</TableHead>

                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {locations.length > 0 ? locations.map((location, ind) =>
                                    <TableRow>
                                        <TableCell>{ind + 1}</TableCell>
                                        <TableCell>{location.name}</TableCell>
                                        <TableCell>{location.type}</TableCell>
                                        <TableCell>{location.address}</TableCell>
                                        <TableCell className={`${location.is_active ? 'text-green-500 bg-green-50 ' : 'text-red-500 bg-red-50'} rounded-md text-center`}>{location.is_active ? "فعال" : "غیر فعال"}</TableCell>
                                        <TableCell>
                                            <CustomeDropDownMenu method="put" items={[
                                                {name: location.is_active ?'غیر فعال نمودن': 'فعال نمودن', url:`/locations/${location.id}/toggle-is-active/${location.is_active}`}
                                            ]} />
                                        </TableCell>
                                    </TableRow>

                                ) : <p className="text-muted-foreground mt-5 p-5 text-center">جای ها که قابل انتقال باشد در سیستم پیدا نشد</p>}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </section>

            <section className="section">
                <div>
                    <SectionTitle title='موقعیت جدید را ثبت کنید' />

                    <div className="max-w-xl mx-auto w-full px-4">
                        <form onSubmit={handleLocation}>
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">نام </Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="name"
                                        name="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="نام را اینجا ورود کنین"
                                    />
                                    <InputError
                                        message={errors.name}
                                        className="mt-2"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="type">نوع</Label>
                                    <select tabIndex={2} name="type" className="border p-2 text-muted-foreground rounded-md">
                                        <option value="">نوع موقعیت را انتخاب کنین</option>
                                        {locationTypes.map((type, ind) => <option value={type.value} key={ind}>{type.label}</option>)}
                                    </select>
                                    <InputError
                                        message={errors.type}
                                        className="mt-2"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="address">آدرس</Label>
                                    <Input
                                        id="address"
                                        type="text"
                                        required
                                        autoFocus
                                        tabIndex={3}
                                        autoComplete="address"
                                        name="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        placeholder="آدرس  فعلی را ورود کنین"
                                    />
                                    <InputError
                                        message={errors.address}
                                        className="mt-2"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="mt-2 w-full"
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

        </AppLayout>
    )
}

export default Index