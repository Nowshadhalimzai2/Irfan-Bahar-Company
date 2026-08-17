import LocationTranslator, { getDariCategory, getDariItemType, getDariItemUnit, locationColor } from "@/components/location-translator";
import PageLinks from "@/components/page-links";
import { SectionTitle } from "@/components/section-title";
import { buttonVariants } from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";
import { InventoryBalance, ProductionOrder } from "@/types";
import { Item } from "@/types/item";
import { Link } from "@inertiajs/react";
import { da } from "date-fns/locale";
import { SearchX } from "lucide-react";
import { useState } from "react";

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
  pendingOrders: ProductionOrder[];
}
const Home = ({ pendingOrders, items }: Props) => {

  const [allItems, setAllItems] = useState<ItemWithInventory[]>(items.data);
  const totalStock = (item: ItemWithInventory) => {
    return item.inventory_balances.reduce((acc, balance) => acc + (balance.quantity_on_hand - balance.reserved), 0);
  }
  return (
    <AppLayout breadcrumbs={[
      { title: 'کارخانه', href: '/factory/home' },
    ]}>
      <div className="p-3">
        <div>
          <SectionTitle title="کارخانه" />
          <div className="flex flex-col-reverse md:flex-row  justify-start items-start gap-2">

            {/*   ========================== AVAILABLE ITEMS IN FACTORY ================= */}
            <section className="md:w-3/5 w-full border rounded-sm text-center p-2">
              <h4 className="text-lg font-semibold text-center p-2 text-accent bg-accent-foreground">اجناس موجوده در کارخانه</h4>

              <div className={`grid grid-cols-1 ${allItems.length > 0 ? 'lg:grid-cols-2' : ' lg:grid-cols-1'} gap-3 md:gap-2 mt-5`}>
                {allItems.length > 0 ? allItems.map((item, ind) =>
                  <div className="Card space-y-3  flex flex-col  border rounded-md shadow-xl" key={ind}>
                    <div className="relative bg-secondary rounded-sm overflow-hidden">
                      <img src={"https://picsum.photos/275/60"} alt="" />
                      <h2 className="font-bold underline underline-offset-5 absolute top-2 left-20 text-center text-lg p-2 text-primary">{item.name}</h2>

                    </div>
                    <div className="p-2">
                      <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-2">
                          <p className='border text-sm border-accent bg-accent/10 text-foreground/90 rounded-md p-0.5 text-center'>{getDariItemType(item.item_type)}</p>
                          <p className='border text-sm border-accent bg-accent/10 text-foreground/90 rounded-md p-0.5 text-center'>{item.sku}</p>
                          {item.item_type === 'product' && <p className='border border-accent bg-accent/10 text-foreground/90 text-sm rounded-md p-0.5 text-center'>{item.product?.weight}</p>}
                          {item.item_type === 'product' && <p className='border border-accent bg-accent/10 text-foreground/90 text-sm rounded-md p-0.5 text-center'>{item.product?.per_pack}</p>}
                          <p className='border text-sm border-accent bg-accent/10 text-foreground/90 rounded-md p-0.5 text-center'>{item.default_sale_price}</p>
                          <p className='border text-sm border-accent bg-accent/10 text-foreground/90 rounded-md p-0.5 text-center'>{getDariCategory(item.category.name)}</p>
                        </div>
                        <div className="flex flex-col space-x-2 p-3 bg-secondary rounded-sm shadow">
                          {item.inventory_balances.map((balance, ind) => <ul key={ind} className="flex justify-between items-center">
                            <li className={`${locationColor(balance.location.name)}`}>{LocationTranslator(balance.location.name)}</li>
                            <li className="text-sm">{balance.quantity_on_hand} {getDariItemUnit(item.unit)}</li>
                            <li className="text-sm">{balance.reserved}</li>
                          </ul>)}
                        </div>
                      </div>
                      <div className='pt-5 px-1 flex justify-between items-center'>
                        <p className="text-sm">{item.default_sale_price * totalStock(item)} جمله پول</p>
                        <p className="text-sm">{totalStock(item)} جمله  {getDariItemUnit(item.unit)} </p>
                      </div>
                    </div>
                  </div>) : <p className='text-sm text-center text-muted-foreground p-3  w-full  flex justify-center items-center'> <SearchX />ریکورد موجود نیست! </p>
                }
              </div>

              <div className="mt-5 py-3"><PageLinks links={items.links} /></div>
            </section>

            {/* ===========   NEW ORDERS LIST  ============= */}
            <section className="md:w-2/5 w-full border rounded-sm text-center p-2">
              <div>
                <h4 className="text-lg font-semibold text-center p-2 text-accent bg-accent-foreground">حوالات اجناس</h4>
                <div className="ORDERLIST">
                  <div className="CREATE-NEW-ORDER flex justify-end items-end mt-2">
                    <Link href={'/factory/production_orders/create'} className={`${buttonVariants({ variant: 'secondary' })} `} >حواله جدید</Link>
                  </div>
                  <div className="LIST py-3">
                    <div>
                      {pendingOrders.length> 0 ?pendingOrders.map(order =>
                        <div className="flex justify-between items-center p-2 rounded-sm bg-secondary text-secondary-foreground border">
                          <div>{order.ordered_by}</div>
                          <div>{order.bom.category.name}</div>
                          <div>{order.production_outputs.reduce((acc,output)=>acc+=output.quantity_produced,0)}</div>
                          <div>{new Date(order.order_date).toDateString()}</div>
                        </div>
                      ):
                        <p className="text-center text-sm text-muted-foreground">کدام حواله در حال منتظر موجود نیست!</p>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

    </AppLayout>
  )
}

export default Home