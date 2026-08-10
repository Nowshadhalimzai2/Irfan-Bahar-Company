import { SectionTitle } from '@/components/section-title';
import { buttonVariants } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { show } from '@/routes/employees';
import { GoodsReceipt } from '@/types/item';
import { Link, router } from '@inertiajs/react';

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
const Index = ({ goodsReceipts }: Props) => {

    return (
        <AppLayout breadcrumbs={[
            { title: 'اموال امده', href: '/receipts' }
        ]}>
            <section>
                <div className="section">
                    <div className="flex justify-end gap-3 items-end p-5">
                        <Link href={'/receipts/create'} className={`${buttonVariants({ variant: 'outline' })}`}>خریدن جنس نو</Link>
                        <Link href={'/receipts/create'} className={`${buttonVariants({ variant: 'secondary' })}`}>جنس را انتقال دهید</Link>

                    </div>
                    <SectionTitle title='اموال امده برای شرکت' />
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
                                    <TableRow key={ind} onClick={()=>router.get('/receipts/'+receipt.id)}>
                                        <TableCell>{ind + 1}</TableCell>
                                        <TableCell>{receipt.supplier.name}</TableCell>
                                        <TableCell>{receipt.location.name}</TableCell>
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