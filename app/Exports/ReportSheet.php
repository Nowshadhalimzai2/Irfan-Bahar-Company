<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;

class ReportSheet implements FromArray, ShouldAutoSize, WithTitle
{
    public function __construct(
        private string $sheetTitle,
        private array $rows,
    ) {}

    public function array(): array
    {
        return $this->rows;
    }

    public function title(): string
    {
        return substr($this->sheetTitle, 0, 31);
    }
}