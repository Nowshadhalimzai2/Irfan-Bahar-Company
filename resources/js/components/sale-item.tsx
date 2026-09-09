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
            <div className="order-3 flex w-full items-center justify-between rounded-lg border sm:order-none sm:w-auto sm:justify-start">
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
                    <div className="grid gap-3 p-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/80 to-muted/40 p-3 shadow-sm">
                            <span className="mb-1.5 block text-[11px] font-medium tracking-[0.08em] text-muted-foreground/80">کد جنس</span>
                            <p className="break-all font-semibold text-foreground">{item.code || '—'}</p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/80 to-muted/40 p-3 shadow-sm">
                            <span className="mb-1.5 block text-[11px] font-medium tracking-[0.08em] text-muted-foreground/80">SKU</span>
                            <p className="break-all font-semibold text-foreground">{item.sku || '—'}</p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/80 to-muted/40 p-3 shadow-sm">
                            <span className="mb-1.5 block text-[11px] font-medium tracking-[0.08em] text-muted-foreground/80">بارکد</span>
                            <p className="break-all font-semibold text-foreground">{item.product?.barcode || '—'}</p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/80 to-muted/40 p-3 shadow-sm">
                            <span className="mb-1.5 block text-[11px] font-medium tracking-[0.08em] text-muted-foreground/80">واحد</span>
                            <p className="font-semibold text-foreground">{units[item.unit] || item.unit}</p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/80 to-muted/40 p-3 shadow-sm">
                            <span className="mb-1.5 block text-[11px] font-medium tracking-[0.08em] text-muted-foreground/80">قیمت واحد</span>
                            <p className="font-semibold text-foreground">{unit_price.toLocaleString()} {currency.name}</p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/80 to-muted/40 p-3 shadow-sm">
                            <span className="mb-1.5 block text-[11px] font-medium tracking-[0.08em] text-muted-foreground/80">موجود در شرکت</span>
                            <p className="font-semibold text-foreground">{item.inventory_balances?.reduce((acc, balance) => acc + balance.quantity_on_hand, 0) ?? 0}</p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/80 to-muted/40 p-3 shadow-sm">
                            <span className="mb-1.5 block text-[11px] font-medium tracking-[0.08em] text-muted-foreground/80">تعداد انتخاب‌شده</span>
                            <p className="font-semibold text-foreground">{quantity}</p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/80 to-muted/40 p-3 shadow-sm">
                            <span className="mb-1.5 block text-[11px] font-medium tracking-[0.08em] text-muted-foreground/80">قیمت پیش‌فرض فروش</span>
                            <p className="font-semibold text-foreground">{item.default_sale_price.toLocaleString()} {currency.name}</p>
                        </div>
                        {item.product?.weight !== undefined && (
                            <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/80 to-muted/40 p-3 shadow-sm">
                                <span className="mb-1.5 block text-[11px] font-medium tracking-[0.08em] text-muted-foreground/80">وزن</span>
                                <p className="font-semibold text-foreground">{item.product.weight}</p>
                            </div>
                        )}
                        {item.product?.per_pack !== undefined && (
                            <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/80 to-muted/40 p-3 shadow-sm">
                                <span className="mb-1.5 block text-[11px] font-medium tracking-[0.08em] text-muted-foreground/80">تعداد در بسته</span>
                                <p className="font-semibold text-foreground">{item.product.per_pack}</p>
                            </div>
                        )}
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