import { SectionTitle } from '@/components/section-title';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BOMLine, ProductionInput, ProductionOrder } from '@/types';
import { Item } from '@/types/item';
import { DeleteIcon } from 'lucide-react';
import { useState } from 'react'
interface Props {
    production_order: ProductionOrder;
    status: 'completed';
    items: Item[];
}
const ConfirmInput = ({ production_order, status, items }: Props) => {


    const [orderInputs, setOrderInputs] = useState<ProductionInput[]>(production_order.production_inputs);

    const removeInput = (input: ProductionInput) => {
        setOrderInputs(inputs => inputs.filter(inp => inp.id !== input.id));
    }


    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'لیست سفارشات', href: '/factory/production_orders' },
                { title: 'تائیدی مواد خام', href: '/factory/production_orders/' + production_order.id + '/confirm-order-inputs' },
            ]}
        >

            <div className='p-5'>
                <section>
                    <div>
                        <SectionTitle title='تائیدی مواد خام ' description='لطفا مواد خام را پیش از تکمیل نمودن سفارش چک و سبمت کنید ' />
                        <div className="max-w-4xl mx-auto p-3">
                            {/* inputs data */}

                            <Table className='border p-1 overflow-hidden'>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>شماره</TableHead>
                                        <TableHead>جنس</TableHead>
                                        <TableHead>مقدار</TableHead>
                                        <TableHead>حذف</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {orderInputs.map((input, ind) =>
                                        <TableRow key={ind}>
                                            <TableCell>{ind + 1}</TableCell>
                                            <TableCell>
                                                <Input className='border-none p-2 ring-0 rounded-none' readOnly tabIndex={orderInputs.length + ind} value={input.item.name} aria-readonly />
                                            </TableCell>
                                            <TableCell>
                                                <Input className='border-none p-2 ring-0 rounded-none'
                                                    type='number'
                                                    tabIndex={ind}
                                                    autoFocus={ind === 0}
                                                    value={input.quantity_used}
                                                    onChange={(e) => setOrderInputs(inputs => inputs.map(inp =>
                                                        inp.id === input.id
                                                            ? { ...inp, quantity_used: Number(e.target.value) }
                                                            : inp
                                                    ))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <DeleteIcon className='text-destructive' onClick={() => removeInput(input)} />
                                            </TableCell>
                                        </TableRow>
                                        //          <ُTableRow  key={input.id}>
                                        //     <TableCell>{ind + 1}</TableCell>
                                        //    
                                        //     <div className='flex justify-center items-center  gap-2'>
                                        //         <Input className='border-none p-2 ring-0 rounded-none'
                                        //             type='number'
                                        //             tabIndex={ind}
                                        //             autoFocus={ind === 0}
                                        //             value={input.quantity_used}
                                        //             onChange={(e) => setOrderInputs(inputs => inputs.map(inp =>
                                        //                 inp.id === input.id
                                        //                     ? { ...inp, quantity_used: Number(e.target.value) }
                                        //                     : inp
                                        //             ))}
                                        //         />
                                        //         <DeleteIcon className='text-destructive' onClick={() => removeInput(input)} />
                                        //     </div>

                                        // </ُTableRow>
                                    )
                                    }
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </section>
            </div >
        </AppLayout >
    )
}

export default ConfirmInput