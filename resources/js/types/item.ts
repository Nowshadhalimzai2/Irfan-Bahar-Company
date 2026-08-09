import { Currency, Location, Supplier } from ".";

export interface GoodsReceipt{
    id:number;
    supplier: Supplier;
    location:Location;
    receiptLines:GoodsReceiptLine[];
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
    unit: 'kg' | 'gr' | 'ltr';
    sku:string;
    default_sale_price:number;
    category:Category;
    product?:Product;
}
export interface Category{
    id:number;
    name:string;
}
export interface Product extends Item{
    item_id:number;
    weight:number;
    per_pack:number;
    barcode:string;
    description:string;
}