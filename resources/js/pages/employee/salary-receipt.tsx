import { useEffect } from 'react';
import { Employee, Salary } from '@/types';
import { Button } from '@/components/ui/button';
import '@/components/thermal-receipt.css';

interface Props {
    employee: Employee;
    salary: Salary;
    grossMonthSalary: number;
    adjustedSalary: number;
    absentDays: number;
    paidThisMonth: number;
    remainingSalary: number;
    perDay: number;
}

const formatNumber = (value: number | string | null | undefined) =>
    Number(value ?? 0);

const formatDate = (value: string | Date | null | undefined) => {
    if (!value) return '—';

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fa-AF', {
        year: 'numeric',
        month: 'numeric',
        day: '2-digit',
    });
};

const SalaryReceipt = ({ employee, salary, grossMonthSalary, adjustedSalary, absentDays, paidThisMonth, remainingSalary, perDay }: Props) => {

    return (
        <div dir="rtl" lang="fa">
            <main className="thermal-receipt" aria-label="رسید پرداخت معاش">
                <header className="thermal-receipt__center">
                    <h1 className="thermal-receipt__store-name">رسید پرداخت معاش</h1>
                    <div className="thermal-receipt__muted thermal-receipt__small">سیستم مدیریت کارخانه</div>
                </header>

                <div className="thermal-receipt__rule" />

                <section aria-label="مشخصات کارمند">
                    <table className="thermal-receipt__meta">
                        <tbody>
                            <tr><td>نام کارمند</td><td>{employee.name || '—'}</td></tr>
                            <tr><td>نام پدر</td><td>{employee.f_name || '—'}</td></tr>
                            <tr><td>شماره تماس</td><td dir="ltr">{employee.phone || '—'}</td></tr>
                            <tr><td>آدرس</td><td>{employee.address || '—'}</td></tr>
                            <tr><td>تاریخ استخدام</td><td dir="ltr">{formatDate(employee.recruitment_date)}</td></tr>
                            <tr><td>شفت کاری</td><td>{employee.shift === 'day' ? 'روز' : 'شب'}</td></tr>
                        </tbody>
                    </table>
                </section>

                <div className="thermal-receipt__rule" />

                <section aria-label="جزئیات پرداخت">
                    <table className="thermal-receipt__totals">
                        <tbody>
                            <tr><td>تاریخ پرداخت</td><td dir="ltr">{formatDate(salary.payment_date)}</td></tr>
                            <tr><td>معاش ماهانه</td><td>{formatNumber(employee.salary)}</td></tr>
                            <tr><td>معاش ناخالص این ماه</td><td>{formatNumber(grossMonthSalary)}</td></tr>
                            <tr><td>معاش تعدیل‌شده</td><td>{formatNumber(adjustedSalary)}</td></tr>
                            <tr><td>غیبت‌ها</td><td>{formatNumber(absentDays)} روز</td></tr>
                            <tr><td>ارزش هر روز</td><td>{formatNumber(perDay)}</td></tr>
                            <tr><td>پرداختی این ماه</td><td>{formatNumber(paidThisMonth)}</td></tr>
                        </tbody>
                    </table>
                </section>

                <div className="thermal-receipt__rule" />

                <table className="thermal-receipt__totals thermal-receipt__grand-total">
                    <tbody>
                        <tr><td>مبلغ پرداخت‌شده</td><td>{formatNumber(salary.amount)}</td></tr>
                        <tr><td>باقی‌مانده قابل پرداخت</td><td>{formatNumber(remainingSalary)}</td></tr>
                    </tbody>
                </table>

                <footer className="thermal-receipt__footer">
                    <div>این رسید به‌صورت سیستمی صادر شده است.</div>
                    <div className="thermal-receipt__small">
                        <span>امضای کارمند: ........................</span>
                        <br />
                        <span>امضای مسئول: ........................</span>
                    </div>
                </footer>
            </main>

            <div className="thermal-receipt-toolbar">
                <Button onClick={() => window.print()}>چاپ مجدد</Button>
            </div>
        </div>
    );
};

export default SalaryReceipt;
