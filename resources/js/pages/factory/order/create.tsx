import AppLayout from '@/layouts/app-layout';
import React from 'react'

const Create = () => {
  return (
    <AppLayout breadcrumbs={[
        {title:'کارخانه',href:'/factory/home'},
        {title:'حواله جدید',href:'/factory/production_orders/create'},
    ]}>
        <div>Create</div>
    </AppLayout>
  )
}

export default Create