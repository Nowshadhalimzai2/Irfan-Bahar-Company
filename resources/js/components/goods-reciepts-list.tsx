import { GoodsReceipt } from '@/types/item';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LocationTranslator from '@/components/location-translator';
import { SectionTitle } from '@/components/section-title';
import { buttonVariants } from '@/components/ui/button';
import { Link, router } from '@inertiajs/react';
import PageLinks from './page-links';



interface Props {
    goodsReceipts: {
        data: GoodsReceipt[];
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
const GoodsReceiptList = ({ goodsReceipts }: Props) => {
    return (
        <section>
            <div className="">
                <div className="flex justify-end gap-3 items-end p-5">
                    <Link href={'/receipts/create'} className={`${buttonVariants({ variant: 'outline' })}`}>خریدن جنس نو</Link>
                    <Link href={'/transfers/create'} className={`${buttonVariants({ variant: 'secondary' })}`}>جنس را انتقال دهید</Link>

                </div>
                <SectionTitle title='اجناس امده برای شرکت' />
                <div className="max-w-4xl mx-auto p-5">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>شماره</TableHead>
                                <TableHead>تأمین کننده</TableHead>
                                <TableHead>منزل</TableHead>
                                <TableHead>نمبر حواله</TableHead>
                                <TableHead>تاریخ امد</TableHead>

                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {goodsReceipts.data.length > 0 ? goodsReceipts.data.map((receipt, ind) =>
                                <TableRow key={ind} onClick={() => router.get('/receipts/' + receipt.id)}>
                                    <TableCell>{ind + 1}</TableCell>
                                    <TableCell>{receipt.supplier.name}</TableCell>
                                    <TableCell >{LocationTranslator(receipt.location.name)}</TableCell>
                                    <TableCell>{receipt.reference_no}</TableCell>
                                    <TableCell>{new Date(receipt.received_at).toLocaleString()}</TableCell>
                                </TableRow>
                            ) : <TableRow>
                                <TableCell colSpan={5}><p className="text-muted-foreground text-center p-5 w-full"> No Receiptions </p></TableCell>
                            </TableRow>}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={6}>
                                   <PageLinks links={goodsReceipts.links} />
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

export default GoodsReceiptList