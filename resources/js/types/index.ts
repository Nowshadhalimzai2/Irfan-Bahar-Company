export type * from './auth';
export type * from './navigation';
export type * from './ui';

export type Role={
    id:number;
    name:"super_admin" | "admin" | "shop_clerk" | "factory_clerk";
}
export interface User{
    id:number;
    name:string;
    email:string;
    role:Role;

}