import { Head } from '@inertiajs/react';

import { dashboard } from '@/routes';
import { CustomeDropDownMenu } from '@/components/customer-dropdwon';


export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
             <div className="flex justify-end items-end">
                 <CustomeDropDownMenu items={[{name:'Logs',url:'/logs'}]} deletion={{id:1,url:'/log/1'}}/>
             </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
