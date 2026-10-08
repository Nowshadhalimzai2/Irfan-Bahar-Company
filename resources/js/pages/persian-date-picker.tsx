import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import PersionDatePicker from '@/components/persion-date-picker';

export default function PersianDatePickerPage() {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [persianDate, setPersianDate] = useState<string | null>(null);

    return (
        <AppLayout breadcrumbs={[{ title: 'تقویم شمسی', href: '/persian-date-picker' }]}>
            <Head title="تقویم شمسی" />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6" dir="rtl">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">تقویم شمسی</h1>
                    <p className="mt-1 text-sm text-muted-foreground">تاریخ مورد نظر را انتخاب کنید.</p>
                </div>

                <div className="max-w-sm space-y-4">
                    <PersionDatePicker
                        value={selectedDate}
                        onChange={(date, formattedDate) => {
                            setSelectedDate(date);
                            setPersianDate(formattedDate);
                        }}
                        type='month'
                    />
                    {selectedDate && (
                        <p className="text-sm text-muted-foreground">
                            تاریخ میلادی: {selectedDate.toLocaleDateString()}
                            {persianDate && <span className="mr-3">تاریخ شمسی: {persianDate}</span>}
                        </p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
