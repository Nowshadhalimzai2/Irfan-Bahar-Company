import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";

import {
    Barcode,
    Box,
    Boxes,
    ClipboardList,
    Hash,
    Scale,
    ShoppingCart,
} from 'lucide-react';

import { BadgeDollarSign, Eye, Warehouse } from "lucide-react";
import { getDariCurrency, getDariItemUnit } from "./location-translator";
import { InventoryBalance } from "@/types";
import { Button } from "radix-ui/toolbar";
import React from "react";

type Balance = {
    location_id: number;
    quantity_on_hand: number;
    reserved: number;
};


type Item = {
    id: number;
    name: string;
    code: string;
    sku: string;
    unit: string;
    default_sale_price: number;
    product?: { barcode: string, weight: number, per_pack: number };
    inventory_balances?: Balance[];
};
interface Props {
    item: Item;
    trigger: React.ReactNode;
    quantity?: number;
}
const ItemDrawer = ({ item, trigger, quantity }: Props) => {
    const currency = { id: 1, name: 'AFG' };
    // const quantity = 1;
    const details = [
        {
            label: 'کد جنس',
            value: item.code || '—',
            icon: Hash,
        },
        {
            label: 'SKU',
            value: item.sku || '—',
            icon: ClipboardList,
        },
        {
            label: 'بارکد',
            value: item.product?.barcode || '—',
            icon: Barcode,
        },
        {
            label: 'واحد',
            value: getDariItemUnit(item.unit),
            icon: Box,
        },
        {
            label: 'وزن',
            value: item.product?.weight,
            icon: Scale,
            visible: item.product?.weight !== undefined,
        },
        {
            label: 'تعداد در بسته',
            value: item.product?.per_pack,
            icon: Boxes,
            visible: item.product?.per_pack !== undefined,
        },
    ];
    const totalInventory =
        item.inventory_balances?.reduce(
            (acc, balance) => acc + balance.quantity_on_hand,
            0
        ) ?? 0;
    return (
        <div>
            {/* ============================================== ITEM DRAWER */}
            <Drawer >
                <DrawerTrigger asChild>
                    <button
                        type="button"
                        title="توضیحات جنس بیبین"

                        className="p-2 text-sky-400 hover:text-sky-600"
                    >
                        {trigger}
                    </button>
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>{item.name}</DrawerTitle>
                        <DrawerDescription>
                            جزئیات کامل جنس
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                        <div dir="rtl" className="p-3 sm:p-4">
                            <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
                                {/* Compact summary */}
                                <div className={`grid grid-cols-2 gap-px bg-border/60 ${quantity ? "sm:grid-cols-4":"sm:grid-cols-3"}`}>
                                    <div className="bg-linear-to-br from-primary to-primary/80 p-3 text-primary-foreground">
                                        <div className="mb-1 flex items-center gap-2 text-primary-foreground/75">
                                            <BadgeDollarSign className="size-4" />
                                            <span className="text-[11px] font-medium">
                                                قیمت واحد
                                            </span>
                                        </div>

                                        <p className="truncate text-base font-black tabular-nums">
                                            {item.default_sale_price.toLocaleString()}
                                            <span className="mr-1 text-[10px] font-medium">
                                                {getDariCurrency(currency.name)}
                                            </span>
                                        </p>
                                    </div>
                                   
                                    <div className="bg-background p-3">
                                        <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                                            <Warehouse className="size-4" />
                                            <span className="text-[11px] font-medium">
                                                موجودی شرکت
                                            </span>
                                        </div>

                                        <p className="text-base font-black tabular-nums text-foreground">
                                            {totalInventory.toLocaleString()}
                                        </p>
                                    </div>

                                   {quantity && <div className="bg-background p-3">
                                        <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                                            <ShoppingCart className="size-4" />
                                            <span className="text-[11px] font-medium">
                                                تعداد انتخاب‌شده
                                            </span>
                                        </div>

                                        <p className="text-base font-black tabular-nums text-foreground">
                                            {quantity}
                                        </p>
                                    </div>}

                                    <div className="bg-background p-3">
                                        <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                                            <BadgeDollarSign className="size-4" />
                                            <span className="text-[11px] font-medium">
                                                قیمت فروش
                                            </span>
                                        </div>

                                        <p className="truncate text-sm font-black tabular-nums text-foreground">
                                            {item.default_sale_price.toLocaleString()}
                                            <span className="mr-1 text-[10px] font-medium text-muted-foreground">
                                                {currency.name}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* Details grid */}
                                <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
                                    {details
                                        .filter((detail) => detail.visible !== false)
                                        .map((detail) => {
                                            const Icon = detail.icon;

                                            return (
                                                <div
                                                    key={detail.label}
                                                    className="group min-w-0 rounded-2xl border border-border/60 bg-muted/30 p-3 transition-colors hover:border-primary/30 hover:bg-primary/4"
                                                >
                                                    <div className="flex min-w-0 items-center gap-2.5">
                                                        <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-background text-primary shadow-sm ring-1 ring-border/60 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                                            <Icon className="size-4" strokeWidth={2} />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <span className="block truncate text-[10px] font-medium text-muted-foreground">
                                                                {detail.label}
                                                            </span>

                                                            <p className="mt-1 truncate text-xs font-bold tabular-nums text-foreground">
                                                                {detail.value ?? '—'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <button type="button">Close</button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    )
}

export default ItemDrawer