<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReportSheet implements FromArray, ShouldAutoSize, WithStyles, WithTitle
{
    public function __construct(
        private string $sheetTitle,
        private array $rows,
        private bool $rtl = false,
    ) {}

    public function array(): array
    {
        return $this->rows;
    }

    public function title(): string
    {
        return substr($this->sheetTitle, 0, 31);
    }

    public function styles(Worksheet $sheet): array
    {
        $sheet->setRightToLeft($this->rtl);
        $sheet->freezePane('A2');
        $sheet->setAutoFilter($sheet->calculateWorksheetDimension());

        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1F4E78']],
                'alignment' => ['horizontal' => 'right'],
            ],
        ];
    }
}
