import { InventoryMovement } from '@/types';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SectionTitle } from '@/components/section-title';
import { buttonVariants } from '@/components/ui/button';
import { Link, router } from '@inertiajs/react';
import PageLinks from './page-links';
import LocationTranslator from './location-translator';

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
const goodsReceiptsList = ({ movements }: Props) => {
    return (
        <section>
            <div className="">
                <div className="flex justify-end gap-3 items-end p-5">
                    <Link href={'/receipts/create'} className={`${buttonVariants({ variant: 'outline' })}`}>خریدن جنس نو</Link>
                    <Link href={'/transfers/create'} className={`${buttonVariants({ variant: 'secondary' })}`}>جنس را انتقال دهید</Link>

                </div>
                <SectionTitle title='اجناس انتقال شده در شرکت' />
                <div className="max-w-4xl mx-auto p-5">
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
                            {movements.data.length > 0 ? movements.data.map((move, ind) =>
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
                                <TableCell colSpan={7}><p className="text-muted-foreground text-center p-5 w-full"> No Receiptions </p></TableCell>
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
    )
}

export default goodsReceiptsList