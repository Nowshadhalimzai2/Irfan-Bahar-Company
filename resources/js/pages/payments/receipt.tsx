import { Head, usePage } from '@inertiajs/react';
import { getDariCurrency } from '@/components/location-translator';
import AppLayout from '@/layouts/app-layout';
import '@/components/thermal-receipt.css';

type ReceiptPageProps = {
    storeName: string;
    payment: {
        receiptNumber: string;
        amount: number;
        method: string;
        reference?: string | null;
        paidAt: string;
        notes?: string | null;
        cashier: string;
    };
    invoice: {
        id: number;
        number: string;
        issuedOn: string;
        status: string;
        customer?: string | null;
        phone?: string | null;
        currency?: string | null;
        total: number;
        paid: number;
        remaining: number;
    };
};

const paymentMethodLabels: Record<string, string> = {
    cash: 'نقدی',
    card: 'کارت بانکی',
    bank_transfer: 'حواله بانکی',
    other: 'سایر',
};

function formatMoney(value: number, currency?: string | null) {
    const amount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);

    return `${amount} ${getDariCurrency(currency || '')}`.trim();
}

export default function PaymentReceipt({
    storeName,
    payment,
    invoice,
}: ReceiptPageProps) {
    const printReceipt = () => window.print();
    const currency = invoice.currency;
    const method = paymentMethodLabels[payment.method] ?? payment.method;
    const { logo } = usePage().props;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'پرداخت‌ها', href: '/payments' },
                {
                    title: `پرداخت‌ها ${invoice.number}`,
                    href: `/sales/invoice/${invoice.id}/payments`,
                },
                {
                    title: `رسید ${payment.receiptNumber}`,
                    href: `/payments/${payment.receiptNumber}/receipt`,
                },
            ]}
        >
            <Head title={`رسید ${payment.receiptNumber}`} />

            <div className="thermal-receipt-toolbar">
                <button type="button" onClick={printReceipt}>
                    Print receipt
                </button>
            </div>

            <section
                // id="printArea"
                className="thermal-receipt"
                aria-label={`Receipt ${payment.receiptNumber}`}
            >
                <header className="thermal-receipt__center">
                    <h1 className="thermal-receipt__store-name">{storeName}</h1>
                    <div className="thermal-receipt__muted">Payment receipt</div>
                </header>

                <div className="thermal-receipt__rule" />

                <table className="thermal-receipt__meta">
                    <tbody>
                        <tr>
                            <td>Receipt</td>
                            <td>{payment.receiptNumber}</td>
                        </tr>
                        <tr>
                            <td>Invoice</td>
                            <td>{invoice.number}</td>
                        </tr>
                        {invoice.issuedOn && (
                            <tr>
                                <td>Invoice date</td>
                                <td>{invoice.issuedOn}</td>
                            </tr>
                        )}
                        <tr>
                            <td>Payment date</td>
                            <td>{payment.paidAt || '—'}</td>
                        </tr>
                        <tr>
                            <td>Cashier</td>
                            <td>{payment.cashier || '—'}</td>
                        </tr>
                        <tr>
                            <td>Customer</td>
                            <td>{invoice.customer || 'Walk-in customer'}</td>
                        </tr>
                        {invoice.phone && (
                            <tr>
                                <td>Phone</td>
                                <td>{invoice.phone}</td>
                            </tr>
                        )}
                        <tr>
                            <td>Currency</td>
                            <td>{invoice.currency || 'AFG'}</td>
                        </tr>
                    </tbody>
                </table>

                <div className="thermal-receipt__rule" />

                <table className="thermal-receipt__items">
                    <thead>
                        <tr className=''>
                            <th>Payment amount</th>
                            <th>Invoice total</th>
                            <th>Balance due</th>
                        </tr>
                    </thead>
                    <tbody className='relative'>
                        <tr>
                            <td>{payment.amount}</td>
                            <td>{invoice.total}</td>
                            <td>{(invoice.remaining).toFixed(2)}</td>
                        </tr>
                        <img src={logo as string} className="absolute top-0 z-0 -rotate-45 opacity-15 left-20 w-30 h-38" />

                    </tbody>
                </table>

                <div className="thermal-receipt__rule" />

                <table className="thermal-receipt__totals">
                    <tbody>
                        <tr>
                            <td>Total paid to date</td>
                            <td>{formatMoney(invoice.paid, currency)}</td>
                        </tr>
                        <tr>
                            <td>Payment method</td>
                            <td>{method}</td>
                        </tr>
                        {payment.reference && (
                            <tr>
                                <td>Reference</td>
                                <td>{payment.reference}</td>
                            </tr>
                        )}
                        {payment.notes && (
                            <tr>
                                <td>Notes</td>
                                <td>{payment.notes}</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <footer className="thermal-receipt__footer">
                    <div className="thermal-receipt__rule" />
                    <div>Thank you for your payment.</div>
                    <div className="thermal-receipt__small">
                        Please keep this receipt for your records.
                    </div>
                    <div className="thermal-receipt__totals flex flex-col">
                        <small>
                            Phone:+93-783-070-940
                        </small>
                        <small>
                            Email:nowshadhalimzai@gmail.com
                        </small>
                    </div>
                    <div className="thermal-receipt__small">
                        Address:Sabzabad, Do-Saraka, Nangarhar
                    </div>
                </footer>
            </section>
        </AppLayout>
    );
}