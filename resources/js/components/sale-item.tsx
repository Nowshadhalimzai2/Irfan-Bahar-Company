import { Eye, Minus, Package, Plus, Trash2 } from 'lucide-react';
import { Input } from './ui/input';

type Balance = {
    location_id: number;
    quantity_on_hand: number;
    reserved: number;
};
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import {
    Barcode,
    BadgeDollarSign,
    Box,
    Boxes,
    ClipboardList,
    Hash,
    Scale,
    ShoppingCart,
    Warehouse,
} from 'lucide-react';
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
    unit_price: number;
    quantity: number;
    updateLine: (itemId: number, change: number) => void
    getStock: (item: Item) => number;
    removeLine: (itemId: number) => void;
    units: Record<string, string>;
    currency: { id: number, name: string; }
}


const SaleItem = ({ item, unit_price, quantity, updateLine, getStock, removeLine, units, currency }: Props) => {
    const totalInventory =
        item.inventory_balances?.reduce(
            (acc, balance) => acc + balance.quantity_on_hand,
            0
        ) ?? 0;

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
            value: units[item.unit] || item.unit,
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
    return (
        <div
            className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:p-4"
        >
            <Package className="size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1 basis-[calc(100%-2rem)] sm:basis-auto">
                <b className="block truncate text-sm">
                    {item.name}{' '}
                    {item.product && <small className='text-xs text-gray-400'>
                        ( وزن {((item?.product?.weight ?? 1) / (item.product?.per_pack ?? 1)) * 1000})
                    </small>}
                </b>
                <span className="text-xs text-slate-400">
                    موجودی{' '}
                    {getStock(item)}{' '}
                    {units[item.unit] ??
                        item.unit}
                </span>
            </div>
            <div className="order-3 flex w-full items-center justify-between rounded-lg border sm:order-0 sm:w-auto sm:justify-start">
                <button
                    type="button"
                    onClick={() =>
                        updateLine(
                            item.id,
                            -1,
                        )
                    }
                    className="p-2"
                >
                    <Minus className="size-3.5" />
                </button>
                <span className="min-w-8 flex-1 text-center text-sm font-bold sm:flex-none">
                    <Input type="number"
                        dir='ltr'
                        min="0"
                        value={quantity}
                        onChange={(e) => {
                            const nextQuantity = Number(e.target.value);

                            if (Number.isFinite(nextQuantity) && nextQuantity >= 0) {
                                updateLine(item.id, nextQuantity - quantity)
                            }
                        }}
                        className='w-full border-none sm:w-20'
                    />
                </span>
                <button
                    type="button"
                    onClick={() =>
                        updateLine(
                            item.id,
                            1,
                        )
                    }
                    className="p-2"
                >
                    <Plus className="size-3.5" />
                </button>
            </div>
            <b className="ml-auto w-auto text-left text-sm sm:w-28">
                {(quantity *
                    unit_price).toFixed(2)
                }
                {currency?.name ??
                    currency.name ?? ''}
            </b>
            <button
                type="button"
                title="حذف جنس"
                onClick={() =>
                    removeLine(item.id)
                }
                className="p-2 text-slate-400 hover:text-rose-600"
            >
                <Trash2 className="size-4" />
            </button>

            {/* ============================================== ITEM DRAWER */}
            <Drawer >
                <DrawerTrigger asChild>
                    <button
                        type="button"
                        title="توضیحات جنس بیبین"

                        className="p-2 text-sky-400 hover:text-sky-600"
                    >
                        <Eye className="size-4" />
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
                                <div className="grid grid-cols-2 gap-px bg-border/60 sm:grid-cols-4">
                                    <div className="bg-gradient-to-br from-primary to-primary/80 p-3 text-primary-foreground">
                                        <div className="mb-1 flex items-center gap-2 text-primary-foreground/75">
                                            <BadgeDollarSign className="size-4" />
                                            <span className="text-[11px] font-medium">
                                                قیمت واحد
                                            </span>
                                        </div>

                                        <p className="truncate text-base font-black tabular-nums">
                                            {unit_price.toLocaleString()}
                                            <span className="mr-1 text-[10px] font-medium">
                                                {currency.name}
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

                                    <div className="bg-background p-3">
                                        <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                                            <ShoppingCart className="size-4" />
                                            <span className="text-[11px] font-medium">
                                                تعداد انتخاب‌شده
                                            </span>
                                        </div>

                                        <p className="text-base font-black tabular-nums text-foreground">
                                            {quantity}
                                        </p>
                                    </div>

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
                                                    className="group min-w-0 rounded-2xl border border-border/60 bg-muted/30 p-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"
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
                        <DrawerClose >
                            <Button>Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

        </div>
    )
}

export default SaleItem