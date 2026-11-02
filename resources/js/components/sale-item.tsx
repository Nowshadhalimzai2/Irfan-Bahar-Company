import { Eye, Minus, Package, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ItemDrawer from './item-drawer';
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
    product?: { weight?: number };
    inventory_balances?: Balance[];
    units?: {
        id: number;
        name: string;
        symbol?: string | null;
        conversion_to_base: number;
        selling_price: number;
        is_active: boolean;
    }[];
    base_unit?: {
        id: number;
        name: string;
        conversion_to_base: number;
        selling_price: number;
    } | null;
};
interface Props {
    item: Item;
    item_unit_id: number;
    unit_price: number;
    quantity: number;
    updateLine: (itemId: number, quantity: number) => boolean;
    getStock: (itemId: number) => number;
    removeLine: (itemId: number) => void;
    changeUnit: (itemUnitId: number, nextUnitId: number) => void;
    units: Record<string, string>;
    currency: { id: number; name: string };
}

const SaleItem = ({
    item,
    item_unit_id,
    unit_price,
    quantity,
    updateLine,
    getStock,
    removeLine,
    changeUnit,
    units,
    currency,
}: Props) => {
    const [quantityDraft, setQuantityDraft] = useState(String(quantity));
    const itemUnits =
        item.units?.filter((unit) => unit.is_active) ??
        (item.base_unit ? [item.base_unit] : []);
    const selectedUnit =
        itemUnits.find((unit) => unit.id === item_unit_id) ?? itemUnits[0];

    return (
        <div className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:p-4">
            <Package className="size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1 basis-[calc(100%-2rem)] sm:basis-auto">
                <b className="block truncate text-sm">
                    {item.name}{' '}
                    {item.product?.weight !== undefined && (
                        <small className="text-xs text-gray-400">
                            ( وزن {item.product.weight})
                        </small>
                    )}
                </b>
                <span className="text-xs text-slate-400">
                    موجودی{' '}
                    {(
                        getStock(item.id) /
                        Number(selectedUnit?.conversion_to_base ?? 1)
                    ).toFixed(3)}{' '}
                    {selectedUnit?.name ?? units[item.unit] ?? item.unit}
                </span>
            </div>
            <div className="order-3 flex w-full items-center justify-between rounded-lg border sm:order-0 sm:w-auto sm:justify-start">
                <button
                    type="button"
                    onClick={() => updateLine(item_unit_id, quantity - 1)}
                    className="p-2"
                >
                    <Minus className="size-3.5" />
                </button>
                <span className="min-w-8 flex-1 text-center text-sm font-bold sm:flex-none">
                    <Input
                        type="number"
                        dir="ltr"
                        min="0.001"
                        step="0.001"
                        value={quantityDraft}
                        onChange={(event) =>
                            setQuantityDraft(event.target.value)
                        }
                        onBlur={() => {
                            const nextQuantity = Number(quantityDraft);

                            if (
                                !Number.isFinite(nextQuantity) ||
                                nextQuantity <= 0 ||
                                !updateLine(item_unit_id, nextQuantity)
                            ) {
                                setQuantityDraft(String(quantity));
                            }
                        }}
                        className="w-full border-none sm:w-20"
                    />
                </span>
                <button
                    type="button"
                    onClick={() => updateLine(item_unit_id, quantity + 1)}
                    className="p-2"
                >
                    <Plus className="size-3.5" />
                </button>
            </div>
            <b className="ml-auto w-auto text-left text-sm sm:w-28">
                {(quantity * unit_price).toFixed(2)}
                {currency?.name ?? currency.name ?? ''}
            </b>
            <button
                type="button"
                title="حذف جنس"
                onClick={() => removeLine(item_unit_id)}
                className="p-2 text-slate-400 hover:text-rose-600"
            >
                <Trash2 className="size-4" />
            </button>

            {/* ============================================== ITEM DRAWER */}
            <select
                value={item_unit_id}
                onChange={(event) =>
                    changeUnit(item_unit_id, Number(event.target.value))
                }
                className="rounded-md border px-2 py-1 text-xs"
                disabled={itemUnits.length <= 1}
            >
                {itemUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                        {unit.name} — ×{unit.conversion_to_base}
                    </option>
                ))}
            </select>

            <ItemDrawer
                item={item}
                trigger={<Eye className="size-4" />}
                quantity={quantity}
            />
        </div>
    );
};

export default SaleItem;
