import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Spinner } from '../ui/spinner';
import InputError from '../input-error';
import { Input } from '../ui/input';
import { useForm } from '@inertiajs/react';
import React, { FormEvent } from 'react';
import { Employee } from '@/types';
import { Calendar } from '../ui/calendar';
import { format } from "date-fns"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Field } from '../ui/field';

type PaySalaryType = {
    employee_id: number;
    amount: number;
    payment_date: Date | undefined;
}
interface SalaryPaymentDialogProps {
    employee: Employee;
    defaultAmount: number;
    maxAmount: number;
    grossMonthSalary: number;
    adjustedSalary: number;
    absentDays: number;
    perDay: number;
    paidThisMonth: number;
    remainingSalary: number;
}
export const SalaryPaymentDialog = ({
    employee,
    defaultAmount,
    maxAmount,
    grossMonthSalary,
    adjustedSalary,
    absentDays,
    perDay,
    paidThisMonth,
    remainingSalary,
}: SalaryPaymentDialogProps) => {
    const [date, setDate] = React.useState<Date>(new Date());
    const { data, setData, errors, reset, post, processing } = useForm<PaySalaryType>({
        'amount': defaultAmount,
        'employee_id': employee.id,
        'payment_date': date,
    });

    const handleEmployee = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/employees/' + employee.id + "/pay-salary");
    }
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    className="w-full"
                    data-test="salary-payment"
                >
                    پرداخت معاش                </Button>
            </DialogTrigger>
            <DialogContent className="space-y-4 py-3">
                <DialogTitle>
                    پرداخت معاش
                </DialogTitle>
                <DialogDescription className="space-y-2 text-sm text-slate-600">
                    <p>برای {employee.name} مقدار معاش را وارد کنید. مقدار پیش‌فرض، معاش قابل پرداخت این ماه است.</p>
                    <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm">

                        <DialogItem label="معاش ناخالص" value={grossMonthSalary} />

                        <DialogItem label="معاش قابل پرداخت" value={adjustedSalary} />

                        <DialogItem label="پرداخت‌شده این ماه" value={paidThisMonth} />

                        <DialogItem label="باقی‌مانده قابل پرداخت" value={remainingSalary} />

                        {/* <div className="rounded-md bg-white p-3 shadow-sm">
                            <div className="text-xs text-slate-500">غیبت‌ها</div>
                            <div className="text-base font-semibold">{absentDays} روز</div>
                        </div> */}
                        <DialogItem label="غیبت‌ها" value={absentDays} />

                        <DialogItem label="ارزش هر روز" value={perDay} />

                    </div>
                </DialogDescription>

                <form onSubmit={handleEmployee}>
                    <div className="grid gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor="amount">مقدار معاش</Label>
                            <Input
                                id="amount"
                                type="number"
                                required
                                autoFocus
                                tabIndex={6}
                                autoComplete="amount"
                                name="amount"
                                value={data.amount}
                                onChange={(e) => setData('amount', Number(e.target.value))}
                                min={1}
                                max={maxAmount}
                            />
                            <InputError
                                message={errors.amount}
                                className="mt-2"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="payment_date">تاریخ پرداخت</Label>
                            <Field>
                                <Popover>
                                    <PopoverTrigger>
                                        <Button type="button" variant="outline" id="date-picker-simple" className="justify-start w-full font-normal">
                                            {date ? format(date, "PPP") : <span>تاریخ را انتخاب کنید</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            required
                                            selected={date}
                                            onSelect={(selected) => {
                                                setDate(selected as Date);
                                                setData('payment_date', selected as Date);
                                            }}
                                            defaultMonth={date}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </Field>
                        </div>

                        <Button
                            type="submit"
                            className="mt-2 w-full"
                            tabIndex={7}
                            data-test="register-employee-button"
                        >
                            {processing && <Spinner />}
                            پرداخت معاش
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

const DialogItem = ({ label, value }: { label: string; value: number; }) => {

    return (
        <div className="rounded-md bg-white p-3 shadow-sm">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-base font-semibold">{value}</div>
        </div>
    )
}