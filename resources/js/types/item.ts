import { Currency, Customer, Location, Supplier } from ".";

export interface GoodsReceipt {
    id: number;
    supplier: Supplier;
    location: Location;
    receipt_lines: GoodsReceiptLine[];
    reference_no: string;
    received_at: Date;
    notes?: string;
}
export interface GoodsReceiptLine {
    id: number;
    receipt: GoodsReceipt;
    item: Item;
    currency: Currency;
    quantity: number;
    unit_cost: number;
}

export interface Item {
    id: number;
    name: string;
    item_type: 'product' | 'raw_material' | 'packing';
    code: string;
    unit: 'kg' | 'gr' | 'ltr' | 'packet' | 'carton' | 'bundle' | 'pair' | 'unit' | 'bag';
    sku: string;
    default_sale_price: number;
    category: Category;
    product?: Product;
}

export type unitType = 'kg' | 'gr' | 'ltr' | 'packet' | 'carton' | 'bundle' | 'pair' | 'unit' | 'bag';

export interface Category {
    id: number;
    name: string;
}
export interface Product extends Item {
    item_id: number;
    item: Item;
    weight: number;
    per_pack: number;
    barcode: string;
    description: string;
}

export interface Transfer {
    id: number;
    source: Location;
    destination: Location;
    reference_no: string;
    transferred_at: Date;
    notes?: string;
    transfer_lines: TransferLine[];
}
export interface TransferLine {
    id: number;
    item: Item;
    quantity: number;
    unit_price: number;
}

export interface Sale {
    id: number;

    customer?: Customer;
    customer_name?: string;
    created_by: string;

    status: 'draft' | 'completed' | 'cancelled' | 'partially_returned' | 'returned';
    currency_id: Currency;

    total: number;
    discount_total: number;
    after_discount_total: number;
    amount_paid: number;

    sold_at: Date;
    notes?: string;
}

export interface SaleLine {
    id: number;
    sale: Sale;

    item: Item;
    unit: 'kg' | 'gr' | 'ltr' | 'packet' | 'carton' | 'bundle' | 'pair' | 'unit' | 'bag';
    unit_cost: number;

    quantity: number;
    unit_price: number;
    discount: number;
    discount_total: number;
    line_total: number;
}

export interface Invoice {
    id: number;
    sale: Sale;
    payments: Payment[];

    invoice_number: string;
    status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'over_due' | 'partially_refunded' | 'refunded';

    issued_on: Date;
    due_on: Date;
    paid_at?: Date;

    bill_to_name: string;
    bill_to_address?: string;
    bill_to_phone?: string;

    currency: string;
    subtotal: number;
    discount_total: number;
    total: number;
    pdf_path?: string;
    notes?: string;
}

export interface Payment {
    id: number;
    invoice: Invoice;
    amount: number;
    method: "cash" | 'bank_transfer' | "office" | "teller";
    reference_no?: string;
    paid_at: Date;
    notes?: string;
}

export interface SaleReturn {
    id: number;
    sale: Sale;
    invoice: Invoice;
    created_by: string;
    return_no: string;
    status: string;
    reason: string;
    currency: "AFG" | "PKR" | "USD";
    total: number;
    refund_amount: number;
    refund_method: "cash" | "office" | "bank_transfer" | "teller";
    refund_reference_no: string;

    notes?: string;
}

export interface SaleReturnLine {
    id: number;
    sale_return: SaleReturn;
    sale_line: SaleLine;
    item: Item;
    quantity: number;
    unit_price: number;
    line_total: number;
    condition: string;
    restock_action: string;
    notes?: string;
}



