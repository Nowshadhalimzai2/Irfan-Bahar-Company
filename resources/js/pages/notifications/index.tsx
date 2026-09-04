import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Bell, CheckCheck, Inbox } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

type NotificationItem = {
    id: string;
    title: string;
    message: string;
    url: string;
    read_at: string | null;
    created_at: string;
};

type Props = {
    notifications: {
        data: NotificationItem[];
        current_page: number;
        last_page: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
};

const Index = ({ notifications }: Props) => {
    const unreadCount = notifications.data.filter((notification) => !notification.read_at).length;

    return (
        <AppLayout breadcrumbs={[{ title: 'اعلان‌ها', href: '/notifications' }]}>
            <div className="min-h-screen space-y-6 bg-linear-to-b from-slate-50 via-background to-background p-3 md:p-6 dark:from-slate-950">
                <div className="mx-auto max-w-4xl">
                    <div className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-8 text-white shadow-xl md:px-10">
                        <div className="absolute -left-12 -top-16 h-48 w-48 rounded-full bg-rose-400/20 blur-3xl" />
                        <div className="relative flex items-end justify-between gap-4">
                            <div><div className="mb-3 flex items-center gap-2 text-sm font-medium text-rose-300"><Bell className="size-4" /> مرکز اطلاع‌رسانی</div><h1 className="text-3xl font-bold tracking-tight">اعلان‌ها</h1><p className="mt-2 text-sm text-slate-300">آخرین رویدادهای مهم سیستم را دنبال کنید.</p></div>
                            {unreadCount > 0 && <button type="button" onClick={() => router.post('/notifications/read-all')} className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs hover:bg-white/20"><CheckCheck className="size-4" /> خواندن همه</button>}
                        </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                        {notifications.data.length > 0 ? notifications.data.map((notification) => <div key={notification.id} className={`flex items-start gap-4 border-b p-5 last:border-0 ${notification.read_at ? 'opacity-65' : 'bg-primary/5'}`}><div className="rounded-xl bg-primary/10 p-3 text-primary"><Bell className="size-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{notification.title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.message}</p></div>{!notification.read_at && <span className="rounded-full bg-rose-100 px-2 py-1 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300">جدید</span>}</div><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</span><div className="flex items-center gap-3">{!notification.read_at && <button type="button" onClick={() => router.post(`/notifications/${notification.id}/read`)} className="text-xs text-primary hover:underline">علامت خوانده‌شده</button>}<Link href={notification.url} className={`${buttonVariants({ variant: 'outline', size: 'sm' })} gap-1`}>مشاهده <ArrowLeft className="size-3" /></Link></div></div></div></div>) : <div className="flex flex-col items-center gap-3 p-16 text-center text-muted-foreground"><Inbox className="size-10" /><p>اعلانی وجود ندارد.</p></div>}
                    </div>

                    {notifications.last_page > 1 && <div className="mt-4 flex flex-wrap justify-center gap-2">{notifications.links.map((link, index) => <Link key={index} href={link.url ?? '#'} className={`rounded-md border px-3 py-1.5 text-sm ${link.active ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>}
                </div>
            </div>
        </AppLayout>
    );
};

export default Index;
