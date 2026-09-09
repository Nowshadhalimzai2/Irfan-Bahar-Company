import { Minus, Package, Plus, Trash2 } from 'lucide-react';
import { Input } from './ui/input';


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
            className="flex items-center gap-3 p-4"
        >
            <Package className="size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
                <b className="block truncate text-sm">
                    {item.name}{' '}
                    {item.product && <small className='text-xs text-gray-400'>
                        ( وزن {((item?.product?.weight ?? 1) / (item.product?.per_pack ?? 1)) * 1000}, دارای {item.product.per_pack} دانه )
                    </small>}
                </b>
                <span className="text-xs text-slate-400">
                    موجودی{' '}
                    {getStock(item)}{' '}
                    {units[item.unit] ??
                        item.unit}
                </span>
            </div>
            <div className="flex items-center rounded-lg border">
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
                <span className="min-w-8 text-center text-sm font-bold">
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
                    className='border-none w-20'
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
            <b className="hidden w-28 text-left text-sm sm:block">
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
        </div>
    )
}

export default SaleItem