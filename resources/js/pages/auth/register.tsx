import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
    roles:{id:number;name:string;}[]
};

export default function Register({ passwordRules,roles }: Props) {
    
    
    return (
        <>
            <Head title="ثبت یوزر" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
                dir='rtl'
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6" >
                            <div className="grid gap-2">
                                <Label htmlFor="name">اسم یوزر</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="اسم و تخلص"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">ایمیل</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="role">نقش یوزر</Label>
                                <select
                                    id="role"
                                    name="role_id"
                                    required
                                    tabIndex={3}
                                    className="border rounded px-3 py-2"
                                >
                                    <option value="">انتخاب نقش</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.role_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">رمز عبور</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="رمز عبور در سیستم"
                                    passwordrules={passwordRules}
                                />
                                <InputError message={errors.password} />
                            </div>


                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    تاییدی رمز
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={5}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="رمز تان اینجا تایید کنید"
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={6}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                ایجاد اکونت
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground ">
                            <Button variant={'outline'} onClick={()=>window.navigation.back()} className='w-full'  tabIndex={6}>
                                انحراف
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'حساب را ایجاد کنید',
    description: 'معلومات ذیل را ارایه کنید تا حساب نو ایجاد شود',
};
