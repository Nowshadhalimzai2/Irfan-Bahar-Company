import { getDariItemUnit } from '@/components/location-translator';
import { SectionTitle } from '@/components/section-title';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Item } from '@/types/item';
import { Link } from '@inertiajs/react';
import { ArrowUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  items: {
    data: Item[];

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

  return (
    <AppLayout breadcrumbs={[
      { title: 'دشبورد', href: '/dashboard' },
      { title: 'اجناس', href: '/items' }
    ]}>
      <div className=" section">
        <section className="section">
          {/* <div className="flex justify-end items-end px-10">
          </div> */}
          <SectionTitle title='لیست اجناس ' />
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <Input placeholder='جستجوی اجناس به اساس نام، اسکی یو، بار کود  و کد نمبر' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <Link href={'/items/create'} className={`${buttonVariants({ variant: 'secondary' })} `}>جنس جدید</Link>

            </div>
            <Table className=" mt-5">
              <TableHeader>
                <TableRow>
                  <TableHead className="">
                    <div className="flex justify-center items-center gap-1">
                      <ArrowUpDown className="size-4" />
                      <span>SKU</span>
                    </div>
                  </TableHead>
                  <TableHead className="">
                    <div className="flex justify-center items-center gap-1">
                      <ArrowUpDown className="size-4" />
                      <span>Item</span>
                    </div>
                  </TableHead>
                  <TableHead className="">
                    <div className="flex justify-center items-center gap-1">
                      <ArrowUpDown className="size-4" />
                      <span>Type</span>
                    </div>
                  </TableHead>
                  <TableHead className="">
                    <div className="flex justify-center items-center gap-1">
                      <ArrowUpDown className="size-4" />
                      <span>Code</span>
                    </div>
                  </TableHead>
                  <TableHead className="">
                    <div className="flex justify-center items-center gap-1">
                      <ArrowUpDown className="size-4" />
                      <span>Unit</span>
                    </div>
                  </TableHead>
                  <TableHead className="">
                    <div className="flex justify-center items-center gap-1">
                      <ArrowUpDown className="size-4" />
                      <span>Default Price</span>
                    </div>
                  </TableHead>
                  <TableHead className="">
                    <div className="flex justify-center items-center gap-1">
                      <ArrowUpDown className="size-4" />
                      <span>Weight</span>
                    </div>
                  </TableHead>
                  <TableHead className="">
                    <div className="flex justify-center items-center gap-1">
                      <ArrowUpDown className="size-4" />
                      <span>Per Pack</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allItems.length > 0 ? allItems.map((item, ind) =>
                  <TableRow key={ind}>
                    <TableCell className="text-center">{item.sku}</TableCell>
                    <TableCell className="text-center">{item.name}</TableCell>
                    <TableCell className={`text-center ${item.item_type === 'product' ? 'text-green-500' : item.item_type === 'raw_material' ? 'text-blue-500' : 'text-pink-500'}`}>{item.item_type}</TableCell>
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
          </div>
        </section>
      </div>
    </AppLayout>

  )
}

export default Index