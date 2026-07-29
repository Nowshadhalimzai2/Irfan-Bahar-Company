import { useEffect } from 'react';
import { Employee, Salary } from '@/types';
import { Button } from '@/components/ui/button';
import { SectionTitle } from '@/components/section-title';

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

const SalaryReceipt = ({ employee, salary, grossMonthSalary, adjustedSalary, absentDays, paidThisMonth, remainingSalary, perDay }: Props) => {
    useEffect(() => {
        window.print();
    }, []);

    return (
        <div className="printable-receipt mx-auto w-full max-w-[80mm] bg-white p-4 text-slate-900" id="printable-receipt" style={{ width: '90mm', maxWidth: '100%' }}>
            <style>{`
                @media print {
                    @page { size: 80mm auto; margin: 6mm; }
                    body { margin: 0; background: #fff; }
                    .printable-receipt {
                        box-shadow: none !important;
                        margin: 0 !important;
                        width: 80mm !important;
                        max-width: 80mm !important;
                        min-height: auto !important;
                        font-size: 11pt !important;
                        color: #000 !important;
                        background: #fff !important;
                    }
                    .printable-receipt * {
                        color: #000 !important;
                        background: transparent !important;
                    }
                    .print:hidden { display: none !important; }
                }
            `}</style>
            <SectionTitle title="رسید پرداخت معاش" />
            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 text-sm text-slate-900">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs text-slate-500">نام کارمند</div>
                            <div className="font-semibold">{employee.name}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500">نام پدر</div>
                            <div className="font-semibold">{employee.f_name}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs text-slate-500">شماره تماس</div>
                            <div className="font-semibold">{employee.phone}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500">آدرس</div>
                            <div className="font-semibold">{employee.address}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs text-slate-500">تاریخ استخدام</div>
                            <div className="font-semibold">{new Date(employee.recruitment_date).toLocaleDateString()}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500">شفت کاری</div>
                            <div className="font-semibold">{employee.shift === 'day' ? 'روز' : 'شب'}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs text-slate-500">معاش ماهانه</div>
                            <div className="font-semibold">{employee.salary}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500">تاریخ پرداخت</div>
                            <div className="font-semibold">{new Date(salary.payment_date).toLocaleDateString()}</div>
                        </div>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-slate-500">معاش ناخالص این ماه</div>
                                <div className="font-semibold">{grossMonthSalary}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500">معاش تعدیل‌شده</div>
                                <div className="font-semibold">{adjustedSalary}</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs text-slate-500">مبلغ پرداخت‌شده</div>
                            <div className="font-semibold">{salary.amount}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500">باقی‌مانده قابل پرداخت</div>
                            <div className="font-semibold">{remainingSalary}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs text-slate-500">غیبت‌ها</div>
                            <div className="font-semibold">{absentDays} روز</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500">ارزش هر روز</div>
                            <div className="font-semibold">{perDay}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 print:hidden">
                <Button onClick={() => window.print()}>چاپ مجدد</Button>
            </div>
        </div>
    );
};

export default SalaryReceipt;
