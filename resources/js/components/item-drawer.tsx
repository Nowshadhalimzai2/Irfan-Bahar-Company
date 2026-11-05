import {
    BadgeDollarSign,
    Barcode,
    Box,
    Boxes,
    ClipboardList,
    Hash,
    Scale,
    ShoppingCart,
    Warehouse,
} from 'lucide-react';
import React from "react";
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
import type { Category, Item as ItemModel } from "@/types/item";
import { getDariCurrency, getDariItemUnit } from "./location-translator";

type Balance = {
    quantity_on_hand: number;
    reserved: number;
};


type Item = ItemModel & {
    inventory_balances?: Balance[];
    item_type:'product'|'raw_material'|'packing';
    category:Category;

};
interface Props {
    item: Item ;
    trigger: React.ReactNode;
    quantity?: number;
}
const ItemDrawer = ({ item, trigger, quantity }: Props) => {
    
    const currency = { id: 1, name: 'AFG' };
    const activeUnits = item.units?.filter((unit) => unit.is_active) ?? [];
    const baseUnit = item.base_unit ?? activeUnits.find((unit) => unit.conversion_to_base === 1);
    const baseSellingPrice = Number(baseUnit?.selling_price ?? item.default_sale_price);
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
            value: baseUnit?.barcode || '—',
            icon: Barcode,
        },
        {
            label: 'واحد',
            value: baseUnit?.name ?? getDariItemUnit(item.unit),
            icon: Box,
        },
        {
            label: 'تعداد واحدهای فعال',
            value: activeUnits.length,
            icon: Boxes,
        },
        {
            label: 'وزن',
            value: item.product?.weight,
            icon: Scale,
            visible: item.product?.weight !== undefined,
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
            <Drawer>
                <DrawerTrigger asChild>
                    <button
                        type="button"
                        title="مشاهده جزئیات جنس"
                        aria-label={`مشاهده جزئیات ${item.name}`}
                        className="rounded-lg text-right outline-none transition hover:text-white/80 focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                        {trigger}
                    </button>
                </DrawerTrigger>
                <DrawerContent className="max-h-[90vh] overflow-hidden rounded-t-3xl border-border/70 shadow-2xl">
                    <DrawerHeader dir="rtl" className="border-b border-border/60 px-5 pb-4 pt-5 text-right">
                        <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            <Box className="size-3.5" />
                            {item.code || item.sku}
                        </div>
                        <DrawerTitle className="text-xl font-black tracking-tight">{item.name}</DrawerTitle>
                        <DrawerDescription className="text-xs">
                            مشخصات، موجودی و واحدها و قیمت‌های ثبت‌شده
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                        <div dir="rtl" className="mx-auto w-full max-w-5xl space-y-4 p-4 sm:p-6">
                            <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
                                {/* Compact summary */}
                                <div className={`grid grid-cols-2 gap-px bg-border/60 ${quantity !== undefined ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                                    <div className="bg-linear-to-br from-primary to-primary/80 p-4 text-primary-foreground">
                                        <div className="mb-1 flex items-center gap-2 text-primary-foreground/75">
                                            <BadgeDollarSign className="size-4" />
                                            <span className="text-[11px] font-medium">
                                                قیمت واحد
                                            </span>
                                        </div>

                                        <p className="truncate text-base font-black tabular-nums">
                                            {baseSellingPrice.toLocaleString()}
                                            <span className="mr-1 text-[10px] font-medium">
                                                {getDariCurrency(currency.name)}
                                            </span>
                                        </p>
                                    </div>
                                   
                                    <div className="bg-background p-4">
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

                                   {quantity !== undefined && <div className="bg-background p-4">
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

                            {item.product?.description && (
                                <section className="rounded-3xl border border-border/60 bg-card p-4 shadow-sm">
                                    <h3 className="mb-2 text-sm font-bold text-foreground">توضیحات جنس</h3>
                                    <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                                        {item.product.description}
                                    </p>
                                </section>
                            )}

                            <section className="rounded-3xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground">واحدها و قیمت‌های ثبت‌شده</h3>
                                        <p className="mt-1 text-xs text-muted-foreground">قیمت‌ها بر اساس واحد انتخاب‌شده</p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                        {activeUnits.length} واحد فعال
                                    </span>
                                </div>
                                {activeUnits.length > 0 ? (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {activeUnits.map((unit) => (
                                            <article
                                                key={unit.id}
                                                className="group rounded-2xl border border-border/60 bg-muted/20 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/3 hover:shadow-md"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate font-bold text-foreground">
                                                            {getDariItemUnit(unit.name)}{unit.symbol ? ` (${unit.symbol})` : ''}
                                                        </p>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {unit.id === baseUnit?.id
                                                                ? 'واحد پایه'
                                                                : `هر ${unit.name} برابر ${Number(unit.conversion_to_base).toLocaleString()} ${baseUnit?.name ?? getDariItemUnit(item.unit)}`}
                                                        </p>
                                                    </div>
                                                    <span className="shrink-0 rounded-full border border-border/60 bg-background px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                                                        {unit.code}
                                                    </span>
                                                </div>
                                                <div className="mt-4 grid grid-cols-2 gap-2">
                                                    <div className="rounded-xl bg-background p-3 ring-1 ring-border/50">
                                                        <span className="block text-[11px] text-muted-foreground">قیمت فروش</span>
                                                        <p className="mt-1 text-sm font-bold tabular-nums text-foreground">
                                                            {Number(unit.selling_price).toLocaleString()}
                                                            <span className="mr-1 text-[10px] font-medium text-muted-foreground">{getDariCurrency(currency.name)}</span>
                                                        </p>
                                                    </div>
                                                    <div className="rounded-xl bg-background p-3 ring-1 ring-border/50">
                                                        <span className="block text-[11px] text-muted-foreground">قیمت خرید</span>
                                                        <p className="mt-1 text-sm font-bold tabular-nums text-foreground">
                                                            {unit.purchase_price == null ? '—' : Number(unit.purchase_price).toLocaleString()}
                                                            {unit.purchase_price != null && <span className="mr-1 text-[10px] font-medium text-muted-foreground">{getDariCurrency(currency.name)}</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                                {unit.barcode && (
                                                    <p className="mt-2 truncate rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground ring-1 ring-border/50">
                                                        بارکد: <b className="font-semibold text-foreground">{unit.barcode}</b>
                                                    </p>
                                                )}
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                                        برای این جنس واحد فعالی ثبت نشده است.
                                    </p>
                                )}
                            </section>
                        </div>
                    </div>
                    <DrawerFooter className="border-t border-border/60 bg-background/95 px-4 py-3">
                        <DrawerClose asChild>
                            <button type="button" className="w-full rounded-xl bg-muted px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                                بستن
                            </button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    )
}

export default ItemDrawer
