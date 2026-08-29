import { Transfer } from '@/types/item';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LocationTranslator from '@/components/location-translator';
import { SectionTitle } from '@/components/section-title';
import { buttonVariants } from '@/components/ui/button';
import { Link, router } from '@inertiajs/react';
import PageLinks from './page-links';

interface Props {
    transfers: {
        data: Transfer[];
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
const TransferList = ({ transfers }: Props) => {
    return (
        <section>
            <div className="">
                <div className="flex justify-end gap-3 items-end p-5">
                    <Link href={'/transfers/create'} className={`${buttonVariants({ variant: 'secondary' })}`}>جنس را انتقال دهید</Link>
                </div>
                <SectionTitle title='اجناس انتقال شده در داخل شرکت' />
                <div className="max-w-4xl mx-auto p-5">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className='text-center'>شماره</TableHead>
                                <TableHead className='text-center'>مرجع</TableHead>
                                <TableHead className='text-center'>مقصود</TableHead>
                                <TableHead className='text-center'>نمبر حواله</TableHead>
                                <TableHead className='text-center'>تاریخ انتقال</TableHead>
                                <TableHead className='text-center'>جمله قیمت اجناس</TableHead>

                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transfers.data.length > 0 ? transfers.data.map((transfer, ind) =>
                                <TableRow key={ind} onClick={() => router.get('/transfers/' + transfer.id)}>
                                    <TableCell className='text-center'>{ind + 1}</TableCell>
                                    <TableCell className='text-center'>{LocationTranslator(transfer.source.name)}</TableCell>
                                    <TableCell className='text-center' >{LocationTranslator(transfer.destination.name)}</TableCell>
                                    <TableCell className='text-center'>{transfer.reference_no}</TableCell>
                                    <TableCell className='text-center'>{new Date(transfer.transferred_at).toLocaleString()}</TableCell>
                                    <TableCell className='text-center'>{transfer.transfer_lines.reduce((acc,line)=>acc+=line.unit_price,0)}</TableCell>
                                </TableRow>
                            ) : <TableRow>
                                <TableCell colSpan={5}><p className="text-muted-foreground text-center p-5 w-full"> کدام چیز تا حالی انتقال نشده. </p></TableCell>
                            </TableRow>}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={6}>
                                   <PageLinks links={transfers.links} />
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

export default TransferList