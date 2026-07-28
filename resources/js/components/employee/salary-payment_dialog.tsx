import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
} from "@/components/ui/popover"
import { CalendarIcon } from 'lucide-react';
import { Field, FieldLabel } from '../ui/field';
type PaySalaryType = {
    employee_id: number;
    amount: number;
    payment_date: Date | undefined;
}
export const SalaryPaymentDialog = ({ employee }: { employee: Employee }) => {
    const [date, setDate] = React.useState<Date>(new Date());
    const { data, setData, errors, reset, post, processing } = useForm<PaySalaryType>({
        'amount': 6000,
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
            <DialogContent>
                <DialogTitle>
                    مقدار پول
                </DialogTitle>
                <DialogDescription>
                    <span>
                        مقدار پول با دقت داخل کنین {employee.name}،
                    </span>
                    <span>
                        لطف نمودن در وقت دادن معاش برای .
                    </span>
                </DialogDescription>

                <form onSubmit={handleEmployee}>
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="amount">مقدار معاش</Label>
                            <Input
                                id="amount"
                                type="text"
                                required
                                autoFocus
                                tabIndex={6}
                                autoComplete="amount"
                                name="amount"
                                value={data.amount}
                                onChange={(e) => setData('amount', Number(e.target.value))}
                            />
                            <InputError
                                message={errors.amount}
                                className="mt-2"
                            />
                        </div>

                        {/* =================================== */}

                        <Field className="">
                            <Popover>
                                <PopoverTrigger>
                                    <Button type="button" variant="outline" id="date-picker-simple" className="justify-start w-full font-normal">
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
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

                        {/* ---------------------------------- */}
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
