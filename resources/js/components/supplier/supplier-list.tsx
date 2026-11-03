import { Link, router } from '@inertiajs/react';
import { Users2Icon } from 'lucide-react';
import type { Supplier } from '@/types';
import PageHead from '../page-head';
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';

interface Props {
    suppliers: Supplier[];
}
const SupplierList = ({ suppliers }: Props) => {
    return (
        <div className="py-5">
            <PageHead
                HeadIcon={Users2Icon}
                title="تأمین کنندگان"
                subtitle="لیست تأمین کنندگان"
                description="در اینجا میتوانید لیست تمام تأمین کنندگان که در سیستم ثبت شده‌اند را مشاهده کنید."
                actionTitle={'ایجاد تأمین کننده جدید'}
                actionURL={'/suppliers/create'}
            />
            <div className="mt-6 rounded-lg border bg-white p-2 shadow-2xl">
                <div dir="rtl">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-15 text-center">
                                    شماره
                                </TableHead>
                                <TableHead className="text-center">
                                    اسم تامین کننده
                                </TableHead>
                                <TableHead className="text-center">
                                    شماره تماس
                                </TableHead>
                                <TableHead className="text-center">
                                    ایمیل{' '}
                                </TableHead>
                                <TableHead className="text-center">
                                    آدرس
                                </TableHead>
                                <TableHead className="text-center">
                                    وضیعت
                                </TableHead>
                                <TableHead className="text-center">
                                    اجراآت
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {suppliers.length > 0 ? (
                                suppliers.map((supplier, ind) => {
                                    return (
                                        <TableRow
                                            key={supplier.id}
                                            className="text-center hover:border hover:bg-secondary"
                                            onClick={() =>
                                                router.get(
                                                    '/suppliers/' + supplier.id,
                                                )
                                            }
                                        >
                                            <TableCell className="textcenter">
                                                {ind + 1}
                                            </TableCell>
                                            <TableCell className="textcenter font-medium">
                                                {supplier.name}
                                            </TableCell>
                                            <TableCell className="textcenter">
                                                {supplier.phone ?? 'N/A'}
                                            </TableCell>
                                            <TableCell className="textcenter">
                                                {supplier.email ?? 'N/A'}
                                            </TableCell>
                                            <TableCell className="textcenter">
                                                {supplier.address}
                                            </TableCell>
                                            <TableCell className="textcenter">
                                                {supplier.status
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </TableCell>
                                            <TableCell className="flex flex-col items-center justify-center">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/suppliers/${supplier.id}/edit`}
                                                        onClick={(event) =>
                                                            event.stopPropagation()
                                                        }
                                                        className="text-sm text-primary hover:underline"
                                                    >
                                                        ویرایش
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();

                                                            if (
                                                                confirm(
                                                                    supplier.status
                                                                        ? 'تأمین‌کننده غیرفعال شود؟ رسیدها و پرداخت‌های قبلی محفوظ می‌ماند.'
                                                                        : 'تأمین‌کننده دوباره فعال شود؟',
                                                                )
                                                            ) {
                                                                router.put(
                                                                    `/suppliers/status/${supplier.id}`,
                                                                );
                                                            }
                                                        }}
                                                        className="text-sm text-primary hover:underline"
                                                    >
                                                        {supplier.status
                                                            ? 'غیرفعال کردن'
                                                            : 'فعال کردن'}
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="mt-5 p-5 text-center text-sm text-muted-foreground"
                                    >
                                        تامین کننده ای وجود ندارد
                                        <Link
                                            href={'/suppliers/create'}
                                            className="text-sm text-blue-500 hover:underline"
                                        >
                                            {' '}
                                            ایجاد کنید
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={6} className="">
                                    مجموعه تأمین کننده ګان : {suppliers.length}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default SupplierList;
