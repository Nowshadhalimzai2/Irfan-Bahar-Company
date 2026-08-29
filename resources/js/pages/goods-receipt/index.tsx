
import GoodsReceiptList from '@/components/goods-reciepts-list';
import TransferList from '@/components/transfer-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { GoodsReceipt, Transfer } from '@/types/item';

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
const Index = ({ goodsReceipts,transfers }: Props) => {
    
    return (
        <AppLayout breadcrumbs={[
            { title: 'انتقالات ', href: '/receipts' }
        ]}>

            <div className="px-5 py-10">

                <Tabs defaultValue="transfers" className="w-full px-2 md:px-8">
                    <TabsList className="flex justify-between items-center w-full">
                        <TabsTrigger value="transfers">انتقالات داخلی</TabsTrigger>
                        <TabsTrigger value="receipts"> اجناس امده</TabsTrigger>
                    </TabsList>
                    <TabsContent value="transfers">
                        <TransferList transfers={transfers}/>
                    </TabsContent>
                    <TabsContent value="receipts">
                        <GoodsReceiptList goodsReceipts={goodsReceipts} />
                    </TabsContent>
                </Tabs>

            </div>
        </AppLayout>
    )
}

export default Index