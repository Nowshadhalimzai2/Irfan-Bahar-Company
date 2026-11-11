import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, FileText, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

type SaleDetailLine = {
    id: number;
    item_name: string;
    item_code?: string | null;
    item_type?: string | null;
    unit?: string | null;
    unit_symbol?: string | null;
    quantity: number;
    conversion_factor: number;
    base_quantity: number;
    unit_price: number;
    line_total: number;
    discount_total: number;
    net_total: number;
};

type SalePayment = {
    id: number;
    number?: string | null;
    amount: number;
    method: string;
    reference?: string | null;
    paid_at?: string | null;
    notes?: string | null;
};

type SaleReturnLine = {
    item_name: string;
    unit?: string | null;
    quantity: number;
    base_quantity: number;
    unit_price: number;
    line_total: number;
    restock_action: 'restock' | 'none';
};

type SaleReturn = {
    id: number;
    number: string;
    status: string;
    reason?: string | null;
    location?: string | null;
    total: number;
    refund_amount: number;
    refund_method?: string | null;
    refund_reference?: string | null;
    received_at?: string | null;
    refunded_at?: string | null;
    notes?: string | null;
    lines: SaleReturnLine[];
};

type SaleDetail = {
    id: number;
    status: string;
    customer: { name: string; phone?: string | null; address?: string | null } | null;
    customer_name?: string | null;
    currency: string;
    location: { name: string; type: string } | null;
    sold_at?: string | null;
    created_at?: string | null;
    notes?: string | null;
    total: number;
    discount_total: number;
    after_discount_total: number;
    amount_paid: number;
    invoice: {
        id: number;
        number: string;
        status: string;
        issued_on?: string | null;
        due_on?: string | null;
        bill_to_name: string;
        bill_to_phone?: string | null;
        bill_to_address?: string | null;
        total: number;
    } | null;
    financial_summary: {
        original_total: number;
        return_total: number;
        refunded_amount: number;
        gross_paid: number;
        total: number;
        paid: number;
        due: number;
    };
    lines: SaleDetailLine[];
    payments: SalePayment[];
    returns: SaleReturn[];
};

interface Props {
    sale: SaleDetail;
}

const money = (amount: number, currency: string) =>
    `${Number(amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} ${currency}`;

const formatDate = (date?: string | null) =>
    date ? new Date(date).toLocaleString('fa-AF') : '—';

const statusLabels: Record<string, string> = {
    draft: 'پیش‌نویس',
    completed: 'تکمیل شده',
    cancelled: 'لغو شده',
    partially_returned: 'بازگشت جزئی',
    returned: 'بازگشت شده',
    issued: 'صادر شده',
    paid: 'پرداخت شده',
    partially_paid: 'پرداخت جزئی',
    partially_refunded: 'بازپرداخت جزئی',
    refunded: 'بازپرداخت شده',
    received: 'دریافت شده',
};

export default function Show({ sale }: Props) {
    const role = usePage().props.auth.role;
    const currency = sale.currency || 'AFG';
    const canReturn =
        role === 'shop_clerk' &&
        ['completed', 'partially_returned'].includes(sale.status);
    const date = sale.sold_at ?? sale.created_at;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'فروشات', href: '/sales' },
                { title: `فروش #${sale.id}`, href: `/sales/${sale.id}` },
            ]}
        >
            <Head title={`جزئیات فروش #${sale.id}`} />
            <main className="space-y-6 p-4 md:p-8" dir="rtl">
                <header className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">جزئیات کامل فروش</p>
                        <h1 className="mt-1 text-2xl font-bold">
                            {sale.invoice?.number ?? `فروش #${sale.id}`}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {sale.customer?.name ?? sale.customer_name ?? 'مشتری گذری'}
                            {' · '}
                            {formatDate(date)}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/sales/all">
                                <ArrowLeft className="size-4" />
                                برگشت به فروشات
                            </Link>
                        </Button>
                        {sale.invoice ? (
                            <Button variant="outline" asChild>
                                <Link href={`/sales/${sale.id}/invoice/print`}>
                                    <FileText className="size-4" />
                                    نمایش بل
                                </Link>
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    router.post(`/sales/${sale.id}/invoice`)
                                }
                            >
                                <FileText className="size-4" />
                                ایجاد بل
                            </Button>
                        )}
                        {canReturn && (
                            <Button asChild>
                                <Link href={`/sales/${sale.id}/returns/create`}>
                                    <RotateCcw className="size-4" />
                                    برگشت فروش
                                </Link>
                            </Button>
                        )}
                    </div>
                </header>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <SummaryCard label="وضعیت فروش" value={statusLabels[sale.status] ?? sale.status} />
                    <SummaryCard
                        label="مبلغ خالص فروش"
                        value={money(sale.after_discount_total, currency)}
                    />
                    <SummaryCard
                        label="مجموع اقلام برگشتی"
                        value={money(sale.financial_summary.return_total, currency)}
                    />
                    <SummaryCard
                        label="مجموع بازپرداخت"
                        value={money(sale.financial_summary.refunded_amount, currency)}
                    />
                    <SummaryCard
                        label="پرداخت‌شده پس از برگشت"
                        value={money(sale.financial_summary.paid, currency)}
                    />
                    <SummaryCard
                        label="باقی‌مانده"
                        value={money(sale.financial_summary.due, currency)}
                    />
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                    <InfoCard title="اطلاعات فروش">
                        <InfoRow label="مشتری" value={sale.customer?.name ?? sale.customer_name ?? 'مشتری گذری'} />
                        <InfoRow label="شماره تماس" value={sale.customer?.phone ?? '—'} />
                        <InfoRow label="آدرس" value={sale.customer?.address ?? '—'} />
                        <InfoRow label="موقعیت فروش" value={sale.location?.name ?? '—'} />
                        <InfoRow label="تاریخ فروش" value={formatDate(date)} />
                        <InfoRow label="ارز" value={currency} />
                        <InfoRow label="یادداشت" value={sale.notes || '—'} />
                    </InfoCard>
                    <InfoCard title="اطلاعات بل">
                        {sale.invoice ? (
                            <>
                                <InfoRow label="شماره بل" value={sale.invoice.number} />
                                <InfoRow label="وضعیت بل" value={statusLabels[sale.invoice.status] ?? sale.invoice.status} />
                                <InfoRow label="تاریخ صدور" value={formatDate(sale.invoice.issued_on)} />
                                <InfoRow label="تاریخ سررسید" value={formatDate(sale.invoice.due_on)} />
                                <InfoRow label="نام در بل" value={sale.invoice.bill_to_name} />
                                <InfoRow label="شماره تماس بل" value={sale.invoice.bill_to_phone ?? '—'} />
                                <InfoRow label="آدرس بل" value={sale.invoice.bill_to_address ?? '—'} />
                                <InfoRow label="مبلغ بل" value={money(sale.invoice.total, currency)} />
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                برای این فروش هنوز بل صادر نشده است؛ جزئیات فروش و پرداخت‌ها در همین صفحه نمایش داده می‌شود.
                            </p>
                        )}
                    </InfoCard>
                </section>

                <section className="space-y-3 rounded-xl border bg-card p-4">
                    <SectionHeading title="اقلام فروش" />
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className='text-center'>جنس</TableHead>
                                    <TableHead className='text-center'>کود</TableHead>
                                    <TableHead className='text-center'>مقدار فروخته‌شده</TableHead>
                                    <TableHead className='text-center'>مقدار پایه</TableHead>
                                    <TableHead className='text-center'>قیمت واحد فروش</TableHead>
                                    <TableHead className='text-center'>مجموع</TableHead>
                                    <TableHead className='text-center'>تخفیف</TableHead>
                                    <TableHead className='text-center'>خالص قلم</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sale.lines.map((line) => (
                                    <TableRow key={line.id}>
                                        <TableCell className='text-center'>
                                            <div className="font-medium">{line.item_name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {line.unit ?? '—'}
                                                {line.unit_symbol ? ` (${line.unit_symbol})` : ''}
                                            </div>
                                        </TableCell>
                                        <TableCell className='text-center'>{line.item_code ?? '—'}</TableCell>
                                        <TableCell className='text-center'>{line.quantity}</TableCell>
                                        <TableCell className='text-center'>{line.base_quantity}</TableCell>
                                        <TableCell className='text-center'>{money(line.unit_price, currency)}</TableCell>
                                        <TableCell className='text-center'>{money(line.line_total, currency)}</TableCell>
                                        <TableCell className='text-center'>{money(line.discount_total, currency)}</TableCell>
                                        <TableCell className='text-center'>{money(line.net_total, currency)}</TableCell>
                                    </TableRow>
                                ))}
                                {sale.lines.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                                            برای این فروش قلمی ثبت نشده است.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex flex-wrap justify-end gap-x-8 gap-y-2 border-t pt-4 text-sm">
                        <span>مجموع: <strong>{money(sale.total, currency)}</strong></span>
                        <span>تخفیف: <strong>{money(sale.discount_total, currency)}</strong></span>
                        <span>خالص: <strong>{money(sale.after_discount_total, currency)}</strong></span>
                    </div>
                </section>

                <section className="space-y-3 rounded-xl border bg-card p-4">
                    <SectionHeading title="پرداخت‌ها" />
                    {sale.payments.length ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className='text-center'>شماره پرداخت</TableHead>
                                        <TableHead className='text-center'>تاریخ</TableHead>
                                        <TableHead className='text-center'>روش</TableHead>
                                        <TableHead className='text-center'>مرجع</TableHead>
                                        <TableHead className='text-center'>مبلغ</TableHead>
                                        <TableHead className='text-center'>یادداشت</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sale.payments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className='text-center'>{payment.number ? <span className='hover:underline hover:text-blue-500 hover:cursor-pointer' onClick={()=>router.get(`/payments/${payment.id}/receipt`)}>{payment.number}</span> : `#${payment.id}`}</TableCell>
                                            <TableCell className='text-center'>{formatDate(payment.paid_at)}</TableCell>
                                            <TableCell className='text-center'>{payment.method}</TableCell>
                                            <TableCell className='text-center'>{payment.reference ?? '—'}</TableCell>
                                            <TableCell className='text-center'>{money(payment.amount, currency)}</TableCell>
                                            <TableCell className='text-center'>{payment.notes || '—'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {sale.amount_paid > 0
                                ? `پرداخت اولیه ثبت‌شده هنگام فروش: ${money(sale.amount_paid, currency)}`
                                : 'برای این فروش پرداختی ثبت نشده است.'}
                        </p>
                    )}
                </section>

                <section className="space-y-3 rounded-xl border bg-card p-4">
                    <SectionHeading title="برگشت‌های ثبت‌شده" />
                    {sale.returns.length ? (
                        sale.returns.map((saleReturn) => (
                            <article key={saleReturn.id} className="space-y-3 rounded-lg border p-4">
                                <div className="flex flex-wrap justify-between gap-3">
                                    <div>
                                        <h3 className="font-semibold">{saleReturn.number}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {statusLabels[saleReturn.status] ?? saleReturn.status}
                                            {' · '}
                                            {saleReturn.location ?? 'موقعیت ثبت‌نشده'}
                                            {' · '}
                                            {formatDate(saleReturn.received_at)}
                                        </p>
                                    </div>
                                    <div className="text-left text-sm">
                                        <p>مبلغ برگشت: <strong>{money(saleReturn.total, currency)}</strong></p>
                                        <p>بازپرداخت: <strong>{money(saleReturn.refund_amount, currency)}</strong></p>
                                    </div>
                                </div>
                                {saleReturn.reason && <p className="text-sm">دلیل: {saleReturn.reason}</p>}
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>جنس</TableHead>
                                                <TableHead>مقدار/واحد برگشتی</TableHead>
                                                <TableHead>مقدار پایه</TableHead>
                                                <TableHead>قیمت واحد</TableHead>
                                                <TableHead>مبلغ برگشتی</TableHead>
                                                <TableHead>موجودی</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {saleReturn.lines.map((line, index) => (
                                                <TableRow key={`${saleReturn.id}-${index}`}>
                                                    <TableCell>{line.item_name}</TableCell>
                                                    <TableCell>{line.quantity} {line.unit ?? ''}</TableCell>
                                                    <TableCell>{line.base_quantity}</TableCell>
                                                    <TableCell>{money(line.unit_price, currency)}</TableCell>
                                                    <TableCell>{money(line.line_total, currency)}</TableCell>
                                                    <TableCell>{line.restock_action === 'restock' ? 'به موجودی برگشت' : 'به موجودی اضافه نشد'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                {saleReturn.refund_amount > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        روش بازپرداخت: {saleReturn.refund_method ?? '—'}
                                        {saleReturn.refund_reference ? ` · مرجع: ${saleReturn.refund_reference}` : ''}
                                        {` · ${formatDate(saleReturn.refunded_at)}`}
                                    </p>
                                )}
                                {saleReturn.notes && <p className="text-sm">یادداشت: {saleReturn.notes}</p>}
                            </article>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">برای این فروش برگشتی ثبت نشده است.</p>
                    )}
                </section>
            </main>
        </AppLayout>
    );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-semibold">{value}</p>
        </div>
    );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-2 rounded-xl border bg-card p-4">
            <SectionHeading title={title} />
            {children}
        </section>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-wrap justify-between gap-2 border-b py-2 last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}

function SectionHeading({ title }: { title: string }) {
    return <h2 className="text-lg font-semibold">{title}</h2>;
}
