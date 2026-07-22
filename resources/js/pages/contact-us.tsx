import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from '@/components/ui/skeleton';
import GuestLayout from "@/layouts/guest-layout";

const ContactUs = () => {
    return (
       <GuestLayout>
         <div className="flex justify-center items-center h-screen">
            <Card className="w-full max-w-xs">
                <CardHeader>
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="aspect-video w-full" />
                </CardContent>
            </Card>
        </div>
       </GuestLayout>
    )
}

export default ContactUs