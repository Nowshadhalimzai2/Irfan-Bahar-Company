import { Eye, Minus, Package, Plus, Trash2 } from 'lucide-react';
import { Input } from './ui/input';

type Balance = {
    location_id: number;
    quantity_on_hand: number;
    reserved: number;
};

import {
    Barcode,
    Box,
    Boxes,
    ClipboardList,
    Hash,
    Scale,
 
} from 'lucide-react';
import ItemDrawer from './item-drawer';
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
           <ItemDrawer 
                item={item}
                trigger={<Eye className='size-4'/>}
                quantity={quantity}

           />

        </div>
    )
}

export default SaleItem