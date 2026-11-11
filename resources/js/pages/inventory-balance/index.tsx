import { router,usePage } from '@inertiajs/react';
import { AlertTriangle, Boxes, CheckCircle2, Filter, PackageOpen, Search, SearchX, SlidersHorizontal, Sparkles, Store, Warehouse } from 'lucide-react';
import { useMemo, useState } from 'react';
import ItemDrawer from '@/components/item-drawer';
import LocationTranslator, { getDariCategory, getDariItemType, getDariItemUnit, locationColor } from '@/components/location-translator';
import PageHead from '@/components/page-head';
import PageLinks from '@/components/page-links';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { InventoryBalance, Location } from '@/types';
import type { Item, ItemUnit } from '@/types/item';



type ItemWithInventory = Item & {
    inventory_balances: (Omit<InventoryBalance, 'location'> & {
        location: Pick<Location, 'id' | 'name'>;
    })[];
    units?: ItemUnit[];
};

interface Props {
    items: {
        data: ItemWithInventory[];
        current_page: number;
        from: number;
        last_page: number;
        total: number;
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
                [item.name, item.sku, item.code].some((value) =>
                    value.toLowerCase().includes(normalizedSearch),
                ) ||
                (item.units ?? []).some((unit) =>
                    [unit.name, unit.code, unit.barcode ?? ''].some((value) =>
                        value.toLowerCase().includes(normalizedSearch),
                    ),
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
    const activeUnits = (item: ItemWithInventory) =>
        item.units?.filter((unit) => unit.is_active) ?? [];
    const baseUnit = (item: ItemWithInventory) =>
        item.base_unit ?? activeUnits(item).find((unit) => Number(unit.conversion_to_base) === 1);
    const userRole = usePage().props.auth.role;
    return (
        <AppLayout breadcrumbs={[
            { title: 'ستاک', href: '/inventory-balances' },
        ]}>

            <div className="p-5">
               {userRole!=='factory_clerk' ? <PageHead
                    HeadIcon={Store}
                    title="ذخیره اجناس"
                    description={`نمایش ${items.data.length} از ${items.total} قلم دارای موجودی`}
                    subtitle="اجناس شرکت"
                    tone='cyan'
                    actionTitle='ثبت جنس جدید'
                    actionURL='/items/create'
                />:
                <PageHead
                    HeadIcon={Store}
                    title="ذخیره اجناس"
                    description={`نمایش ${items.data.length} از ${items.total} قلم دارای موجودی`}
                    subtitle="اجناس شرکت"
                    tone='cyan'
                />}

                <section className="mt-5" dir='rtl'>
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
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input
                                autoFocus
                                className="pr-10 h-12 rounded-2xl border-slate-200 bg-white/80 shadow-sm transition focus-visible:ring-primary/30 dark:border-slate-700 dark:bg-slate-900"
                                placeholder={`جستجوی اجناس به اساس نام، اسکی یو، بار کود و کد نمبر (${items.data.length}) `}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>



                        <div className={`grid grid-cols-1 ${filteredItems.length > 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} mt-5 gap-5 md:gap-3`}>
                            {filteredItems.length > 0 ? filteredItems.map((item) =>
                                <div className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_50px_rgba(15,23,42,0.13)] dark:border-slate-700/80 dark:bg-slate-900" key={item.id}>
                                    <div className="relative flex min-h-28 items-end justify-between gap-3 overflow-hidden bg-linear-to-br from-primary via-primary/85 to-slate-800 p-4">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_48%)]" />
                                        <Boxes className="absolute -bottom-5 -left-3 size-28 rotate-12 text-white/10 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110" />
                                        <div className="relative min-w-0 text-white">
                                            <span className="mb-1 inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80">{item.code || item.sku || 'بدون کود'}</span>
                                            <h2 className="truncate text-lg font-bold drop-shadow-md">
                                                <ItemDrawer item={item} trigger={<span>{item.name}</span>} />
                                            </h2>
                                        </div>
                                        <div className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${totalStock(item) <= 10
                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                            }`}>
                                            {totalStock(item) <= 10 ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                            {totalStock(item) <= 10 ? 'موجودی کم' : 'موجودی کافی'}
                                        </div>
                                    </div>
                                    <div className="flex flex-1 flex-col p-4">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-2">
                                                <p className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-center text-xs font-semibold text-primary">{getDariItemType(item.item_type)}</p>
                                                <p className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-center text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">SKU: {item.sku || '—'}</p>
                                                <p className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-center text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">کتگوری: {item.category?.name ? getDariCategory(item.category.name) : '—'}</p>
                                                <p className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-center text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">واحد پایه: {baseUnit(item)?.name ?? getDariItemUnit(item.unit)}</p>
                                                {item.product?.weight != null && <p className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-center text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">وزن: {item.product.weight}</p>}
                                            </div>
                                            <div className="rounded-2xl border border-slate-200/80 bg-linear-to-br from-slate-50 to-white p-3 shadow-sm dark:border-slate-700 dark:from-slate-800/80 dark:to-slate-900">
                                                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                    <Warehouse className="h-3.5 w-3.5" />
                                                    موجودی مکان‌ها
                                                </div>
                                                <div className="space-y-2" dir='rtl'>
                                                    {item.inventory_balances.map((balance) => <ul key={balance.id} className="rounded-xl bg-white px-2 py-2 text-xs shadow-sm dark:bg-slate-900">
                                                        <li className={`mb-1 font-semibold ${locationColor(balance.location.name)}`}>{LocationTranslator(balance.location.name)}</li>
                                                        <li className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-slate-700 dark:text-slate-200">
                                                            <span>موجودی: {Number(balance.quantity_on_hand).toLocaleString()} {baseUnit(item)?.name ?? getDariItemUnit(item.unit)}</span>
                                                            <span>رزرو: {Number(balance.reserved).toLocaleString()}</span>
                                                            <span className="font-semibold">قابل استفاده: {Math.max(0, Number(balance.quantity_on_hand) - Number(balance.reserved)).toLocaleString()}</span>
                                                        </li>
                                                        {activeUnits(item).length > 1 && <li className="mt-2 flex flex-wrap gap-2 border-t pt-2 text-slate-500">
                                                            {activeUnits(item).map((unit) => (
                                                                <span key={unit.id}>{unit.name}: {(Math.max(0, Number(balance.quantity_on_hand) - Number(balance.reserved)) / Number(unit.conversion_to_base || 1)).toLocaleString(undefined, { maximumFractionDigits: 3 })}</span>
                                                            ))}
                                                        </li>}
                                                    </ul>)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className='mt-4 flex items-center justify-between rounded-2xl bg-linear-to-r from-slate-100 to-slate-50 px-3 py-2 text-xs font-medium text-slate-700 dark:from-slate-800 dark:to-slate-900 dark:text-slate-200'>
                                            <p>{Math.max(0, totalStock(item)).toLocaleString()} موجودی قابل استفاده</p>
                                            <p>واحد پایه: {baseUnit(item)?.name ?? getDariItemUnit(item.unit)}</p>
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