import { SectionTitle } from '@/components/section-title';
import AppLayout from '@/layouts/app-layout';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InventoryBalance } from '@/types';
import { router } from '@inertiajs/core';
import LocationTranslator, { locationColor } from '@/components/location-translator';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, SearchSlash } from 'lucide-react';

interface Props {
    inventoryBalances: InventoryBalance[];
}
const Index = ({ inventoryBalances }: Props) => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [allBalances, setAllBalances] = useState<InventoryBalance[]>(inventoryBalances);

    useEffect(() => {
        if (searchTerm === '')
            setAllBalances(inventoryBalances);
        else {
            const filteredData = inventoryBalances.filter((balance) => balance.item.name.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
                balance.item.sku.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
                balance.item.code.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
                (balance.item.product?.barcode && balance.item.product.barcode.toLowerCase().includes(searchTerm.trim().toLowerCase()))
            );
            setAllBalances(filteredData);
        }
    }, [searchTerm]);
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
                                <Input className="pl-10" placeholder='جستجوی اجناس به اساس نام، اسکی یو، بار کود  و کد نمبر' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                <Search className="absolute top-2 left-2 text-gray-400" />
                                {/* <Link href={'/items/create'} className={`${buttonVariants({ variant: 'secondary' })} `}>جنس جدید</Link> */}
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center">اسکی یو</TableHead>
                                        <TableHead className="text-center">جنس</TableHead>
                                        <TableHead className="text-center">وزن</TableHead>
                                        <TableHead className="text-center">موقعیت</TableHead>
                                        <TableHead className="text-center">مقدار</TableHead>
                                        <TableHead className="text-center">واحد جنس</TableHead>
                                        <TableHead className="text-center">تاریخ به روز رسانی شده</TableHead>

                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allBalances.length > 0 ? allBalances.map((invBalance, ind) =>
                                        <TableRow key={ind}>
                                            <TableCell className="text-center">{invBalance.item.sku}</TableCell>
                                            <TableCell className="text-center">{invBalance.item.name}</TableCell>
                                            <TableCell className="text-center">{invBalance.item.product?.weight}</TableCell>
                                            <TableCell className={`text-center ${locationColor(invBalance.location.name)}`}>{LocationTranslator(invBalance.location.name)}</TableCell>
                                            <TableCell className="text-center">{invBalance.quantity_on_hand}</TableCell>
                                            <TableCell className="text-center">{invBalance.item.unit}</TableCell>
                                            <TableCell className="text-center">{new Date(invBalance.updated_at).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ) : <TableRow>
                                        <TableCell colSpan={5}><p className="text-muted-foreground text-center p-5 w-full"> No Receiptions </p></TableCell>
                                    </TableRow>}
                                </TableBody>
                                {/* <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={6}>
                                            <div className="flex justify-center items-center space-x-2">
                                                {goodsReceipts.links.map((link, index) => (
                                                    <a
                                                        key={index}
                                                        href={link.url ?? '#'}
                                                        className={`px-3 py-1.5 border rounded ${link.active ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                                                    >
                                                        {link.label.includes('Next') ? 'Next' : link.label.includes('Previous') ? 'Previous' : link.label}
                                                    </a>
                                                ))}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </TableFooter> */}
                            </Table>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    )
}

export default Index