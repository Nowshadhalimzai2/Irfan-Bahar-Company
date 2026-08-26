import { SectionTitle } from '@/components/section-title';
import AppLayout from '@/layouts/app-layout';
import { ProductionOrder, Waste } from '@/types';
import React from 'react'

interface Props {
    production_order: {
        id: number;
        reference_no: string;
        ordered_by: string;
        wastes: Waste[];
    };
}
const Show = ({ production_order }: Props) => {
    console.log(production_order);
    
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'کارخانه', href: '/factory/home' },
                { title: 'لیست سفارشات', href: '/factory/production-orders' },
                { title: 'سفارش ' + production_order.ordered_by, href: '/factory/production-orders/' + production_order.id },
                { title: 'ضایعات سفارش' + production_order.ordered_by, href: '/factory/wastes/' + production_order.id + '/show' },
            ]}
        >
            <div className='max-w-4xl mx-auto p-5'>
                <section>
                    <div>
                        <SectionTitle title={'ضایعات صفارش '+production_order.ordered_by} />
                        <div>
                            {production_order.wastes[0].reason}
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    )
}

export default Show