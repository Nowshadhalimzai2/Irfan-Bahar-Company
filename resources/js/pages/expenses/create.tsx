import InputError from "@/components/input-error";
import { SectionTitle } from "@/components/section-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import AppLayout from "@/layouts/app-layout";
import { Currency, Expense } from "@/types";
import { useForm } from "@inertiajs/react";
import { FormEvent } from "react";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";


type ExpenseType = {
    amount: number;
    description: string;
    currency_id: number;
}
interface Props {
    todaysExpenses: Expense[];
    currencies: Currency[]
}
const Create = ({ currencies, todaysExpenses }: Props) => {
    const { data, setData, post, processing, errors } = useForm<ExpenseType>({
        'amount': 10,
        'description': '',
        'currency_id': 1,
    });
    const handleExpense = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/expenses');
    }
    return (
        <AppLayout breadcrumbs={[
            { title: 'فورم مصرف', href: '/expenses/create' }
        ]}>
            <div className="section w-full px-5 ">
                <SectionTitle title="فورم مصرف روزمره" description="مصرف رزومره اینجا ثبت کنید" />
                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <form onSubmit={handleExpense}>
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="amount">مقدار پول</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="amount"
                                        min={10}
                                        name="amount"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', Number(e.target.value))}
                                    />
                                    <InputError
                                        message={errors.amount}
                                        className="mt-2"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">توضیحات</Label>
                                    <textarea
                                        id="description"
                                        required
                                        autoFocus
                                        tabIndex={2}
                                        autoComplete="description"
                                        name="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="border rounded-md p-5"
                                        placeholder="لطفا توضیحات را واضح نماید"
                                    />
                                    <InputError
                                        message={errors.description}
                                        className="mt-2"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="currencies">واحد پول</Label>
                                    <select
                                        id="currencies"
                                        name="currencies"
                                        required
                                        tabIndex={5}
                                        value={data.currency_id}
                                        onChange={(e) => setData('currency_id', Number(e.target.value))}
                                        className="border rounded px-3 py-2"
                                    >
                                        <option value="">واحد بول را انتخاب کنین</option>
                                        {currencies.map((currency) => (
                                            <option key={currency.id} value={currency.id}>
                                                {currency.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.currency_id} />
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
                    <div className="border p-3 rounded-md bg-muted">
                        <div>
                            <h1 className="text-center w-full text-accent font-semibold text-xl">ریکورد امروز</h1>
                            <Table>
                                <TableCaption>مصارف امروزی را اینجا دیده میتانی</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>تاریخ </TableHead>
                                        <TableHead>واحد بول</TableHead>
                                        <TableHead>مقدار پول</TableHead>
                                        <TableHead>توضیحات</TableHead>
                                        <TableHead className="w-15">شماره</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {todaysExpenses.map((expense, ind) => {
                                        return (
                                            <TableRow key={ind} className="hover:bg-secondary hover:border">
                                                <TableCell>{new Date(expense.date).toDateString()}</TableCell>
                                                <TableCell>{expense.currency.name}</TableCell>
                                                <TableCell>{expense.amount}</TableCell>
                                                <TableCell className="font-medium">{expense.description}</TableCell>
                                                <TableCell>{ind + 1}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                                            جمله مصارف {todaysExpenses.reduce((acc, exp) => acc + exp.amount, 0)}
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}

export default Create