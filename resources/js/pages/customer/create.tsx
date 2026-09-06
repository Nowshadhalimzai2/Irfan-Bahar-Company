import { SectionTitle } from "@/components/section-title";
import AppLayout from "@/layouts/app-layout";
import { useForm } from "@inertiajs/react";
import { FormEvent } from "react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
type CustomerType = {
    name: string;
    nick_name?: string;
    phone: string;
    email?: string;
    address: string;
}
const Create = () => {
    const { data, setData, errors, post, processing } = useForm<CustomerType>({
        'name': '',
        'nick_name': '',
        'phone': '',
        'email': '',
        'address': '',
    });
    const handleCustomer = (e: FormEvent<HTMLFormElement>) => {

        e.preventDefault();
        post('/customers');
    }
    return (

        <AppLayout breadcrumbs={
            [
                { title: 'مشتریان', href: '/stackholders' },
                { title: 'ایجاد مشتری', href: '/customers/create' },
            ]
        } >
            <section className="section">
                <div>
                    <SectionTitle title="ایجاد مشتری" description="لطفا اشخاص را اینجا ثبت کنید از کسان که شما اجناس را وارد می کنین." />

                    <div className="max-w-xl mx-auto w-full px-4">
                        <form onSubmit={handleCustomer}>
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">اسم مشتری</Label>
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
                                        placeholder="اسم مشتری را اینجا ورود کنین"
                                    />
                                    <InputError
                                        message={errors.name}
                                        className="mt-2"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="nick_name">نام مستعار</Label>
                                    <Input
                                        id="nick_name"
                                        type="text"
                                        autoFocus
                                        tabIndex={2}
                                        autoComplete="nick_name"
                                        name="nick_name"
                                        value={data.nick_name}
                                        onChange={(e) => setData('nick_name', e.target.value)}
                                        placeholder="نام مستعار را اینجا ورود کنین"
                                    />
                                    <InputError
                                        message={errors.nick_name}
                                        className="mt-2"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">ایمیل</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        autoFocus
                                        tabIndex={3}
                                        autoComplete="email"
                                        name="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="ایمیل را اینجا ورود کنین"
                                    />
                                    <InputError
                                        message={errors.email}
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
                        </form>
                    </div>
                </div>

            </section >

        </AppLayout >
    )
}

export default Create