<?php

namespace App\Services;

use Carbon\Carbon;
use DateTimeZone;
use InvalidArgumentException;
use Morilog\Jalali\Jalalian;

class PersianDateConverter
{
    /**
     * @return array{start: Carbon, end: Carbon}
     */
    public function toGregorianRange(string $persianDate, string $type, ?DateTimeZone $timezone = null): array
    {
        if (! in_array($type, ['date', 'month'], true)) {
            throw new InvalidArgumentException("Unsupported Persian date type: {$type}");
        }

        $persianDate = $this->toEnglishDigits($persianDate);
        $pattern = $type === 'date'
            ? '/^\d{4}\/(?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[12]\d|3[01])$/'
            : '/^\d{4}\/(?:0?[1-9]|1[0-2])$/';

        if (! preg_match($pattern, $persianDate)) {
            throw new InvalidArgumentException("Invalid Persian {$type}: {$persianDate}");
        }

        $timezone ??= new DateTimeZone(config('app.timezone'));
        [$year, $month] = array_map('intval', array_slice(explode('/', $persianDate), 0, 2));
        $day = $type === 'date' ? (int) explode('/', $persianDate)[2] : 1;

        if ($month < 1 || $month > 12 || $day < 1 || $year < 1000 || $year > 3000) {
            throw new InvalidArgumentException("Invalid Persian {$type}: {$persianDate}");
        }

        $persianMonthStart = Jalalian::fromFormat(
            'Y/m/d',
            sprintf('%04d/%02d/01', $year, $month),
            $timezone,
        );

        if ($day > $persianMonthStart->getDaysOf($month)) {
            throw new InvalidArgumentException("Invalid Persian date: {$persianDate}");
        }

        $rangeStart = $persianMonthStart->addDays($day - 1)->toCarbon();
        $start = $rangeStart->copy()->startOfDay();
        $end = $type === 'date'
            ? $rangeStart->copy()->endOfDay()
            : $persianMonthStart->addDays($persianMonthStart->getDaysOf($month) - 1)->toCarbon()->endOfDay();

        return ['start' => $start, 'end' => $end];
    }

    private function toEnglishDigits(string $value): string
    {
        return strtr($value, [
            '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4',
            '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
            '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4',
            '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
        ]);
    }
}
