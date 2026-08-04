import AppLayout from '@/layouts/app-layout';
import { Supplier } from '@/types';
import { useForm } from '@inertiajs/react';
import React, { FormEvent } from 'react'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { SectionTitle } from '@/components/section-title';
interface Props {
    supplier: Supplier;
}
type SupplierType = {
    name: string;
    phone: string;
    email: string;
    address: string;
}
const Edit = ({ supplier }: Props) => {
    const { data, setData, errors, reset, put, processing } = useForm<SupplierType>({
        'name': supplier.name,
        'email': supplier.email ?? '',
        'phone': supplier.phone ?? '',
        'address': supplier.address,
    });

    const handleSupplier = (e: FormEvent<HTMLFormElement>) => {

        e.preventDefault();
        put('/suppliers/'+supplier.id);
    }
    return (

        <AppLayout breadcrumbs={
            [
                { title: 'تامین کنندگان', href: '/stackholders' },
                { title: `${supplier.name}`, href: '/stackholders' },
                { title: `ویرایش تأمین کننده`, href: '/suppliers/' + supplier.id + '/edit' },

            ]
        } >

            <section className="section">
                <div>
                    <SectionTitle title="ویرایش تامین کننده"  />

                    <div className="max-w-xl mx-auto w-full px-4">
                        <form onSubmit={handleSupplier}>
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">نام تأمین کننده</Label>
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
                                        placeholder="نام تأمین کنند را اینجا ورود کنین"
                                    />
                                    <InputError
                                        message={errors.name}
                                        className="mt-2"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="phone">شماره تماس</Label>
                                    <Input
                                        id="phone"
                                        type="text"
                                        autoFocus
                                        tabIndex={3}
                                        autoComplete="phone"
                                        name="phone"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="شماره تماس را اینجا ورود نماید"
                                    />
                                    <InputError
                                        message={errors.phone}
                                        className="mt-2"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">ایمیل</Label>
                                    <Input
                                        id="email"
                                        type="text"
                                        autoFocus
                                        tabIndex={3}
                                        autoComplete="email"
                                        name="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="ایمیل را اینجا ورود نماید"
                                    />
                                    <InputError
                                        message={errors.email}
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
                                        tabIndex={4}
                                        autoComplete="address"
                                        name="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        placeholder="آدرس فعلی را ورود کنین"
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

export default Edit