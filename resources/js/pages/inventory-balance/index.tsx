import { SectionTitle } from '@/components/section-title';
import AppLayout from '@/layouts/app-layout';
import { InventoryBalance } from '@/types';
import LocationTranslator, { getDariItemType, getDariItemUnit, locationColor } from '@/components/location-translator';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, SearchX, } from 'lucide-react';
import { Item } from '@/types/item';
import PageLinks from '@/components/page-links';

type ItemWithInventory = Item & {
    inventory_balances: InventoryBalance[];
}
interface Props {
    // inventoryBalances: InventoryBalance[];
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
}
const Index = ({ items }: Props) => {

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [allItems, setAllItems] = useState<ItemWithInventory[]>(items.data);

    useEffect(() => {
        if (searchTerm === '')
            setAllItems(items.data);
        else {
            const filteredData = items.data.filter((item) => item.name.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
                item.sku.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
                item.code.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
                (item.product?.barcode && item.product.barcode.toLowerCase().includes(searchTerm.trim().toLowerCase()))
            );
            setAllItems(filteredData);
        }
    }, [searchTerm]);
    const totalStock = (item: ItemWithInventory) => {
        return item.inventory_balances.reduce((acc, balance) => acc + (balance.quantity_on_hand - balance.reserved), 0);
    }
    return (
        <AppLayout breadcrumbs={[
            { title: 'ستاک', href: '/inventory-balances' },
        ]}>

            <div className="p-5">
                <section className="section">
                    <div>
                        <SectionTitle title='ستاک اجناس' description='تمام اجناس که مربوط شرکت است' />
                        <div className="max-w-4xl space-y-5 mx-auto p-5">
                            <div className="flex gap-2 relative">
                                <Input autoFocus className="pl-10" placeholder='جستجوی اجناس به اساس نام، اسکی یو، بار کود  و کد نمبر' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                <Search className="absolute top-2 left-2 text-gray-400" />
                                {/* <Link href={'/items/create'} className={`${buttonVariants({ variant: 'secondary' })} `}>جنس جدید</Link> */}
                            </div>
                            <div className={`grid grid-cols-1 ${allItems.length > 0 ? 'lg:grid-cols-3' : ' lg:grid-cols-1'} gap-5 md:gap-3 mt-5`}>
                                {allItems.length > 0 ? allItems.map((item, ind) =>
                                    <div className="Card space-y-3  flex flex-col  border rounded-md shadow-xl" key={ind}>
                                        <div className="relative bg-secondary rounded-sm overflow-hidden">
                                            <img src={"https://picsum.photos/275/60"} alt="" />
                                            <h2 className="font-bold underline underline-offset-5 absolute top-2 left-20 text-center text-lg p-2 text-primary">{item.name}</h2>

                                        </div>
                                        <div className="p-5">
                                            <div className="space-y-5">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <p className='border border-accent bg-accent/10 text-foreground/90 rounded-md p-0.5 text-center'>{getDariItemType(item.item_type)}</p>
                                                    <p className='border border-accent bg-accent/10 text-foreground/90 rounded-md p-0.5 text-center'>{item.sku}</p>
                                                    {item.item_type === 'product' && <p className='border border-accent bg-accent/10 text-foreground/90 rounded-md p-0.5 text-center'>{item.product?.weight}</p>}
                                                    {item.item_type === 'product' && <p className='border border-accent bg-accent/10 text-foreground/90 rounded-md p-0.5 text-center'>{item.product?.per_pack}</p>}
                                                    <p className='border border-accent bg-accent/10 text-foreground/90 rounded-md p-0.5 text-center'>{item.default_sale_price}</p>
                                                    <p className='border border-accent bg-accent/10 text-foreground/90 rounded-md p-0.5 text-center'>{item.category.name}</p>
                                                </div>
                                                <div className="flex flex-col space-x-3 p-3 bg-secondary rounded-sm shadow">
                                                    {item.inventory_balances.map((balance, ind) => <ul key={ind} className="flex justify-between items-center">
                                                        <li className={`${locationColor(balance.location.name)}`}>{LocationTranslator(balance.location.name)}</li>
                                                        <li>{balance.quantity_on_hand} {getDariItemUnit(item.unit)}</li>
                                                        <li>{balance.reserved}</li>
                                                    </ul>)}
                                                </div>
                                            </div>
                                            <div className='pt-5 px-1 flex justify-between items-center'>
                                                <p className="text-sm">{(item.default_sale_price * totalStock(item)).toFixed(2)} جمله پول</p>
                                                <p className="text-sm">{totalStock(item)} جمله  {getDariItemUnit(item.unit)} </p>
                                            </div>
                                        </div>
                                    </div>) : <p className='text-sm text-center text-muted-foreground p-3  w-full  flex justify-center items-center'> <SearchX></SearchX>ریکورد موجود نیست! </p>}
                            </div>

                            {/*  ============================  PAGINATION SECTION ==================== */}
                            <PageLinks links={items.links}/>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    )
}

export default Index