import PageHead from '@/components/page-head';
import AppLayout from '@/layouts/app-layout';
import { Supplier } from '@/types';
import { Coins, Gift, GitBranchIcon } from 'lucide-react';
import React from 'react'
interface Props {
    supplier: Supplier;
}
const Show = ({ supplier }: Props) => {
    return (

        <AppLayout >
            <div className='px-1 md:px-3'>
                <PageHead
                    subtitle={" حساب "+supplier.name}
                    title="تامیین کننده"
                    description="بیشتر معلومات تامیین کننده و اجناس که امده به شرکت"
                    HeadIcon={Gift}
                    tone={'yellow'}
                    ActionIcon={Coins}
                    actionTitle='پرداخت پول'
                    actionURL="#"
                />

                <div>
                    Hello {supplier.name}
                </div>
            </div>
        </AppLayout>
    )
}

export default Show