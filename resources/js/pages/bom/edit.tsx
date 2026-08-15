import AppLayout from '@/layouts/app-layout';
import { BOM } from '@/types';
import React from 'react'

interface Props {
    bom: BOM;
}
const Edit = ({ bom }: Props) => {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'دشبورد', href: '/dashbaord' },
                { title: 'لیست فورموله ها', href: '/boms' },
                { title: bom.formula_name, href: '/boms/' + bom.id },
                { title: 'ویرایش فورمول', href: '/boms/' + bom.id +'/edit' },


            ]}
        >
            <div>Edit</div>

        </AppLayout>
    )
}

export default Edit