import { CustomeDropDownMenu } from "@/components/customer-dropdwon";
import { getDariCurrency } from "@/components/location-translator";
import PageHead from "@/components/page-head";
import AppLayout from "@/layouts/app-layout";
import { Customer } from "@/types";
import { Link } from "@inertiajs/react";
import {
    Activity,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    CreditCard,
    DollarSign,
    Edit3,
    HandCoins,
    HandHelping,
    Mail,
    MapPin,
    Phone,
    User,
    XCircle,
} from "lucide-react";

interface Props {
    customer: Customer;
}

const Show = ({ customer }: Props) => {
    const createdDate = new Date(customer.created_at).toLocaleDateString("fa-IR");

    return (
        <AppLayout
            breadcrumbs={[
                { title: "مشتریان", href: "/stackholders" },
                { title: customer.name, href: `/customers/${customer.id}` },
            ]}
        >
            <div dir="rtl" className="min-h-screen space-y-6 bg-slate-50 p-3 md:p-6">
                <div className="relative overflow-hidden rounded-3xl bg-linear-to-l from-slate-950 via-slate-800 to-indigo-900 p-6 text-white shadow-xl md:p-8">
                    <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" />
                    <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
                                <User size={34} />
                            </div>
                            <div>
                                <p className="mb-1 text-sm text-indigo-200">پروفایل مشتری</p>
                                <h1 className="text-2xl font-bold md:text-3xl">
                                    {customer.name}
                                </h1>
                                <p className="mt-1 text-slate-300">
                                    {customer.nick_name ?? "بدون تخلص"}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-start gap-3">
                            <span
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${customer.is_active
                                    ? "bg-emerald-400/20 text-emerald-200"
                                    : "bg-red-400/20 text-red-200"
                                    }`}
                            >
                                {customer.is_active ? (
                                    <CheckCircle2 size={17} />
                                ) : (
                                    <XCircle size={17} />
                                )}
                                {customer.is_active ? "فعال" : "غیر فعال"}
                            </span>

                           <div className="">
                             <Link
                                href={`/customers/${customer.id}/edit`}
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-indigo-50"
                            >
                                <Edit3 size={17} />
                                ویرایش مشتری
                            </Link>
                            <CustomeDropDownMenu items={[
                                {name:`${customer.is_active?"غیر فعال کنید":"فعال کنید"}`,url:`/customers/status/${customer.id}`}
                            ]}
                                method="put"
                            />
                           </div>
                        </div>
                    </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <AccountCard currency="AFG" icon={<CreditCard size={21}/>} value={500000}/>
                    <AccountCard currency="PKR" icon={<CreditCard size={21}/>} value={210000}/>
                    <AccountCard currency="USD" icon={<CreditCard size={21}/>} value={335}/>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoCard
                        title="شماره تماس"
                        value={customer.phone}
                        icon={<Phone size={21} />}
                        color="blue"
                    />
                    <InfoCard
                        title="بالاترین قرض"
                        value={getDariCurrency("AFG") + " 54,609"}
                        icon={<HandHelping size={21} />}
                        color="emerald"
                    />
                    <InfoCard
                        title="آخرین پرداخت"
                        value={getDariCurrency("AFG") + " 41,000"}
                        icon={<HandCoins size={21} />}
                        color="amber"
                    />
                    <InfoCard
                        title="تاریخ آخرین پرداخت"
                        value={createdDate}
                        icon={<CalendarDays size={21} />}
                        color="violet"
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <section className="rounded-3xl border bg-white p-5 shadow-sm lg:col-span-2">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    اطلاعات تماس
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    اطلاعات ثبت‌شده مشتری در سیستم
                                </p>
                            </div>
                            <Activity className="text-indigo-500" />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Detail
                                icon={<Mail />}
                                label="ایمیل"
                                value={customer.email || "ثبت نشده"}
                            />
                            <Detail
                                icon={<Phone />}
                                label="شماره تماس"
                                value={customer.phone || "ثبت نشده"}
                            />
                            <Detail
                                icon={<MapPin />}
                                label="آدرس"
                                value={customer.address || "ثبت نشده"}
                            />
                            <Detail
                                icon={<CalendarDays />}
                                label="تاریخ عضویت"
                                value={createdDate}
                            />
                        </div>
                    </section>

                    <section className="rounded-3xl bg-linear-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-lg">
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-indigo-200">خلاصه فعالیت</p>
                                <h2 className="mt-1 text-xl font-bold">وضعیت حساب</h2>
                            </div>
                            <CreditCard className="text-indigo-200" size={28} />
                        </div>

                        <div className="space-y-5">
                            <div className="flex items-center justify-between border-b border-white/20 pb-4">
                                <span className="text-indigo-100">مجموع خرید</span>
                                <strong>{getDariCurrency("AFG")} 450,220</strong>
                            </div>
                            <div className="flex items-center justify-between border-b border-white/20 pb-4">
                                <span className="text-indigo-100">بدهی فعلی</span>
                                <strong>{getDariCurrency("AFG")} 840,000</strong>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-indigo-100">وضعیت</span>
                                <strong>{customer.is_active ? "فعال" : "غیر فعال"}</strong>
                            </div>
                        </div>
                    </section>
                </div>

                <Link
                    href="/stackholders"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                    <ArrowRight size={18} />
                    بازگشت به فهرست مشتریان
                </Link>
            </div>
        </AppLayout>
    );
};

function InfoCard({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: "blue" | "emerald" | "amber" | "violet";
}) {
    const styles = {
        blue: "bg-blue-50 text-blue-600",
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
        violet: "bg-violet-50 text-violet-600",
    };

    return (
        <div className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${styles[color]}`}>
                {icon}
            </div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-2 font-bold text-slate-800">{value}</p>
        </div>
    );
}

function Detail({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3 rounded-2xl border bg-slate-50 p-4">
            <div className="rounded-xl bg-white p-2 text-indigo-600 shadow-sm">
                {icon}
            </div>
            <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 font-semibold text-slate-800">{value}</p>
            </div>
        </div>
    );
}


function AccountCard({ value, currency, icon }: { value: number, currency: "AFG" | "PKR" | "USD", icon: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 rounded-2xl border bg-slate-950 p-4 hover:-translate-y-1 duration-200">
            <div className="rounded-xl bg-indigo-900 p-2 text-indigo-200 shadow-sm">
                {icon}
            </div>
            <div>
                <p className="text-xs text-muted">{getDariCurrency(currency)}</p>
                <p className="mt-1 font-semibold text-white">{value}</p>
            </div>
        </div>
    )
}
export default Show;