import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { SectionTitle } from '@/components/section-title';
import { FormEvent } from 'react';

type EmpType = {
    name: string;
    f_name: string;
    position: "clerk" | "shopkeeper" | "worker" | "machine_operator" | "other";
    salary: number;
    address: string;
    phone: string;
    shift: "day" | "night";
}
const Create = () => {
    const { data, setData, errors, reset, post, processing } = useForm<EmpType>({
        'name': '',
        'f_name': '',
        'position': 'worker',
        'salary': 6000,
        'phone': '',
        'address': '',
        'shift': 'day'
    });
    const positions = [
        { value: 'clerk', label: 'منشی' },
        { value: 'shopkeeper', label: 'دوکاندار' },
        { value: 'machine_operator', label: 'استاد ماشین' },
        { value: 'worker', label: 'کاریګر' },
        { value: 'other', label: 'دیګر' },
    ];
     const shifts = [
        { value: 'day', label: 'روزانه' },
        { value: 'night', label: 'شبانه' },
    ];

    const handleEmployee = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/employees');
    }
    return (
        <div className="max-w-xl mx-auto w-full section px-4">
            <SectionTitle title=" فورم ثبت نمودن کار کن" description=' لطف نماید تا فورم ذیل  را با دقت پر شود.' />

            <form onSubmit={handleEmployee}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">نام کارکننده</Label>
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
                            placeholder="نام کارکننده را اینجا ورود کنین"
                        />
                        <InputError
                            message={errors.name}
                            className="mt-2"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="f_name">نام پدر</Label>
                        <Input
                            id="f_name"
                            type="text"
                            required
                            autoFocus
                            tabIndex={2}
                            autoComplete="f_name"
                            name="f_name"
                            value={data.f_name}
                            onChange={(e) => setData('f_name', e.target.value)}

                            placeholder="نام پدر ورود کنین"
                        />
                        <InputError
                            message={errors.f_name}
                            className="mt-2"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">شماره تماس</Label>
                        <Input
                            id="phone"
                            type="text"
                            required
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


                    <div className="grid gap-2">
                        <Label htmlFor="postion">وظیفه</Label>
                        <select
                            id="position"
                            name="position"
                            required
                            tabIndex={5}
                            value={data.position}
                            onChange={(e) => setData('position', e.target.value as "worker" | 'clerk' | 'shopkeeper' | 'machine_operator' | 'other')}
                            className="border rounded px-3 py-2"
                        >
                            <option value="">انتخاب وظیفه</option>
                            {positions.map((position) => (
                                <option key={position.value} value={position.value}>
                                    {position.label}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.position} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="shift">شفت کاری</Label>
                        <select
                            id="shift"
                            name="shift"
                            required
                            tabIndex={5}
                            value={data.shift}
                            onChange={(e) => setData('shift', e.target.value as "day" | 'night' )}
                            className="border rounded px-3 py-2"
                        >
                            <option value="">شفت کار را انتخاب کنین</option>
                            {shifts.map((shift) => (
                                <option key={shift.value} value={shift.value}>
                                    {shift.label}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.shift} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="salary">معاش ماهانه</Label>
                        <Input
                            id="salary"
                            type="text"
                            required
                            autoFocus
                            tabIndex={6}
                            autoComplete="salary"
                            name="salary"
                            value={data.salary}
                            onChange={(e) => setData('salary', Number(e.target.value))}
                            placeholder="معاش ماهانه تعین شده برای کارکن  را اضافه نماید "
                        />
                        <InputError
                            message={errors.salary}
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
    )
}

export default Create