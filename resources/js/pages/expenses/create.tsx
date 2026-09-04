import InputError from "@/components/input-error";
import { SectionTitle } from "@/components/section-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import AppLayout from "@/layouts/app-layout";
import { Currency, Expense } from "@/types";
import { useForm, usePage } from "@inertiajs/react";
import { FormEvent, useEffect, useMemo, useState } from "react";
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
import { Menu } from "lucide-react";
import { CustomeDropDownMenu } from "@/components/customer-dropdwon";
import axios from "axios";


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
    const { role } = usePage().props.auth.user as unknown as { role: { name: string } };
    const { data, setData, post, reset, processing, errors } = useForm<ExpenseType>({
        'amount': 10,
        'description': '',
        'currency_id': 1,
    });
    const handleExpense = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/expenses', {
            onFinish: () => reset('amount', 'description', 'currency_id')
        });
    }
    const [expenses, setExpenses] = useState<Expense[]>(todaysExpenses);
    const [togglingExpenseId, setTogglingExpenseId] = useState<number | null>(null);
    const [updatingExpenseId, setUpdatingExpenseId] = useState<number | null>(null);
    const [editingAmounts, setEditingAmounts] = useState<Record<number, string>>({});

    useEffect(() => {
        setExpenses(todaysExpenses);
    }, [todaysExpenses]);

    const totalExpenses = useMemo(() => {
        const totalAfg = expenses.filter(exp => exp.currency.name === 'AFG').reduce((acc, exp) => acc += exp.amount, 0);
        const totalUSD = expenses.filter(exp => exp.currency.name === 'USD').reduce((acc, exp) => acc += exp.amount, 0);
        const totalPKR = expenses.filter(exp => exp.currency.name === 'PKR').reduce((acc, exp) => acc += exp.amount, 0);

        return { 'totalAfg': totalAfg, 'totalUSD': totalUSD, 'totalPKR': totalPKR }
    }, [expenses]);

    const toggleExpenseEditable = async (expense: Expense) => {
        if (role.name !== "shop_clerk") {
            return;
        }

        if (!confirm("آیا میخواهید این ریکورد قابل ویرایش باشد؟")) {
            return;
        }

        setTogglingExpenseId(expense.id);

        try {
            const response = await axios.put(`/expenses/${expense.id}/toggle-editable`, { is_editable: expense.is_editable });

            if (response.status === 200) {
                const updatedExpense = response.data as Expense;
                setExpenses((prev) => prev.map((item) =>
                    item.id === expense.id
                        ? { ...item, is_editable: updatedExpense.is_editable ?? !expense.is_editable }
                        : item
                ));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setTogglingExpenseId(null);
        }
    }

    const canBeEditedBySuperAdmin = (expense: Expense) => {
        return role.name === "super_admin" && expense.is_editable;
    };

    const handleAmountChange = async (expense: Expense, value: string) => {
        if (!canBeEditedBySuperAdmin(expense)) {
            return;
        }

        const nextAmount = Number(value);
        if (Number.isNaN(nextAmount) || nextAmount === expense.amount) {
            setEditingAmounts((prev) => ({ ...prev, [expense.id]: String(expense.amount) }));
            return;
        }

        setUpdatingExpenseId(expense.id);

        try {
            const response = await axios.put(`/expenses/${expense.id}`, { amount: nextAmount });

            if (response.status === 200) {
                setExpenses((prev) => prev.map((item) =>
                    item.id === expense.id
                        ? { ...item, amount: response.data.amount, is_editable: false }
                        : item
                ));
                setEditingAmounts((prev) => ({ ...prev, [expense.id]: String(response.data.amount) }));
            }
        } catch (error) {
            console.error(error);
            setEditingAmounts((prev) => ({ ...prev, [expense.id]: String(expense.amount) }));
        } finally {
            setUpdatingExpenseId(null);
        }
    };
    return (
        <AppLayout breadcrumbs={[
            { title: 'فورم مصرف', href: '/expenses/create' }
        ]}>
            <div className="pb-5 mb-12 w-full px-5 ">
                <div className="flex justify-end items-end w-full p-5">
                    <CustomeDropDownMenu items={[{ name: 'ریکورد مصارف', url: '/expenses' }]} />
                </div>
                <SectionTitle title="فورم مصرف روزمره" description="مصرف رزومره اینجا ثبت کنید" />
                <div className={`grid grid-cols-1 ${role.name === 'shop_clerk' && "md:grid-cols-2"} gap-5`}>
                    {role.name === "shop_clerk" && <div>
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

                                <div className="grid gap-2">
                                    <Label htmlFor="description">توضیحات</Label>
                                    <textarea
                                        id="description"
                                        required
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
                    </div>}
                    <div className="border p-3 rounded-md bg-muted">
                        <div>
                            <h1 className="text-center w-full text-accent font-semibold text-xl py-5">ریکورد مصارف امروز</h1>
                            <Table>
                                <TableCaption> مصارف تاریخ {new Date().toLocaleDateString('fa-IR')} را اینجا دیده میتانی</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        {role.name === "shop_clerk" && <TableHead>قابل ویرایش است؟ </TableHead>}
                                        <TableHead>واحد پول</TableHead>
                                        <TableHead>مقدار پول</TableHead>
                                        <TableHead>توضیحات</TableHead>
                                        <TableHead className="">شماره</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.map((expense, ind) => {
                                        return (
                                            <TableRow key={expense.id} className="hover:bg-secondary hover:border">
                                                {role.name === "shop_clerk" && <TableCell><Button onClick={() => toggleExpenseEditable(expense)}>{expense.is_editable ? 'بلی' : 'نخیر'}</Button></TableCell>}
                                                <TableCell>{expense.currency.name}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={editingAmounts[expense.id] ?? String(expense.amount)}
                                                        readOnly={!canBeEditedBySuperAdmin(expense)}
                                                        onChange={(e) => setEditingAmounts((prev) => ({ ...prev, [expense.id]: e.target.value }))}
                                                        onBlur={(e) => handleAmountChange(expense, e.target.value)}
                                                        disabled={updatingExpenseId === expense.id}
                                                        className={`w-full ${canBeEditedBySuperAdmin(expense) ? 'border' : 'bg-transparent border-none'} ${updatingExpenseId === expense.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium flex-1">{expense.description}</TableCell>
                                                <TableCell className="text-center">{ind + 1}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={1} className="text-center text-sm text-muted-foreground">
                                            جمله مصارف کلداری {totalExpenses['totalPKR']}
                                        </TableCell>
                                        <TableCell colSpan={1} className="text-center text-sm text-muted-foreground">
                                            جمله مصارف دالر {totalExpenses['totalUSD']}
                                        </TableCell>
                                        <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                                            جمله مصارف افغانی {totalExpenses['totalAfg']}
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