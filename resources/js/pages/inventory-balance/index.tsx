import { router } from '@inertiajs/react';
import { Accessibility, AlertTriangle, Boxes, CheckCircle2, Filter, PackageOpen, Search, SearchX, SlidersHorizontal, Sparkles, Store, Warehouse } from 'lucide-react';
import { useMemo, useState } from 'react';
import LocationTranslator, { getDariCategory, getDariItemType, getDariItemUnit, locationColor } from '@/components/location-translator';
import PageLinks from '@/components/page-links';
import { SectionTitle } from '@/components/section-title';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { InventoryBalance } from '@/types';
import type { Item } from '@/types/item';
import PageHead from '@/components/page-head';
import ItemDrawer from '@/components/item-drawer';

type Balance = {
    location_id: number;
    quantity_on_hand: number;
    reserved: number;
};


type ItemWithInventory = Item & {
    inventory_balances: InventoryBalance[];
}

interface Props {
    items: {
        data: ItemWithInventory[];
        current_page: number;
        from: number;
        last_page: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
    };
    locations: {
        id: number;
        name: string;
    }[];
}

const itemTypeOptions: Item['item_type'][] = ['product', 'raw_material', 'packing'];

const Index = ({ items, locations }: Props) => {
    const [selectedItemTypes, setSelectedItemTypes] = useState<Item['item_type'][]>(() => {
        const params = new URLSearchParams(window.location.search);
        const itemTypeValue = params.get('item_type');

        if (!itemTypeValue) {
            return [];
        }

        return itemTypeValue.split(',').filter((type): type is Item['item_type'] =>
            ['product', 'raw_material', 'packing'].includes(type),
        );
    });
    const [selectedCategory, setSelectedCategory] = useState<string>(() => new URLSearchParams(window.location.search).get('category') ?? 'all');
    const [selectedLocation, setSelectedLocation] = useState<string>(() => new URLSearchParams(window.location.search).get('location_id') ?? 'all');
    const [searchTerm, setSearchTerm] = useState<string>('');

    const categories = useMemo(
        () => Array.from(new Set(items.data.map((item) => item.category?.name).filter((name): name is string => Boolean(name)))).sort(),
        [items.data],
    );

    const filteredItems = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return items.data.filter((item) => {
            const matchesItemType = selectedItemTypes.length === 0 || selectedItemTypes.includes(item.item_type);
            const matchesCategory = selectedCategory === 'all' || item.category?.name === selectedCategory;
            const matchesLocation = selectedLocation === 'all' || item.inventory_balances.some((balance) => String(balance.location?.id ?? balance.location.id) === selectedLocation);
            const matchesSearch =
                normalizedSearch === '' ||
                [item.name, item.sku, item.code, item.product?.barcode ?? ''].some((value) =>
                    value.toLowerCase().includes(normalizedSearch),
                );

            return matchesItemType && matchesCategory && matchesLocation && matchesSearch;
        });
    }, [items.data, searchTerm, selectedCategory, selectedItemTypes, selectedLocation]);

    const applyFilters = (nextTypes: Item['item_type'][], nextCategory: string, nextLocation: string) => {
        const params = new URLSearchParams(window.location.search);

        if (nextTypes.length > 0) {
            params.set('item_type', nextTypes.join(','));
        } else {
            params.delete('item_type');
        }

        if (nextCategory === 'all') {
            params.delete('category');
        } else {
            params.set('category', nextCategory);
        }

        if (nextLocation === 'all') {
            params.delete('location_id');
        } else {
            params.set('location_id', nextLocation);
        }

        router.get('/inventory-balances', Object.fromEntries(params.entries()), {
            preserveScroll: true,
            replace: true,
        });
    };

    const toggleItemType = (type: Item['item_type']) => {
        const nextTypes = selectedItemTypes.includes(type)
            ? selectedItemTypes.filter((itemType) => itemType !== type)
            : [...selectedItemTypes, type];

        setSelectedItemTypes(nextTypes);
        applyFilters(nextTypes, selectedCategory, selectedLocation);
    };

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        applyFilters(selectedItemTypes, category, selectedLocation);
    };

    const handleLocationChange = (locationId: string) => {
        setSelectedLocation(locationId);
        applyFilters(selectedItemTypes, selectedCategory, locationId);
    };

    const totalStock = (item: ItemWithInventory) => {
        return item.inventory_balances.reduce((acc, balance) => acc + (balance.quantity_on_hand - balance.reserved), 0);
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'ستاک', href: '/inventory-balances' },
        ]}>

            <div className="p-5">
                <PageHead
                    HeadIcon={Store}
                    title="ذخیره اجناس"
                    description={" تمام اجناس که در شرکت فروخته می شود "+items.data.filter(item=>item.inventory_balances.reduce((acc,balance)=>acc+=balance.quantity_on_hand,0)>0).length+" اقلام است."}
                    subtitle="اجناس شرکت"
                    tone='cyan'
                />

                <section className="mt-5">
                    <div className="grid grid-cols-1 gap-3">
                        <div className="rounded-2xl border bg-linear-to-br from-white via-slate-50 to-slate-100 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:ring-slate-700/80">
                            <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-slate-700/80">
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                    <div className="rounded-xl bg-primary/10 p-2 text-primary">
                                        <SlidersHorizontal className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-semibold">فیلترهای پیشرفته</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <button
                                        type='button'
                                        className='inline-flex items-center gap-1 rounded-full border bg-white/80 px-2.5 py-1.5 shadow-sm transition hover:bg-slate-100 dark:bg-slate-900/70 dark:hover:bg-slate-800'
                                        onClick={() => {
                                            const nextTypes = itemTypeOptions;
                                            setSelectedItemTypes(nextTypes);
                                            applyFilters(nextTypes, selectedCategory, selectedLocation);
                                        }}
                                    >
                                        <Sparkles className="h-3 w-3" />
                                        همه
                                    </button>
                                    <button
                                        type='button'
                                        className='inline-flex items-center gap-1 rounded-full border bg-white/80 px-2.5 py-1.5 shadow-sm transition hover:bg-slate-100 dark:bg-slate-900/70 dark:hover:bg-slate-800'
                                        onClick={() => {
                                            setSelectedItemTypes([]);
                                            applyFilters([], selectedCategory, selectedLocation);
                                        }}
                                    >
                                        <Filter className="h-3 w-3" />
                                        پاک کردن
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-[1.35fr_0.95fr_0.95fr]">
                                <div className='space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950/60'>
                                    <div className='flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200'>
                                        <Boxes className="h-4 w-4 text-primary" />
                                        نوع جنس
                                    </div>
                                    <div className='grid grid-cols-3 gap-3'>
                                        {itemTypeOptions.map((type) => (
                                            <label
                                                key={type}
                                                htmlFor={type}
                                                className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-all ${selectedItemTypes.includes(type)
                                                    ? 'border-primary bg-primary/8 shadow-inner ring-1 ring-primary/40'
                                                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                                                    }`}
                                            >
                                                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                                                    {type === 'product' ? <PackageOpen className="h-4 w-4" /> : <Warehouse className="h-4 w-4" />}
                                                </div>
                                                <span className="text-xs font-medium">{getDariItemType(type)}</span>
                                                <Input
                                                    id={type}
                                                    name={type}
                                                    checked={selectedItemTypes.includes(type)}
                                                    type='checkbox'
                                                    className='size-4 accent-primary'
                                                    onChange={() => toggleItemType(type)}
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className='space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950/60'>
                                    <div className='flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200'>
                                        <Filter className="h-4 w-4 text-primary" />
                                        کتگوری
                                    </div>
                                    <select
                                        value={selectedCategory}
                                        onChange={(event) => handleCategoryChange(event.target.value)}
                                        className='w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900'
                                    >
                                        <option value='all'>همه کتگوری‌ها</option>
                                        {categories.map((category) => (
                                            <option key={category} value={category}>
                                                {getDariCategory(category)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className='space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950/60'>
                                    <div className='flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200'>
                                        <Warehouse className="h-4 w-4 text-primary" />
                                        مکان
                                    </div>
                                    <select
                                        value={selectedLocation}
                                        onChange={(event) => handleLocationChange(event.target.value)}
                                        className='w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900'
                                    >
                                        <option value='all'>همه مکان‌ها</option>
                                        {locations.map((location) => (
                                            <option key={location.id} value={String(location.id)}>
                                                {LocationTranslator(location.name)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="relative mt-5">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input
                                autoFocus
                                className="pl-10 h-12 rounded-2xl border-slate-200 bg-white/80 shadow-sm transition focus-visible:ring-primary/30 dark:border-slate-700 dark:bg-slate-900"
                                placeholder='جستجوی اجناس به اساس نام، اسکی یو، بار کود و کد نمبر'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                       

                        <div className={`grid grid-cols-1 ${filteredItems.length > 0 ? 'lg:grid-cols-3' : ' lg:grid-cols-1'} gap-5 md:gap-3 mt-5`}>
                            {filteredItems.length > 0 ? filteredItems.map((item, ind) =>
                                <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-900" key={ind}>
                                    <div className="relative overflow-hidden bg-linear-to-r from-primary/20 via-secondary/20 to-slate-200">
                                        <img src={"https://picsum.photos/275/60"} alt="" className="h-24 w-full object-cover opacity-90" />
                                        <div className="absolute inset-0 bg-linear-to-t from-slate-950/50 to-transparent" />
                                        <h2 className="absolute inset-x-4 bottom-3 text-center text-lg font-bold text-white drop-shadow-md">
                                            <ItemDrawer item={item} trigger={item.name}/>
                                                
                                        </h2>
                                        <div className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${totalStock(item) <= 10
                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                            }`}>
                                            {totalStock(item) <= 10 ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                            {totalStock(item) <= 10 ? 'موجودی کم' : 'موجودی کافی'}
                                        </div>
                                    </div>
                                    <div className="flex flex-1 flex-col p-4">
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <p className='rounded-xl border border-primary/20 bg-primary/5 px-2 py-1.5 text-center text-xs font-medium text-primary'>{getDariItemType(item.item_type)}</p>
                                                <p className='rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'>{item.sku}</p>
                                                {item.item_type === 'product' && <p className='rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'>{item.product?.weight}</p>}
                                                {item.item_type === 'product' && <p className='rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'>{item.product?.per_pack}</p>}
                                                <p className='rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'>{item.default_sale_price}</p>
                                                <p className='rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'>{getDariCategory(item.category.name)}</p>
                                            </div>
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-inner dark:border-slate-700 dark:bg-slate-800/80">
                                                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                    <Warehouse className="h-3.5 w-3.5" />
                                                    موجودی مکان‌ها
                                                </div>
                                                <div className="space-y-2">
                                                    {item.inventory_balances.map((balance, ind) => <ul key={ind} className={`flex items-center justify-between gap-3 rounded-xl bg-white px-2 py-1.5 text-xs shadow-sm dark:bg-slate-900 ${balance.quantity_on_hand < 10 && ' bg-red-100!'}`}>
                                                        <li className={`${locationColor(balance.location.name)} font-medium`}>{LocationTranslator(balance.location.name)}</li>
                                                        <li className="text-slate-700 dark:text-slate-200">{balance.quantity_on_hand} {getDariItemUnit(item.unit)}</li>
                                                        <li className="text-slate-500">رزرو: {balance.reserved}</li>
                                                    </ul>)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className='mt-4 flex items-center justify-between rounded-2xl bg-linear-to-r from-slate-100 to-slate-50 px-3 py-2 text-xs font-medium text-slate-700 dark:from-slate-800 dark:to-slate-900 dark:text-slate-200'>
                                            <p>{(item.default_sale_price * totalStock(item)).toFixed(2)} جمله پول</p>
                                            <p>{totalStock(item)} جمله {getDariItemUnit(item.unit)}</p>
                                        </div>
                                    </div>
                                </div>) : <div className='flex w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'> <div className="flex flex-col items-center gap-3"><SearchX className="h-8 w-8" /><p className='text-sm'>ریکورد موجود نیست!</p></div> </div>}
                        </div>

                        {/*  ============================  PAGINATION SECTION ==================== */}
                        <PageLinks links={items.links} className='mt-5' />
                    </div>
                </section>
            </div>
        </AppLayout>
    )
}

export default Index