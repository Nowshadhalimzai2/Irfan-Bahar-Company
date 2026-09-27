import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronDown, PackageCheck, Search, SlidersHorizontal, Truck, UserRoundPen, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import LocationTranslator, { getDariCategory } from '@/components/location-translator';
import { SectionTitle } from '@/components/section-title';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Transfer } from '@/types/item';
import PageLinks from './page-links';
import { Role } from '@/types';
import { CustomeDropDownMenu } from './customer-dropdwon';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import axios from 'axios';

interface Props {
    transfers: {
        data: Transfer[];
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
const TransferList = ({ transfers }: Props) => {

    const { auth, roles } = usePage().props;
    const UserRoles = roles as Role[];
    const userRole: string = UserRoles.filter((role: { id: number }) => role.id === auth.user.role_id)[0].name;

    const [search, setSearch] = useState('');
    const [source, setSource] = useState('all');
    const [destination, setDestination] = useState('all');
    const [period, setPeriod] = useState<'daily' | 'monthly'>('daily');

    const currentDate = period === 'daily' ? new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 7);
    const [date, setDate] = useState(currentDate);

    const sourceLocations = useMemo(() => Array.from(new Set(transfers.data.map((transfer) => LocationTranslator(transfer.source.name)))), [transfers.data]);
    const destinationLocations = useMemo(() => Array.from(new Set(transfers.data.map((transfer) => LocationTranslator(transfer.destination.name)))), [transfers.data]);

    const filteredTransfers = useMemo(() => transfers.data.filter((transfer) => {

        const searchable = `${transfer.reference_no}`.toLowerCase();
        const transferredDate = new Date(transfer.transferred_at);

        return searchable.includes(search.toLowerCase())
            && (source === 'all' || source === LocationTranslator(transfer.source.name))
            && (destination === 'all' || destination === LocationTranslator(transfer.destination.name))
            && (date === 'all' || (period == 'monthly' ? transferredDate.toISOString().slice(0, 7) === date : transferredDate.toISOString().slice(0, 10) === date));
    }), [date, destination, search, source, transfers.data]);

    const totalValue = filteredTransfers.reduce((total, transfer) => total + transfer.transfer_lines.reduce((lineTotal, line) => lineTotal + Number(line.unit_price), 0), 0);
    const clearFilters = () => {
        setSearch('');
        setSource('all');
        setDestination('all');
        setDate('all');
    };


    const getTransferStatus = (status: 'suggested' | 'cancelled' | 'completed') => status === 'suggested' ? 'پیشنهاد شده' : status === 'completed' ? 'تکمیل شده' : status === 'cancelled' ? 'لغو شده' : status;
    const getTransferStyle = (status: 'suggested' | 'cancelled' | 'completed') => status === 'suggested' ? 'text-yellow-500 hover:bg-yellow-50 hover:text-yellow-800' : status === 'completed' ? 'text-green-500' : status === 'cancelled' ? 'text-red-500' : '';

    const handleTransferStatus=(transfer:Transfer,status:'completed'|'cancelled'|'suggested')=>{
            if(status==='suggested')
                return;
            
            router.put(`/transfers/${transfer.id}/status/${status}`,{},{preserveScroll:true,preserveState:true});
    }
    return (
        <section className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 md:px-10">
                <div className="absolute -left-12 -top-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
                <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-cyan-300"><Truck className="size-4" /> مدیریت جریان اجناس</div>
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">انتقالات داخلی</h1>
                        <p className="max-w-xl text-sm leading-6 text-slate-300">تمام جابه‌جایی‌های اجناس را در یک نمای روشن دنبال کنید.</p>
                    </div>
                    {(userRole === 'factory_clerk') && <Link href="/transfers/create" className={`${buttonVariants({ variant: 'secondary' })} gap-2 bg-cyan-400 text-slate-950 hover:bg-cyan-300`}><PackageCheck className="size-4" /> جنس را انتقال دهید</Link>}
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"><p className="text-xs text-muted-foreground">نمایش فعلی</p><p className="mt-1 text-2xl font-bold text-primary">{filteredTransfers.length}<span className="mr-1 text-sm font-normal text-muted-foreground">انتقال</span></p></div>
                <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"><p className="text-xs text-muted-foreground">کل این صفحه</p><p className="mt-1 text-2xl font-bold">{transfers.data.length}<span className="mr-1 text-sm font-normal text-muted-foreground">رکورد</span></p></div>
                <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"><p className="text-xs text-muted-foreground">ارزش نمای فعلی</p><p className="mt-1 text-2xl font-bold text-emerald-600">{totalValue.toLocaleString()}<span className="mr-1 text-sm font-normal text-muted-foreground">افغانی</span></p></div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex justify-between w-full p-1">
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal className="size-4 text-primary" /><h2 className="font-semibold">جستجو و فیلتر</h2>

                        </div>
                        {(search || source !== 'all' || destination !== 'all' || date !== 'all') && <button type="button" onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"><X className="size-3" /> پاک کردن</button>}
                        <div>
                            <select className='border p-1.5 rounded-sm w-30 md:w-50' onChange={(e) => setPeriod(e.target.value as 'daily' | 'monthly')} >
                                <option value="daily">daily</option>
                                <option value="monthly">monthly</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
                    <label className="relative block"><Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجو به اساس حواله نمبر" className="h-11 pr-10" /></label>
                    <label className="relative block"><select value={source} onChange={(event) => setSource(event.target.value)} className="h-11 w-full appearance-none rounded-md border border-input bg-background px-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="all">همه مراجع</option>{sourceLocations.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /></label>
                    <label className="relative block"><select value={destination} onChange={(event) => setDestination(event.target.value)} className="h-11 w-full appearance-none rounded-md border border-input bg-background px-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="all">همه مقاصد</option>{destinationLocations.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /></label>
                    <label className="relative block"><CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input type={period === "daily" ? 'date' : 'month'} value={date === 'all' ? '' : date} onChange={(event) => setDate(event.target.value || 'all')} className="h-11 pr-10" /></label>
                </div>
            </div>

            <div className='shadow-md bg-white rounded-2xl'>
                <div className=" ">
                    <div className="overflow-x-auto" dir='rtl'>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead className='text-center text-xs font-semibold'>شماره</TableHead>
                                    <TableHead className='text-center'>مرجع</TableHead>
                                    <TableHead className='text-center'>مقصود</TableHead>
                                    <TableHead className='text-center'>نمبر حواله</TableHead>
                                    <TableHead className='text-center'>تاریخ انتقال</TableHead>
                                    <TableHead className='text-center'>وضیعت</TableHead>
                                    <TableHead aria-label="باز کردن" />

                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransfers.length > 0 ? filteredTransfers.map((transfer, ind) =>
                                    <TableRow key={transfer.id} className="cursor-pointer transition-colors hover:bg-cyan-50/60 dark:hover:bg-cyan-950/20" onDoubleClick={() => router.get('/transfers/' + transfer.id)}>
                                        <TableCell className='text-center'>{ind + 1}</TableCell>
                                        <TableCell className='text-center'>{LocationTranslator(transfer.source.name)}</TableCell>
                                        <TableCell className='text-center' >{LocationTranslator(transfer.destination.name)}</TableCell>
                                        <TableCell className='text-center'>{transfer.reference_no}</TableCell>
                                        <TableCell className='text-center text-sm text-muted-foreground'>{new Date(transfer.transferred_at).toLocaleDateString('fa-AF')}</TableCell>
                                        <TableCell className={`text-center font-semibold ${getTransferStyle(transfer.status)} `}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger disabled={transfer.status !== 'suggested' || usePage().props.auth.role!=='factory_clerk'}>{getTransferStatus(transfer.status)}</DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={()=>handleTransferStatus(transfer,'completed')}>تکمیل شده</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={()=>handleTransferStatus(transfer,'cancelled')}>لغو شده</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ) : <TableRow>
                                    <TableCell colSpan={7}><p className="w-full p-10 text-center text-muted-foreground">موردی با این مشخصات پیدا نشد.</p></TableCell>
                                </TableRow>}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        <PageLinks links={transfers.links} />
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

export default TransferList