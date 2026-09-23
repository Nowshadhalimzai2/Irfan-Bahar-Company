import PageHead from "@/components/page-head";
import { SectionTitle } from "@/components/section-title";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import customer from "@/routes/sales/customer";
import { Link, router } from "@inertiajs/react";
import { DollarSign, ScanEye, Search, UserCheck, UsersIcon, UserSquareIcon, UserX } from "lucide-react";
import { Input } from "../ui/input";
import { useEffect, useMemo, useState } from "react";

type Customer = { id: number, name: string, nick_name: string, balance: number, phone: string, is_active: boolean }
interface Props {
    customers: Customer[]
}
const CustomerList = ({ customers }: Props) => {
    const [searchTerm, setSearchTerm] = useState<string>('');

    const filteredCustomers = useMemo(() => customers.filter((customer) => {
        const searchable = `${customer.name} ${customer.nick_name} ${customer.phone} ${customer.is_active ? 'active' : 'block'}`.toLowerCase();

        return searchable.includes(searchTerm.toLowerCase());
    }), [searchTerm, customers]);

    return (
        <div className="space-y-6 py-5">
            <PageHead
                HeadIcon={UserSquareIcon}
                title="مشتریان"
                subtitle="کهاته مشتریان "
                description="کهاته مشتریان که در سیستم ثبت شده است . شما میتانین که کهاته مشتریان را تنظیم کنید"
                actionTitle="مشتری جدید"
                actionURL="/customers/create"
            />
            <div id="SHORT-INFO-CARDS" className="">
             
                <div id="Summery" className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-5 lg:grid-cols-3 " dir="rtl">
                    <div className="p-4 mt-5 rounded-xl shadow-md hover:scale-101 hover:shadow-lg hover:bg-secondary/10  border bg-white">
                        <div className="flex justify-between">
                            <small className="text-muted-foreground text-sm">تعداد مشتریان</small>
                            <span className="bg-blue-50 p-2 rounded-md">
                                <UsersIcon className="text-blue-500" />
                            </span>
                        </div>
                        <p className="font-semibold text-2xl mt-3">{filteredCustomers.length}</p>
                    </div>
                    <div className="p-4 mt-5 rounded-xl shadow-md hover:scale-101 hover:shadow-lg hover:bg-secondary/10 border bg-white">
                        <div className="flex justify-between">
                            <small className="text-muted-foreground text-sm"> بلاک شده </small>
                            <span className="bg-green-50 p-2 rounded-md">
                                <UserX className="text-red-500" />
                            </span>
                        </div>
                        <p className="font-semibold text-2xl mt-3">{filteredCustomers.filter(customer=>!customer.is_active).length}</p>
                    </div>
                    <div className="p-4 mt-5 rounded-xl shadow-md hover:scale-101 hover:shadow-lg hover:bg-secondary/10 border bg-white">
                        <div className="flex justify-between">
                            <small className="text-muted-foreground text-sm">جمله قرض</small>
                            <span className="bg-sky-50 p-2 rounded-md">
                                <DollarSign className="text-sky-500" />
                            </span>
                        </div>
                        <p className="font-semibold text-2xl mt-3">{filteredCustomers.reduce((acc, customer) => acc += customer.balance, 0)}</p>
                    </div>
                </div>
            </div>

            {/* ========== FILTER SECTION ============== */}


            <div id="CUSTOMER-LIST" className="bg-white shadow-md rounded-2xl">
                <div className="p-5">
                    <SectionTitle title="مشتریان" />
                    <div>
                        <div id="FILTER-SECTION" className="pb-5">
                            <div className="relative ">
                                <Search className="absolute top-1.5 right-2 text-gray-400" />
                                <Input className="pr-10 bg-white shadow overflow-hidden" dir="rtl" type="text" placeholder="جستجو مشتریان به اساس اسم، شماره تماس" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                        <Table dir="rtl">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">شماره</TableHead>
                                    <TableHead className="text-center">اسم</TableHead>
                                    <TableHead className="text-center">تخلص</TableHead>
                                    <TableHead className="text-center">شماره تماس</TableHead>
                                    <TableHead className="text-center">حساب</TableHead>
                                    <TableHead className="text-center">اجراآت</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {
                                    filteredCustomers.length > 0 ? filteredCustomers.map((customer, ind) =>
                                        <TableRow key={ind} className={`${!customer.is_active && 'bg-red-50 hover:bg-red-300'}`}>
                                            <TableCell className="text-center">{ind + 1}</TableCell>
                                            <TableCell className="text-center">{customer.name}</TableCell>
                                            <TableCell className="text-center">{customer.nick_name ?? 'N/A'}</TableCell>
                                            <TableCell className="text-center">{customer.phone}</TableCell>
                                            <TableCell className="text-center">{customer.balance}</TableCell>
                                            <TableCell className="flex justify-center">
                                                <ScanEye className={`${customer.is_active ? 'text-emerald-500 ' : 'text-red-500'}`} onClick={() => router.get(`/customers/${customer.id}`)} />
                                            </TableCell>
                                        </TableRow>
                                    ) :
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-muted-foreground text-sm"> مشتریان وجود ندارد. <Link href={'/customers/create'} className="underline text-blue-500 ">ایجاد مشتری جدید</Link></TableCell>
                                        </TableRow>
                                }
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CustomerList