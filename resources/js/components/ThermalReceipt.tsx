import React from "react";
import "./thermal-receipt.css";
import { getDariItemUnit } from "./location-translator";

export type ReceiptItem = {
    itemName: string;
    quantity: number;
    unit_price: number;
    unit: string;
    code:string;
};

export type ReceiptData = {
    storeName: string;
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

export const dummyReceipt: ReceiptData = {
    storeName: "KABUL MART",
    tagline: "Quality goods, fair prices",
    address: "Shahr-e-Naw, Kabul",
    phone: "+93 700 123 456",
    taxNumber: "1000123456",
    invoiceNumber: "INV-2026-0042",
    date: "24 Sep 2026 15:42",
    cashier: "Ahmad",
    customer: "Walk-in customer",
    items: [
        {code:"code02", unit: 'Pair', itemName: "Basmati Rice 5kg", quantity: 1, unit_price: 480 },
        {code:"code02", unit: 'Pair', itemName: "Cooking Oil 2L", quantity: 2, unit_price: 275 },
        {code:"code02", unit: 'Pair', itemName: "Green Tea 250g", quantity: 1, unit_price: 160 },
        {code:"code02", unit: 'Pair', itemName: "Laundry Soap", quantity: 3, unit_price: 55 },
    ],
    discount: 55,
    tax: 0,
    paid: 1300,
    paymentMethod: "Cash",
    currency: "AFN",
};

type ThermalReceiptProps = {
    receipt?: ReceiptData;
    onPrint?: () => void;
    showPrintButton?: boolean;
};

const money = (value: number, currency: string) =>
    `${value.toLocaleString()} ${currency}`;

export default function ThermalReceipt({
    receipt = dummyReceipt,
    onPrint,
    showPrintButton = true,
}: ThermalReceiptProps) {

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

                <table className="thermal-receipt__meta">
                    <tbody>
                        <tr><td>Invoice</td><td>{receipt.invoiceNumber}</td></tr>
                        <tr><td>Date</td><td>{receipt.date}</td></tr>
                        <tr><td>Cashier</td><td>{receipt.cashier}</td></tr>
                        {receipt.customer && <tr><td>Customer</td><td>{receipt.customer}</td></tr>}
                    </tbody>
                </table>

                <div className="thermal-receipt__rule" />

                <table className="thermal-receipt__items">
                    <thead>
                        <tr><th>Item</th><th>Qty</th><th>unit</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                        {receipt.items.map((item) => (
                            <tr key={`${item.itemName}-${item.unit_price}`}>
                                <td>
                                    <span className="thermal-receipt__item-name">{item.itemName}</span>
                                    <span className="thermal-receipt__item-detail">
                                       {item.code}
                                    </span>
                                </td>
                                <td>{item.quantity}</td>
                                <td>{getDariItemUnit(item.unit)}</td>
                                <td>
                                    {item.quantity * item.unit_price}
                                    <span className="thermal-receipt__item-detail">
                                        {item.quantity} × {money(item.unit_price, currency)}
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