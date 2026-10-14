import { getDariItemType, getDariItemUnit } from '@/components/location-translator';
import PageHead from '@/components/page-head';
import PageLinks from '@/components/page-links';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Item } from '@/types/item';
import {  router, usePage } from '@inertiajs/react';
import { ArrowUpDown, PackagePlus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  items: {
    data: Item[];
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
  const [allItems, setAllItems] = useState<Item[]>(items.data);

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
  const userRole = usePage().props.auth.role;

  const canModifyItems: boolean = ['admin', 'super_admin'].includes(userRole);
  return (
    <AppLayout breadcrumbs={[
      { title: 'کارخانه', href: '/factory/home' },
      { title: 'اجناس', href: '/items' }
    ]}>
      <div className="py-5 px-2 md:px-5">
   <PageHead
          HeadIcon={PackagePlus}
          subtitle='اجناس شرکت'
          title='لیست اجناس '
          description='اجناس که فروخت در شرکت میشه لیست شان ذیل است'
          actionTitle='جنس جدید'
          actionURL='/items/create'
        />
        <section className="max-w-5xl mx-auto mt-8" dir='rtl'>
          <div className=" grid grid-cols-1 gap-5 ">
            <div className="flex gap-2 ">
              <Input className='bg-white shadow-xl h-12 ' placeholder='جستجوی اجناس به اساس نام، اسکی یو، بار کود  و کد نمبر' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              {/* <Link href={'/items/create'} className={`shadow-xl bg-white ${buttonVariants({ variant: 'secondary' })} `}>جنس جدید</Link> */}

            </div>
            <div className='bg-white shadow-xl border rounded-xl'>
              <Table className=" mt-5 ">
                <TableHeader>
                  <TableRow>
                    <TableHead className="">
                      <div className="flex justify-center items-center gap-1">
                        <ArrowUpDown className="size-4" />
                        <span>اسکی یو</span>
                      </div>
                    </TableHead>
                    <TableHead className="">
                      <div className="flex justify-center items-center gap-1">
                        <ArrowUpDown className="size-4" />
                        <span>جنس</span>
                      </div>
                    </TableHead>
                    <TableHead className="">
                      <div className="flex justify-center items-center gap-1">
                        <ArrowUpDown className="size-4" />
                        <span>نوع</span>
                      </div>
                    </TableHead>
                    <TableHead className="">
                      <div className="flex justify-center items-center gap-1">
                        <ArrowUpDown className="size-4" />
                        <span>کود</span>
                      </div>
                    </TableHead>
                    <TableHead className="">
                      <div className="flex justify-center items-center gap-1">
                        <ArrowUpDown className="size-4" />
                        <span>واحد جنس</span>
                      </div>
                    </TableHead>
                    <TableHead className="">
                      <div className="flex justify-center items-center gap-1">
                        <ArrowUpDown className="size-4" />
                        <span>نرخ فروش</span>
                      </div>
                    </TableHead>
                    <TableHead className="">
                      <div className="flex justify-center items-center gap-1">
                        <ArrowUpDown className="size-4" />
                        <span>وزن</span>
                      </div>
                    </TableHead>
                    <TableHead className="">
                      <div className="flex justify-center items-center gap-1">
                        <ArrowUpDown className="size-4" />
                        <span>مقدار پر پیک</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allItems.length > 0 ? allItems.map((item, ind) =>
                    <TableRow key={ind} onClick={()=>{
                      if(userRole==='admin' || userRole==='super_admin'){
                        router.get(`/items/${item.id}/edit`)
                      }
                    }}>
                      <TableCell className="text-center">{item.sku}</TableCell>
                      <TableCell className="text-center">{item.name}</TableCell>
                      <TableCell className={`text-center ${item.item_type === 'product' ? 'text-green-500' : item.item_type === 'raw_material' ? 'text-blue-500' : 'text-pink-500'}`}>{getDariItemType(item.item_type)}</TableCell>
                      <TableCell className="text-center">{item.code}</TableCell>
                      <TableCell className="text-center">{getDariItemUnit(item.unit)}</TableCell>
                      <TableCell className="text-center">{item.default_sale_price}</TableCell>
                      <TableCell className="text-center">{item.product?.weight ?? 'N/A'}</TableCell>
                      <TableCell className="text-center">{item.product?.per_pack ?? 'N/A'}</TableCell>
                    </TableRow>
                  ) : <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-center text-sm p-5">
                      ریکورد وجود ندارد
                    </TableCell>
                  </TableRow>}
                </TableBody>
              </Table>
          <PageLinks links={items.links} className='py-5'/>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>

  )
}

export default Index