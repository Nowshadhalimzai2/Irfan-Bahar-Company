import React from "react";
import "./thermal-receipt.css";
import { usePage } from "@inertiajs/react";

export type ReceiptItem = {
    itemName: string;
    quantity: number;
    unit_price: number;
    unit: string;
    code: string;
};

export type ReceiptData = {
    storeName: string;
    status: string;
    tagline?: string;
    address?: string;
    phone?: string;
    taxNumber?: string;
    invoiceNumber: string;
    date: string;
    cashier: string;
    customer?: string;
    items: ReceiptItem[];
    discount?: number;
    tax?: number;
    paid: number;
    paymentMethod: string;
    currency?: string;
};


type ThermalReceiptProps = {
    receipt: ReceiptData;
    onPrint?: () => void;
    showPrintButton?: boolean;
};

const money = (value: number, currency: string) =>
    `${value.toLocaleString()} ${currency}`;

export default function ThermalReceipt({
    receipt,
    onPrint,
    showPrintButton = true,
}: ThermalReceiptProps) {
    const { logo } = usePage().props;

    const currency = receipt.currency ?? "AFN";
    const subtotal = receipt.items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0,
    );
    const discount = receipt.discount ?? 0;
    const tax = receipt.tax ?? 0;
    const grandTotal = subtotal - discount + tax;
    const change = Math.max(grandTotal - receipt.paid, 0);

    const printReceipt = () => {
        if (onPrint) {
            onPrint();
            return;
        }

        window.print();
    };

    return (
        <>
            {showPrintButton && (
                <div className="thermal-receipt-toolbar">
                    <button type="button" onClick={printReceipt}>
                        Print invoice
                    </button>
                </div>
            )}

            <section className="thermal-receipt" aria-label={`Invoice ${receipt.invoiceNumber}`}>
                <header className="thermal-receipt__center">
                    <h1 className="thermal-receipt__store-name">{receipt.storeName}</h1>
                    {receipt.tagline && <div className="thermal-receipt__muted">{receipt.tagline}</div>}
                    {(receipt.address || receipt.phone) && (
                        <div className="thermal-receipt__small">
                            {[receipt.address, receipt.phone].filter(Boolean).join(" · ")}
                        </div>
                    )}
                    {receipt.taxNumber && (
                        <div className="thermal-receipt__small">TIN: {receipt.taxNumber}</div>
                    )}
                </header>

                <div className="thermal-receipt__rule" />

                <table className="thermal-receipt__meta relative">
                    <tbody>
                        <tr><td>Invoice</td><td>{receipt.invoiceNumber}</td></tr>
                        <tr><td>Date</td><td>{receipt.date}</td></tr>
                        <tr><td>Cashier</td><td>{receipt.cashier}</td></tr>
                        {receipt.customer && <tr><td>Customer</td><td>{receipt.customer}</td></tr>}
                        <tr><td>Status</td><td className="font-bold">{receipt.status}</td></tr>
                    </tbody>
                    <img src={logo as string} className="absolute top-40 z-0 -rotate-45 opacity-15 left-20 w-30 h-38" />
                    
                </table>

                <div className="thermal-receipt__rule" />

                <table className="thermal-receipt__items">
                    <thead>
                        <tr><th>Item</th><th>Qty</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                        {receipt.items.map((item) => (
                            <tr key={`${item.itemName}-${item.unit_price}`}>
                                <td >
                                    <span className="thermal-receipt__item-name">{item.itemName}</span>
                                    <span className="thermal-receipt__item-detail block">
                                        {item.code}
                                    </span>
                                </td>
                                <td>{item.quantity}{item.unit}</td>
                                <td className="">
                                    <span className="thermal-receipt__item-name">
                                        {item.quantity * item.unit_price}
                                    </span>
                                    <span className="thermal-receipt__item-detail block">
                                        {item.quantity} × {item.unit_price}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="thermal-receipt__rule" />

                <table className="thermal-receipt__totals">
                    <tbody>
                        <tr><td>Subtotal</td><td>{money(subtotal, currency)}</td></tr>
                        <tr><td>Discount</td><td>-{money(discount, currency)}</td></tr>
                        {/* <tr><td>Tax</td><td>{money(tax, currency)}</td></tr> */}
                        <tr className="thermal-receipt__grand-total">
                            <td>Grand total</td><td>{money(grandTotal, currency)}</td>
                        </tr>
                        <tr><td>Paid</td><td>{money(receipt.paid, currency)}</td></tr>
                        <tr><td>Change</td><td>{money(change, currency)}</td></tr>
                    </tbody>
                </table>

                <footer className="thermal-receipt__footer">
                    <div>Payment: {receipt.paymentMethod}</div>
                    <div className="thermal-receipt__rule" />
                    <div>Thank you for shopping with us!</div>
                    <div className="thermal-receipt__small">Please keep this receipt for your records.</div>
                </footer>
            </section>
        </>
    );
}