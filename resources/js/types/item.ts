import { Currency, Location, Supplier } from ".";

export interface GoodsReceipt{
    id:number;
    supplier: Supplier;
    location:Location;
    receipt_lines:GoodsReceiptLine[];
    reference_no:string;
    received_at:Date;
    notes?:string;
}
export interface GoodsReceiptLine{
    id:number;
    receipt:GoodsReceipt;
    item: Item;
    currency:Currency;
    quantity:number;
    unit_cost:number;
}

export interface Item{
    id:number;
    name:string;
    item_type: 'product' | 'raw_material' | 'packing';
    code:string;
    unit: 'kg' | 'gr' | 'ltr' | 'packet' | 'carton' | 'bundle' | 'pair' | 'unit' | 'bag';
    sku:string;
    default_sale_price:number;
    category:Category;
    product?:Product;
}

export type unitType = 'kg' | 'gr' | 'ltr' | 'packet' | 'carton' | 'bundle' | 'pair' | 'unit' | 'bag';

export interface Category{
    id:number;
    name:string;
}
export interface Product extends Item{
    item_id:number;
    item:Item;
    weight:number;
    per_pack:number;
    barcode:string;
    description:string;
}

export interface Transfer{
    id:number;
    source: Location;
    destination:Location;
    reference_no:string;
    transferred_at:Date;
    notes?:string;
    transfer_lines:TransferLine[];
}
export interface TransferLine{
    id:number;
    item: Item;
    quantity:number;
    unit_price:number;
}
