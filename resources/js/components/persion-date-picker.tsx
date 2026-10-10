
import { useState } from "react";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DatePickerModule from "react-multi-date-picker";

const DatePicker = (DatePickerModule as unknown as {
  default: typeof DatePickerModule;
}).default;

interface Props {
  type?: "date" | "month";
  value?: Date | null;
  initialDate?: Date;
  id?: string;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
  onChange?: (date: Date | null, persianDate: string | null) => void;
}

const persian_afghan = {
  ...persian_fa,
  name: "persian_afghan",
  months: [
    ["حمل", "حمل"],
    ["ثور", "ثور"],
    ["جوزا", "جوزا"],
    ["سرطان", "سرطان"],
    ["اسد", "اسد"],
    ["سنبله", "سنبله"],
    ["میزان", "میزان"],
    ["عقرب", "عقرب"],
    ["قوس", "قوس"],
    ["جدی", "جدی"],
    ["دلو", "دلو"],
    ["حوت", "حوت"],
  ],
};

const CURRENT_AFGHAN_DATE = new DateObject({
  date: new Date(),
  calendar: persian,
  locale: persian_afghan,
});

const PersionDatePicker = ({
  type = "date",
  value: selectedDate,
  initialDate,
  id = "persian-date",
  label = "تاریخ",
  minDate,
  maxDate,
  onChange,
}: Props) => {
  const [internalDate, setInternalDate] = useState<Date | null>(initialDate ?? null);
  const value = selectedDate === undefined ? internalDate : selectedDate;

  function handleChange(date: DateObject | null) {
    const normalizedDate = date && type === "month"
      ? new DateObject(date).setDay(1)
      : date;
    const gregorianDate = normalizedDate?.toDate() ?? null;

    if (selectedDate === undefined) {
      setInternalDate(gregorianDate);
    }

    onChange?.(
      gregorianDate,
      normalizedDate?.format(type === "month" ? "YYYY/MM" : "YYYY/MM/DD") ?? null,
    );
  }

  return (
    <div className="w-full space-y-2" dir="rtl">
        
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>

      <DatePicker
        id={id}
        calendar={persian}
        locale={persian_afghan}
        currentDate={CURRENT_AFGHAN_DATE}
        value={value}
        onChange={handleChange}
        onlyMonthPicker={type === "month"}
        minDate={minDate}
        maxDate={maxDate}
        format={type === "month" ? "YYYY/MM" : "YYYY/MM/DD"}
        calendarPosition="bottom-right"
        placeholder={type === "month" ? "سال/ماه" : "سال/ماه/روز"}
        inputMode="numeric"
        inputClass="h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-foreground shadow-md outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
        containerClassName="w-full"
      />
    </div>
  );
};

export default PersionDatePicker;
