import { StatusType } from "@/types";

export const statusController = (status: StatusType): { value: StatusType, label: string }[] => {

    if (status === 'pending')
        return [
            { value: 'pending', label: 'منتظر' },
            { value: 'progress', label: 'جریان' },
            { value: 'completed', label: 'تکمیل شده' },
            { value: 'cancelled', label: 'لغو شده' },
        ];
    else if (status === 'progress')
        return [
            { value: 'completed', label: 'تکمیل شده' },
            { value: 'drafted', label: 'پیش نویس شده' },
        ];
    else if (status === 'completed')
        return [
            { value: 'completed', label: 'تکمیل شده' },
        ];
    else if (status === 'drafted')
        return [
            { value: 'pending', label: 'منتظر' },
            { value: 'progress', label: 'جریان' },
            { value: 'drafted', label: 'پیش نویس شده' },
        ];
    else
        return [
            { value: 'cancelled', label: 'لغو شده' },
        ]

}