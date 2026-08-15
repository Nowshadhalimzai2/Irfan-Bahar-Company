import { Currency } from 'lucide-react';
import { Item, Product } from './item';

export type * from './auth';
export type * from './navigation';
export type * from './ui';

export type Role = {
    id: number;
    name: "super_admin" | "admin" | "shop_clerk" | "factory_clerk";
}
export interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
    status: boolean;

}

export interface Employee {
    id: number;
    salaries: Salary[];
    attendances: Attendance[];
    name: string;
    f_name: string;
    phone: string;
    position: 'clerk' | 'worker' | 'shopkeeper' | 'machine_operator' | 'other';
    recruitment_date: Date;
    address: string;
    salary: number;
    status: boolean;
    shift: "day" | "night"
    today_attendance?: {
        is_present: boolean;
    };
    present_days:number;
    absent_days:number;

}

export interface Salary {
    id: number;
    employee_id: number;
    amount: number;
    payment_date: Date;
}

export interface Attendance {
    id: number;
    employee_id: number;
    is_present: boolean;
    date: Date;
}
export interface Currency{
    id:number;
    name: "AFG" | "USD" | "PKR";
}
export interface Account{
    id:number;
    amount:number;
    currency:Currency;
}

export interface Expense{
    id:number;
    amount:number;
    description:string;
    currency:Currency;
    date:Date;
    is_editable:boolean;
}

//  ======================  ONE GROUP =======================

export interface Supplier{
    id:number;
    name:string;
    phone?:string;
    email?:string;
    address:string;
    status:boolean;
}

export interface Location{
    id:number;
    name:string;
    address:string;
    type: 'warehouse' | 'shop' | 'factory' | 'office' | 'other';
    is_active:boolean;
}

export interface InventoryBalance{
    id:number;
    location:Location;
    item:Item;
    quantity_on_hand:number;
    reserved:number;
    updated_at: Date;
}


export interface InventoryMovement{
    id:number;
    location:Location;
    item:Item;
    quantity:number;
    movement_type: 'receipt' | 'transferred_out' | 'transferred_in' | 'production_consumption' | 'production_output' | 'sale' | 'sale_return' | 'adjustment_in' | 'adjustment_out';
    reference_no:string;
    occured_at: Date;
}

export interface BOM{
    id:number;
    formula_name:string;
    product:Product;
    bom_lines: BOMLine[];
    min_exp_qty:number;
    max_exp_qty:number;
    is_active:boolean;
}
export interface BOMLine{
    id:number;
    item_id:number;
    item:Item;
    required_quantity:number;
}