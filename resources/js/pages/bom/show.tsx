import { getDariCategory, getDariItemType, getDariItemUnit } from '@/components/location-translator';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BOM } from '@/types';
import { router } from '@inertiajs/core';
import { Link } from '@inertiajs/react';
import { CheckCircle2, Minus, Pencil, Plus, Printer, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface Props {
    bom: BOM;
}

const formatNumber = (value: number | string) =>Number(value).toFixed(3);
    // new Intl.NumberFormat('fa-AF', { maximumFractionDigits: 3 }).format(Number(value) || 0);

const Show = ({ bom }: Props) => {
    const minQuantity = Number(bom.min_exp_qty) || 0;
    const maxQuantity = Number(bom.max_exp_qty) || minQuantity;
    const [quantity, setQuantity] = useState(Math.max(minQuantity, (minQuantity + maxQuantity) / 2));

    const calculatedLines = useMemo(
        () =>
            (bom.bom_lines ?? []).map((line) => ({
                ...line,
                calculatedQuantity: maxQuantity > 0
                    ? (quantity * Number(line.required_quantity)) / maxQuantity
                    : 0,
            })),
        [bom.bom_lines, maxQuantity, quantity],
    );

    const updateQuantity = (value: number) => {
        setQuantity(Math.min(maxQuantity, Math.max(minQuantity, value)));
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'فورموله‌ها', href: '/boms' },
                { title: bom.formula_name, href: `/boms/${bom.id}` },
            ]}
        >
            <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8" dir="rtl">
                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <div className="bg-linear-to-l from-primary/15 via-background to-background p-5 sm:p-7">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                        فورموله #{bom.id}
                                    </span>
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${bom.is_active !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                                        {bom.is_active !== false ? 'فعال' : 'غیرفعال'}
                                    </span>
                                </div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{bom.formula_name}</h1>
                                <p className="mt-2 text-sm text-muted-foreground">ترکیب مواد لازم برای تولید {getDariCategory(bom.category?.name ?? 'محصول')}</p>
                            </div>
                            <div className="rounded-xl border bg-background/80 px-5 py-4 shadow-sm">
                                <p className="text-xs text-muted-foreground">دسته‌بندی محصول</p>
                                <p className="mt-1 font-semibold text-foreground">{getDariCategory(bom.category?.name ?? 'نامشخص')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 border-t p-4 sm:grid-cols-3 sm:p-6">
                        <SummaryCard label="حداقل تولید" value={minQuantity} />
                        <SummaryCard label="حداکثر تولید" value={maxQuantity} />
                        <SummaryCard label="تعداد مواد" value={`${bom.bom_lines?.length ?? 0} قلم`} />
                    </div>
                </section>

                <section className="mt-5 overflow-hidden rounded-2xl border bg-card shadow-sm" id='printArea'>
                    <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">محاسبه مواد</h2>
                            <p className="mt-1 text-sm text-muted-foreground">مقدار تولید را تعیین کنید تا مصرف مواد محاسبه شود.</p>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-2">
                            <Button type="button" variant="outline" size="icon" onClick={() => updateQuantity(quantity - 1)} disabled={quantity <= minQuantity}>
                                <Minus className="size-4" />
                            </Button>
                            <Input
                                type="number"
                                min={minQuantity}
                                max={maxQuantity}
                                step="0.01"
                                value={quantity}
                                onChange={(event) => updateQuantity(Number(event.target.value))}
                                className="h-9 w-28 bg-background text-center font-bold"
                            />
                            <Button type="button" variant="outline" size="icon" onClick={() => updateQuantity(quantity + 1)} disabled={quantity >= maxQuantity}>
                                <Plus className="size-4" />
                            </Button>
                            <span className="px-1 text-xs text-muted-foreground">واحد تولید</span>
                        </div>
                    </div>

                    <div className="border-b bg-primary/5 px-5 py-3 text-sm text-primary">
                        برای تولید <strong>{formatNumber(quantity)}</strong> واحد، مواد زیر مورد نیاز است.
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="w-16 text-center">#</TableHead>
                                    <TableHead>جنس</TableHead>
                                    <TableHead className="text-center">مقدار مورد نیاز</TableHead>
                                    <TableHead className="text-center">واحد</TableHead>
                                    <TableHead className="text-center">نوع جنس</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {calculatedLines.length > 0 ? calculatedLines.map((line, index) => (
                                    <TableRow key={line.id ?? line.item_id ?? index}>
                                        <TableCell className="text-center text-muted-foreground">{formatNumber(index + 1)}</TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-foreground">{line.item?.name ?? 'نامشخص'}</p>
                                                <p className="text-xs text-muted-foreground">{line.item?.code ?? 'بدون کد'}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-primary">{formatNumber(line.calculatedQuantity)}</TableCell>
                                        <TableCell className="text-center text-sm text-muted-foreground">{getDariItemUnit(line.item?.unit ?? 'unit')}</TableCell>
                                        <TableCell className="text-center">
                                            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                                                {getDariItemType(line.item?.item_type ?? '')}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">هیچ ماده‌ای برای این فورموله ثبت نشده است.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-end border-t p-4">
                        <Button type="button" variant="outline" className="gap-2" onClick={() => window.print()}>
                            <Printer className="size-4" />
                            چاپ فورموله
                        </Button>
                    </div>
                </section>

                <section className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Pencil className="size-4" /></div>
                            <div><h3 className="font-semibold">ویرایش فورموله</h3><p className="text-sm text-muted-foreground">مواد یا ظرفیت تولید را تغییر دهید.</p></div>
                        </div>
                        <Link href={`/boms/${bom.id}/edit`} className={buttonVariants({ variant: 'secondary' })}>ویرایش فورموله</Link>
                    </div>
                    <StatusCard bomId={bom.id} isActive={bom.is_active !== false} />
                </section>
            </main>
        </AppLayout>
    );
};

const SummaryCard = ({ label, value }: { label: string; value: number | string }) => (
    <div className="rounded-xl bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-bold text-foreground">{typeof value === 'number' ? formatNumber(value) : value}</p>
    </div>
);

const StatusCard = ({ bomId, isActive }: { bomId: number; isActive: boolean }) => (
    <div className={`rounded-2xl border p-5 shadow-sm ${isActive ? 'border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20' : 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20'}`}>
        <div className="mb-4 flex items-center gap-3">
            <div className={`flex size-9 items-center justify-center rounded-lg ${isActive ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {isActive ? <ShieldAlert className="size-4" /> : <ShieldCheck className="size-4" />}
            </div>
            <div>
                <h3 className="font-semibold">{isActive ? 'غیرفعال‌سازی فورموله' : 'فعال‌سازی فورموله'}</h3>
                <p className="text-sm text-muted-foreground">وضعیت استفاده در سفارش‌های جدید را تغییر دهید.</p>
            </div>
        </div>

        <Dialog>
            <DialogTrigger asChild>
                <Button variant={isActive ? 'destructive' : 'secondary'} className="gap-2">
                    {isActive ? <Trash2 className="size-4" /> : <CheckCircle2 className="size-4" />}
                    {isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
                <DialogTitle>{isActive ? 'آیا فورموله غیرفعال شود؟' : 'آیا فورموله فعال شود؟'}</DialogTitle>
                <p className="text-sm text-muted-foreground">این تغییر روی استفاده از فورموله در سفارش‌های جدید اثر می‌گذارد.</p>
                <DialogFooter className="gap-2">
                    <DialogClose asChild><Button variant="outline">انصراف</Button></DialogClose>
                    <Button variant={isActive ? 'destructive' : 'secondary'} onClick={() => router.put(`/boms/${bomId}/block`)}>
                        تأیید
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
);

export default Show;
