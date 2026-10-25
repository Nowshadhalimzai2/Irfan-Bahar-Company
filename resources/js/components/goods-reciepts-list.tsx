import { Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, CalendarDays, ChevronDown, PackagePlus, Search, SlidersHorizontal, Warehouse, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import LocationTranslator from '@/components/location-translator';
import { formatPersianDate } from '@/components/persian-date-picker';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { GoodsReceipt } from '@/types/item';
import PageLinks from './page-links';

interface Props {
    goodsReceipts: {
        data: GoodsReceipt[];
        current_page: number;
        from: number;
        last_page: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
    };
}
const GoodsReceiptList = ({ goodsReceipts }: Props) => {
    const {auth,roles} = usePage().props;
    const userRole:string = roles.filter(role=>role.id===auth.user.role_id)[0].name;
    const [search, setSearch] = useState('');
    const [supplier, setSupplier] = useState('all');
    const [location, setLocation] = useState('all');
    const [date, setDate] = useState('all');

    const suppliers = useMemo(() => Array.from(new Set(goodsReceipts.data.map((receipt) => receipt.supplier.name))), [goodsReceipts.data]);
    const locations = useMemo(() => Array.from(new Set(goodsReceipts.data.map((receipt) => LocationTranslator(receipt.location.name)))), [goodsReceipts.data]);

    const filteredReceipts = useMemo(() => goodsReceipts.data.filter((receipt) => {
        const receiptLocation = LocationTranslator(receipt.location.name);
        const searchable = `${receipt.reference_no} ${receipt.supplier.name} ${receiptLocation}`.toLowerCase();
        const receivedDate = new Date(receipt.received_at);

        return searchable.includes(search.toLowerCase())
            && (supplier === 'all' || receipt.supplier.name === supplier)
            && (location === 'all' || receiptLocation === location)
            && (date === 'all' || receivedDate.toISOString().slice(0, 7) === date);
    }), [date, goodsReceipts.data, location, search, supplier]);

    const totalValue = filteredReceipts.reduce((total, receipt) => total + receipt.receipt_lines.reduce((lineTotal, line) => lineTotal + Number(line.quantity) * Number(line.unit_cost), 0), 0);
    const clearFilters = () => {
        setSearch('');
        setSupplier('all');
        setLocation('all');
        setDate('all');
    };

    return (
        <section className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 md:px-10">
                <div className="absolute -left-12 -top-16 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl" />
                <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-amber-300"><Warehouse className="size-4" /> مدیریت موجودی ورودی</div>
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">رسیدهای اجناس</h1>
                        <p className="max-w-xl text-sm leading-6 text-slate-300">ورود اجناس از تأمین‌کنندگان را سریع پیدا و بررسی کنید.</p>
                    </div>
                    {(userRole === 'factory_clerk' || userRole==='shop_clerk') &&<Link href="/receipts/create" className={`${buttonVariants({ variant: 'secondary' })} gap-2 bg-amber-400 text-slate-950 hover:bg-amber-300`}><PackagePlus className="size-4" /> خریدن جنس نو</Link>}
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"><p className="text-xs text-muted-foreground">نمایش فعلی</p><p className="mt-1 text-2xl font-bold text-primary">{filteredReceipts.length}<span className="mr-1 text-sm font-normal text-muted-foreground">رسید</span></p></div>
                <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"><p className="text-xs text-muted-foreground">کل این صفحه</p><p className="mt-1 text-2xl font-bold">{goodsReceipts.data.length}<span className="mr-1 text-sm font-normal text-muted-foreground">رکورد</span></p></div>
                <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"><p className="text-xs text-muted-foreground">ارزش نمای فعلی</p><p className="mt-1 text-2xl font-bold text-emerald-600">{totalValue.toLocaleString()}<span className="mr-1 text-sm font-normal text-muted-foreground">افغانی</span></p></div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2"><SlidersHorizontal className="size-4 text-primary" /><h2 className="font-semibold">جستجو و فیلتر</h2></div>
                    {(search || supplier !== 'all' || location !== 'all' || date !== 'all') && <button type="button" onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"><X className="size-3" /> پاک کردن</button>}
                </div>
                <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
                    <label className="relative block"><Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجو در حواله، تأمین‌کننده یا موقعیت..." className="h-11 pr-10" /></label>
                    <label className="relative block"><select value={supplier} onChange={(event) => setSupplier(event.target.value)} className="h-11 w-full appearance-none rounded-md border border-input bg-background px-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="all">همه تأمین‌کنندگان</option>{suppliers.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /></label>
                    <label className="relative block"><select value={location} onChange={(event) => setLocation(event.target.value)} className="h-11 w-full appearance-none rounded-md border border-input bg-background px-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="all">همه موقعیت‌ها</option>{locations.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /></label>
                    <label className="relative block"><CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input type="month" value={date === 'all' ? '' : date} onChange={(event) => setDate(event.target.value || 'all')} className="h-11 pr-10" /></label>
                </div>
            </div>

            <div className="">
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                    <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="text-center text-xs font-semibold">شماره</TableHead>
                                <TableHead className="text-center">تأمین کننده</TableHead>
                                <TableHead className="text-center">منزل</TableHead>
                                <TableHead className="text-center">نمبر حواله</TableHead>
                                <TableHead className="text-center">تاریخ آمد</TableHead>
                                <TableHead className="text-center">ارزش اجناس</TableHead>
                                <TableHead aria-label="باز کردن" />

                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReceipts.length > 0 ? filteredReceipts.map((receipt, ind) =>
                                <TableRow key={receipt.id} className="cursor-pointer transition-colors hover:bg-amber-50/60 dark:hover:bg-amber-950/20" onClick={() => router.get('/receipts/' + receipt.id)}>
                                    <TableCell className="text-center">{ind + 1}</TableCell>
                                    <TableCell className="text-center">{receipt.supplier.name}</TableCell>
                                    <TableCell className="text-center">{LocationTranslator(receipt.location.name)}</TableCell>
                                    <TableCell className="text-center">{receipt.reference_no}</TableCell>
                                    <TableCell className="text-center text-sm text-muted-foreground">{formatPersianDate(String(receipt.received_at))}</TableCell>
                                    <TableCell className="text-center font-semibold">{receipt.receipt_lines.reduce((total, line) => total + Number(line.quantity) * Number(line.unit_cost), 0).toLocaleString()}</TableCell>
                                    <TableCell className="w-8"><ArrowRight className="size-4 text-muted-foreground" /></TableCell>
                                </TableRow>
                            ) : <TableRow>
                                <TableCell colSpan={7}><p className="w-full p-10 text-center text-muted-foreground">موردی با این مشخصات پیدا نشد.</p></TableCell>
                            </TableRow>}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={7}>
                                   <PageLinks links={goodsReceipts.links} />
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default GoodsReceiptList