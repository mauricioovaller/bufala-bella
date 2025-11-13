<?php
require $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

// ARCHIVO DE PRUEBA MÍNIMO
$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();
$sheet->setCellValue('A1', 'Test');
$sheet->setCellValue('B1', 'Valor');

header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment; filename="test_excel.xlsx"');

$writer = new Xlsx($spreadsheet);
$writer->save('php://output');
exit;