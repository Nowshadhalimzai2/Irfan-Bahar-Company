import PageHead from "@/components/page-head";
import { SectionTitle } from "@/components/section-title";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Customer } from "@/types";
import { Link, router } from "@inertiajs/react";
import { Coins, DollarSign, Recycle, ScanEye, UserCheck, UserIcon, UsersIcon, UserSquareIcon, UserX } from "lucide-react";

interface Props {
    customers: Customer[]
}
const CustomerList = ({ customers }: Props) => {
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
                <div id="Summery" className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-5 lg:grid-cols-3 ">
                    <div className="p-4 mt-5 rounded-xl shadow-md hover:scale-101 hover:shadow-lg hover:bg-secondary/10  border bg-white">
                        <div className="flex justify-between">
                            <small className="text-muted-foreground text-sm">تعداد مشتریان</small>
                            <span className="bg-blue-50 p-2 rounded-md">
                                <UsersIcon className="text-blue-500" />
                            </span>
                        </div>
                        <p className="font-semibold text-2xl mt-3">{customers.length}</p>
                    </div>
                    <div className="p-4 mt-5 rounded-xl shadow-md hover:scale-101 hover:shadow-lg hover:bg-secondary/10 border bg-white">
                        <div className="flex justify-between">
                            <small className="text-muted-foreground text-sm"> فعال مشتریان</small>
                            <span className="bg-green-50 p-2 rounded-md">
                                <UserCheck className="text-green-500" />
                            </span>
                        </div>
                        <p className="font-semibold text-2xl mt-3">{50}</p>
                    </div>
                    <div className="p-4 mt-5 rounded-xl shadow-md hover:scale-101 hover:shadow-lg hover:bg-secondary/10 border bg-white">
                        <div className="flex justify-between">
                            <small className="text-muted-foreground text-sm">جمله قرض</small>
                            <span className="bg-sky-50 p-2 rounded-md">
                                <DollarSign className="text-sky-500" />
                            </span>
                        </div>
                        <p className="font-semibold text-2xl mt-3">{4054045}</p>
                    </div>
                </div>
            </div>

            {/* ========== FILTER SECTION ============== */}
            <div id="FILTER-SECTION" className="">
                
            </div>

            <div id="CUSTOMER-LIST" className="bg-white shadow-md rounded-2xl">
                <div className="p-5">
                    <SectionTitle title="لیست مشتریان" />
                    <div>
                        <Table>
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
                                   customers.length>0 ? customers.map((customer, ind) =>
                                        <TableRow key={ind}>
                                            <TableCell className="text-center">{ind + 1}</TableCell>
                                            <TableCell className="text-center">{customer.name}</TableCell>
                                            <TableCell className="text-center">{customer.nick_name ?? 'N/A'}</TableCell>
                                            <TableCell className="text-center">{customer.phone}</TableCell>
                                            <TableCell className="text-center">{1200}</TableCell>
                                            <TableCell className="flex justify-center">
                                                <ScanEye className="text-emerald-500" onClick={()=>router.get(`/customers/${customer.id}`)}/>
                                            </TableCell>
                                        </TableRow>
                                    ):
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