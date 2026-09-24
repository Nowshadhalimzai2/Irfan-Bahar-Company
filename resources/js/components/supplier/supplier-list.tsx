import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"; import { Supplier } from '@/types';
import React from 'react'
import { SectionTitle } from '../section-title';
import { Link, router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { buttonVariants } from "../ui/button";
import { CustomeDropDownMenu } from "../customer-dropdwon";
import PageHead from "../page-head";
import { Users2Icon } from "lucide-react";

interface Props {
    suppliers: Supplier[];
}
const SupplierList = ({ suppliers }: Props) => {
 const { auth, roles }= usePage().props;
//   const canAddEmployee = ['admin', 'super_admin', 'shop_clerk'].includes(
//     roles[auth.user.role_id]?.name,
//   );
    return (
        <div className="py-5">
            <PageHead
                HeadIcon={Users2Icon}
                title="تأمین کنندگان"
                subtitle="لیست تأمین کنندگان"
                description="در اینجا میتوانید لیست تمام تأمین کنندگان که در سیستم ثبت شده‌اند را مشاهده کنید."
                actionTitle={ 'ایجاد تأمین کننده جدید'}
                actionURL={'/suppliers/create'}
            />
            <div className="p-2 border mt-6 bg-white shadow-2xl rounded-lg">
                <div dir="rtl">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-15 text-center">شماره</TableHead>
                                <TableHead className="text-center">اسم تامین کننده</TableHead>
                                <TableHead className="text-center">شماره تماس</TableHead>
                                <TableHead className="text-center">ایمیل </TableHead>
                                <TableHead className="text-center">آدرس</TableHead>
                                <TableHead className="text-center">وضیعت</TableHead>
                                <TableHead className="text-center">اجراآت</TableHead>

                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {suppliers.length > 0 ? suppliers.map((supplier, ind) => {
                                return (
                                    <TableRow key={supplier.id} className="hover:bg-secondary text-center hover:border" >
                                        <TableCell className='textcenter'>{ind + 1}</TableCell>
                                        <TableCell className='textcenter font-medium'>{supplier.name}</TableCell>
                                        <TableCell className='textcenter'>{supplier.phone ?? "N/A"}</TableCell>
                                        <TableCell className='textcenter'>{supplier.email ?? "N/A"}</TableCell>
                                        <TableCell className='textcenter'>{supplier.address}</TableCell>
                                        <TableCell className='textcenter'>{supplier.status ? 'Active' : 'Inactive'}</TableCell>
                                        <TableCell className="flex flex-col justify-center items-center">
                                            <CustomeDropDownMenu
                                                items={[
                                                    { name: "ویرایش", url: `/suppliers/${supplier.id}/edit` },
                                                ]}
                                                deletion={{ id: supplier.id, url: `/suppliers/${supplier.id}` }}
                                            />
                                        </TableCell>


                                    </TableRow>
                                );
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-sm text-muted-foreground text-center p-5 mt-5">
                                        تامین کننده ای وجود ندارد
                                        <Link href={'/suppliers/create'} className="text-sm hover:underline text-blue-500"> ایجاد کنید</Link>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={6} className="">مجموعه تأمین کننده ګان :  {suppliers.length}</TableCell>

                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
                
            </div>
        </div>
    )
}

export default SupplierList