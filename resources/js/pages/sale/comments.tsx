import PageHead from '@/components/page-head';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { MessageCircleDashed, MessageSquareText, TrendingUp } from 'lucide-react';

type Comment = { saleID: number, name: string; text: string; time: string };

interface Props {
    comments: Comment[];
}
const Comments = ({ comments }: Props) => {


    const getTime = (time: string): string => {
        const splittedTime = time.split(' ');
        let period: string = '';
        switch (splittedTime[1].trim().toString()) {
            case 'seconds':
                period = 'ثانیه پیش';;
                break
            case 'minutes':
                period = 'دقیقه پیش';
                break
            case 'hours':
                period = 'ساعت پیش';
                break
            case 'days':
                period = 'روز پیش';
                break
            case 'week':
                period = 'هقته پیش';
                break
            case 'months':
                period = 'میاشت پیش';
                break
            default:
                period = splittedTime[1];
        }

        return [splittedTime[0], '', period].join(' ');
    }

    console.log(comments[0].time.split(' ')[1]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'فروشات', href: '/sales' },
                { title: 'محصولات ُپرفروش', href: '/sales/comments' }

            ]}
        >
            <PageHead
                HeadIcon={MessageCircleDashed}
                title='یاداشت فروشات'
                subtitle='یاداشت های که قابل بررسی است'
                description='یاداشت های ذیل ثبت شده هنګام فروشات '
                key={0}
            />
            <section className='mt-8 md:px-4 px-0'>
                <div dir='rtl' className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md sm:p-6 dark:border-slate-700 dark:bg-slate-900">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                یادداشت‌های تیم
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                آخرین نظرها درباره سفارش‌ها
                            </p>
                        </div>
                        <button
                            title="افزودن یادداشت"
                            className="rounded-lg bg-blue-50 p-2 text-primary hover:bg-blue-100"
                        >
                            <MessageSquareText className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="space-y-1">
                        {comments.map((comment) => (
                            <div key={comment.name} className="flex gap-3 border hover:border-muted-foreground p-2 rounded-sm transition-all" >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                    {comment.name.slice(0, 1)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                            {comment.name}
                                        </p>
                                        <button
                                            onClick={(e) => confirm('نوت را خذف کند؟') && router.patch(`/sales/${comment.saleID}/notes`, {}, {
                                                preserveScroll: true,

                                                preserveState: true,
                                            })}
                                            className='font-medium text-xs py-1 underline text-primary rounded-sm shrink-0 hover:bg-primary/10'>
                                            تکمیل و خذف
                                        </button>

                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            {comment.text}
                                        </p>
                                        <span className="shrink-0 text-[10px] text-slate-400">
                                            {getTime(comment.time)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        className="mt-5 w-full border-dashed text-xs text-slate-600"
                        onClick={() => router.get('/sales')}
                    >
                        <MessageSquareText className="h-4 w-4" />
                        بازګشت به فروشات
                    </Button>
                </div>
            </section>
        </AppLayout>

    )
}

export default Comments