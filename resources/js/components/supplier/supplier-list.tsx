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
import { Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { buttonVariants } from "../ui/button";

interface Props {
    suppliers: Supplier[];
}
const SupplierList = ({ suppliers }: Props) => {
    return (
        <div className="section">
            <div>
                <SectionTitle title="لیست تامین کنندگان" />
                <div>
                    <Table>
                        <TableCaption>همه تأمین کننده ګان در سیستم</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-15">ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Email </TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {suppliers.length > 0 ? suppliers.map((supplier, ind) => {
                                return (
                                    <TableRow key={supplier.id} className="hover:bg-secondary hover:border" onClick={() => router.get("/suppliers/" + supplier.id)}>
                                        <TableCell>{ind + 1}</TableCell>
                                        <TableCell className="font-medium">{supplier.name}</TableCell>
                                        <TableCell>{supplier.phone ?? "N/A"}</TableCell>
                                        <TableCell>{supplier.email ?? "N/A"}</TableCell>
                                        <TableCell>{supplier.address}</TableCell>
                                        <TableCell>{supplier.status ? 'Active' : 'Inactive'}</TableCell>

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
            </div>
        </div>
    )
}

export default SupplierList