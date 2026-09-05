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
  const canAddEmployee = ['admin', 'super_admin', 'shop_clerk'].includes(
    roles[auth.user.role_id]?.name,
  );
    return (
        <div className="py-5">
            <PageHead
                HeadIcon={Users2Icon}
                title="تأمین کنندگان"
                subtitle="لیست تأمین کنندگان"
                description="در اینجا میتوانید لیست تمام تأمین کنندگان که در سیستم ثبت شده‌اند را مشاهده کنید."
                actionTitle={canAddEmployee ? 'ایجاد تأمین کننده جدید' : ''}
                actionURL={canAddEmployee ? '/suppliers/create' : ''}
            />
            <div className="p-2 border mt-6 bg-white shadow-2xl rounded-lg">
                <div>
                    <Table>
                        <TableCaption className="text-accent">همه تأمین کننده ګان در سیستم</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-15">ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Email </TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Action</TableHead>

                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {suppliers.length > 0 ? suppliers.map((supplier, ind) => {
                                return (
                                    <TableRow key={supplier.id} className="hover:bg-secondary hover:border" >
                                        <TableCell>{ind + 1}</TableCell>
                                        <TableCell className="font-medium">{supplier.name}</TableCell>
                                        <TableCell>{supplier.phone ?? "N/A"}</TableCell>
                                        <TableCell>{supplier.email ?? "N/A"}</TableCell>
                                        <TableCell>{supplier.address}</TableCell>
                                        <TableCell>{supplier.status ? 'Active' : 'Inactive'}</TableCell>
                                        <TableCell>
                                            <CustomeDropDownMenu
                                                items={[
                                                    { name: "Edit", url: `/suppliers/${supplier.id}/edit` },
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
                                <TableCell colSpan={3} className="text-end">{suppliers.length}</TableCell>
                                <TableCell colSpan={3} className="text-end">مجموعه تأمین کننده ګان</TableCell>

                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
                <div className="flex justify-end items-end p-5">
                    <Link href={'/suppliers/create'} className={buttonVariants({ variant: 'default' })}>ایجاد تامین کننده</Link>
                </div>
            </div>
        </div>
    )
}

export default SupplierList