
import GuestLayout from '@/layouts/guest-layout';
import { NavigationMenu } from '@/components/ui/navigation-menu';
import { usePage } from '@inertiajs/react';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { InputOTP, InputOTPGroup } from '@/components/ui/input-otp';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
          <GuestLayout >
                <div className="bg-white">
                    Hello Main
                    
                </div>
          </GuestLayout>
        </>
    );
}
