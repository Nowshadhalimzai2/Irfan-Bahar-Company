import { Currency } from 'lucide-react';

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