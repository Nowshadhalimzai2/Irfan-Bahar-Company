<?php

namespace App\Exports;

class DariReportExport extends ReportExport
{
    public function __construct(array $report)
    {
        parent::__construct($report, true);
    }
}
