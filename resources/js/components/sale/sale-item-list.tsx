import React, { Dispatch, SetStateAction, useMemo } from 'react'
import SaleItem from '../sale-item';
import { ShoppingCart } from 'lucide-react';

type SaleLine = { item_id: number; quantity: number; unit_price: number };
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
    lines: SaleLine[];
    items: Item[];
    setLines: Dispatch<SetStateAction<SaleLine[]>>
    updateLine: (itemId: number, change: number) => void
    getStock: (item: Item) => number;
    removeLine: (itemId: number) => void;
    currency: { id: number, name: string; }

}

const SaleItemList = ({ lines, items, setLines, updateLine, getStock, removeLine, currency }: Props) => {
    const units: Record<string, string> = {
        kg: 'کیلو',
        gr: 'گرام',
        ltr: 'لیتر',
        packet: 'پاکت',
        carton: 'کارتن',
        bundle: 'بسته',
        pair: 'جوره',
        unit: 'عدد',
        bag: 'بوری',
    };

    const cart = useMemo(
        () =>
            lines
                .map((line) => ({
                    ...line,
                    item: items.find((item) => item.id === line.item_id)!,
                }))
                .filter((line) => line.item),
        [items, lines],
    );
    return (
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b p-5">
                <div className="flex items-center gap-3">
                    <ShoppingCart className="size-5 text-amber-600" />
                    <div>
                        <h2 className="font-bold">
                            سبد فروش
                        </h2>
                        <p className="text-xs text-slate-500">
                            {cart.length} قلم ·{' '}
                            {lines.reduce(
                                (sum, line) =>
                                    sum + line.quantity,
                                0,
                            )}{' '}
                            واحد
                        </p>
                    </div>
                </div>
                {cart.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setLines([])}
                        className="text-xs text-rose-500"
                    >
                        پاک کردن همه
                    </button>
                )}
            </div>
            {cart.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
                    <ShoppingCart className="size-9 text-slate-300" />
                    <p className="font-medium text-slate-600">
                        سبد فروش خالی است
                    </p>
                    <p className="text-xs text-slate-400">
                        برای شروع، یک بارکد را اسکن کنید.
                    </p>
                </div>
            ) : (
                <div className="divide-y">
                    {cart.reverse().map(({ item, quantity, unit_price }) => (
                        <div key={item.id}>
                                    <SaleItem
                                        currency={currency}
                                        getStock={getStock}
                                        item={item}
                                        quantity={quantity}
                                        unit_price={unit_price}
                                        units={units}
                                        updateLine={updateLine}
                                        removeLine={removeLine}
                                    />
                          

                        </div>
                    ),
                    )}
                </div>
            )}
        </section>
    )
}

export default SaleItemList