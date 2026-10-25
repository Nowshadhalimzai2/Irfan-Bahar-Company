import { DayPicker } from '@daypicker/persian';
import '@daypicker/react/style.css';
import { CalendarDays } from 'lucide-react';
import { useState } from 'react';

interface PersianDatePickerProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
}

export function parseGregorianDate(value: string): Date | undefined {
    if (!value) {
        return undefined;
    }

    const [year, month, day] = value.slice(0, 10).split('-').map(Number);

    if (!year || !month || !day) {
        return undefined;
    }

    return new Date(year, month - 1, day);
}

export function formatGregorianDate(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function formatPersianDate(value?: string): string {
    const date = value ? parseGregorianDate(value) : undefined;

    return date
        ? date.toLocaleDateString('fa-AF-u-ca-persian', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : 'تاریخ انتخاب نشده';
}

export function PersianDatePicker({ id, value, onChange }: PersianDatePickerProps) {
    const [open, setOpen] = useState(false);
    const selected = parseGregorianDate(value);

    return (
        <div className="relative">
            <button
                id={id}
                type="button"
                onClick={() => setOpen((isOpen) => !isOpen)}
                className="flex h-11 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-right text-sm"
                aria-haspopup="dialog"
                aria-expanded={open}
            >
                <CalendarDays className="size-4 text-muted-foreground" />
                <span>{formatPersianDate(value)}</span>
            </button>
            {open && (
                <div className="absolute right-0 top-full z-50 mt-2 rounded-xl border bg-popover p-2 shadow-lg" dir="rtl">
                    <DayPicker
                        mode="single"
                        selected={selected}
                        onSelect={(date) => {
                            if (date) {
                                onChange(formatGregorianDate(date));
                                setOpen(false);
                            }
                        }}
                        dir="rtl"
                    />
                </div>
            )}
        </div>
    );
}
