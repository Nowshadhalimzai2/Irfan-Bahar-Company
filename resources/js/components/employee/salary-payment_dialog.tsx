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
import { FormEvent } from 'react';
import { Employee } from '@/types';

type PaySalaryType = {
    employee_id: number;
    amount: number;
}
export const SalaryPaymentDialog = ({ employee }: { employee: Employee }) => {

    const { data, setData, errors, reset, post, processing } = useForm<PaySalaryType>({
        'amount': 6000,
        'employee_id': employee.id,

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
                    دادن معاش
                </Button>
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
                            <p className="text-accent-foreground font-medium text-sm text-end">
                                {new Date().toLocaleDateString()} تاریخ
                            </p>
                            <p className="text-muted-foreground py-1 text-sm text-end">
                                وصول شده: 0.0
                            </p>
                            <p className="text-muted-foreground text-sm text-end">
                                بقایه معاش 5000  افقانی است
                            </p>
                            <InputError
                                message={errors.amount}
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
                            ادا کنین                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
