import Bill from '@/components/bill/bill';
import Content from '@/components/bill/content';
import Footer from '@/components/bill/footer';
import Header from '@/components/bill/header';
import Overview from '@/components/bill/overveiw';
import LocationTranslator, { getDariItemUnit } from '@/components/location-translator';
import { SectionTitle } from '@/components/section-title';
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { unitType } from '@/types/item';
import { usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
type TransferLine = { id: number, itemName: string, quantity: number; unit_price: number, itemUnit: unitType, itemWeight: string, itemPerPack: number };
type TransferData = { id: number, source: string, destination: string, reference_no: string, transfered_at: Date, lines: TransferLine[], status: 'completed' | 'suggested' | 'cancelled',notes:string }
interface Props {
    transfer: TransferData;
}
const Show = ({ transfer }: Props) => {
    const { logo } = usePage().props;

    const getTransferStatus = (status: 'suggested' | 'cancelled' | 'completed') => status === 'suggested' ? 'پیشنهاد شده' : status === 'completed' ? 'تکمیل شده' : status === 'cancelled' ? 'لغو شده' : status;
    const getTransferStyle = (status: 'suggested' | 'cancelled' | 'completed') => status === 'suggested' ? 'text-yellow-500 hover:bg-yellow-50 hover:text-yellow-800' : status === 'completed' ? 'text-green-500' : status === 'cancelled' ? 'text-red-500' : '';

    return (
        <AppLayout breadcrumbs={[
            { title: 'انتقال اجناس', href: '/receipts' },
            { title: transfer.reference_no, href: '/transfers/' + transfer.id },
        ]}>
            <div>
                <section className="">
                    <div className="max-w-4xl mx-auto">
                        <Bill>
                            <Header logo={logo as string} title='انتقال اموال' />
                            <Overview className='px-6' >
                                <p className="font-medium">تاریخ : {new Date(transfer.transfered_at).toLocaleDateString('fa-AF')}</p>
                                <p className="font-medium">{LocationTranslator(transfer.source)} {<ArrowLeft className='inline'/>} {LocationTranslator(transfer.destination)}</p>
                                <p className={`font-medium`}>وضیعت : <span className={`${getTransferStyle(transfer.status)}`}>{getTransferStatus(transfer.status)}</span></p>
                                <p className={`font-medium`}> {transfer.reference_no}  : حواله نمبر  </p>
                            </Overview>

                            <Content status={transfer.status} title='انتقال جنس لغو شد'>
                                <div dir='rtl'>
                                    <Table>
                                        <TableCaption className='text-start'>{transfer.notes}</TableCaption>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-center">
                                                    شماره
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    جنس
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    مقدار
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    واحد جنس
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    وزن
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    پر کارتن
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    قیمت
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transfer.lines.map((line, ind) =>
                                                <TableRow key={ind}>
                                                    <TableCell className="text-center">{ind + 1}</TableCell>
                                                    <TableCell className="text-center">{line.itemName}</TableCell>
                                                    <TableCell className="text-center">{line.quantity}</TableCell>
                                                    <TableCell className="text-center">{getDariItemUnit(line.itemUnit)}</TableCell>
                                                    <TableCell className="text-center">{line.itemWeight ?? 'N/A'}</TableCell>
                                                    <TableCell className="text-center">{line.itemPerPack ?? 'N/A'}</TableCell>
                                                    <TableCell className="text-center">{line.unit_price}</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                       
                                    </Table>
                                </div>
                            </Content>
                        </Bill>
                        <div className="mt-5" dir='rtl'>

                            {/* <p className="text-end p-5 text-accent-foreground text-sm border-b">نوت : {transfer.notes}</p> */}

                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    )
}

export default Show