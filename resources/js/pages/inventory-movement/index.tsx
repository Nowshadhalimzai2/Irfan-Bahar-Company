import { InventoryMovement } from '@/types';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SectionTitle } from '@/components/section-title';
import { buttonVariants } from '@/components/ui/button';
import { Link, router } from '@inertiajs/react';
import PageLinks from '@/components/page-links';
import LocationTranslator from '@/components/location-translator';
import AppLayout from '@/layouts/app-layout';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';

interface Props {
    movements: {
        data: InventoryMovement[];
        current_page: number;
        from: number;
        last_page: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
    }
}
const Index = ({ movements }: Props) => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [allMovements, setAllMovements] = useState<InventoryMovement[]>(movements.data);
    useEffect(() => {
        const normalizedTerm = searchTerm.trim().toLowerCase();
        if (normalizedTerm === '') {
            setAllMovements(movements.data);
            return;
        }

        const terms = normalizedTerm.split(/\s+/).filter(Boolean);
        const filteredData = movements.data.filter((movement) => {
            const rowText = [
                movement.item.name,
                movement.reference_no,
                movement.movement_type,
                new Date(movement.occured_at).toLocaleDateString(),
                movement.location.name,
            ]
                .join(' ')
                .toLowerCase();

            return terms.every((term) => rowText.includes(term));
        });

        setAllMovements(filteredData);
    }, [searchTerm]);
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'تبادله اجناس ', href: '/inventory-movements' }
            ]}
        >
            <section>
                <div className="">

                    <SectionTitle title='اجناس تبادله شده در شرکت' description='در این بخش شما دیده میتانین که چیز از کجا رفته به کجا. و همچنان چه مصرف شده و چه تولید شده' />
                    <div className="max-w-4xl mx-auto p-5">
                        <div className="flex gap-2 relative">
                            <Input autoFocus className="pl-10" placeholder='جستجوی انتقالات به اساس جنس، موقیعت، حواله نمبر، نوع انتقال، و تاریخ میتانین' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <Search className="absolute top-2 left-2 text-gray-400" />
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>شماره</TableHead>
                                    <TableHead>جنس</TableHead>
                                    <TableHead>موقعیت</TableHead>
                                    <TableHead>مقدار</TableHead>
                                    <TableHead>نوع انتقال</TableHead>
                                    <TableHead>نمبر حواله</TableHead>
                                    <TableHead>تاریخ انتقال</TableHead>

                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allMovements.length > 0 ? allMovements.map((move, ind) =>
                                    <TableRow key={ind}>
                                        <TableCell>{ind + 1}</TableCell>
                                        <TableCell >{move.item.name}</TableCell>
                                        <TableCell >{LocationTranslator(move.location.name)}</TableCell>
                                        <TableCell>{move.quantity}</TableCell>
                                        <TableCell>{move.movement_type}</TableCell>
                                        <TableCell>{move.reference_no}</TableCell>
                                        <TableCell>{new Date(move.occured_at).toLocaleString()}</TableCell>
                                    </TableRow>
                                ) : <TableRow>
                                    <TableCell colSpan={7}><p className="text-muted-foreground text-center p-5 w-full">رکورد وجود ندارد!ظ</p></TableCell>
                                </TableRow>}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={8}>
                                        <PageLinks links={movements.links} />
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                    <div>
                    </div>
                </div>
            </section>
        </AppLayout>
    )
}

export default Index