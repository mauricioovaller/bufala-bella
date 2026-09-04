<?php
require $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
require_once __DIR__ . '/consolidacion_reportes_helper.php';

error_reporting(E_ALL);
ini_set('display_errors', 1);

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["error" => "Método no permitido. Usa POST."]));
}

$input = json_decode(file_get_contents("php://input"), true);
$fechaDesde = $input['fechaDesde'] ?? null;
$fechaHasta = $input['fechaHasta'] ?? null;
$campoFechaBD = consolidacion_mapear_campo_fecha($input['tipoFecha'] ?? 'fechaSalida');

if (!$fechaDesde || !$fechaHasta) {
    die(json_encode(["error" => "Debe proporcionar un rango de fechas válido."]));
}

function consolidacion_llenar_hoja_proceso($sheet, $rows)
{
    $encabezados = [
        'Año', 'Mes', 'Frecuencia', 'Region', 'Orden', 'ListaEmpaque',
        'Codigo_Siesa', 'Codigo_FDA', 'Cliente', 'Direccion', 'Lote',
        'Descripcion', 'DescripFactura', 'CajasOrden', 'CajasDespachadas',
        'CantidadCaja', 'TotalTM', 'PesoUnd', 'PesoCj', 'KgNet', 'KgBrt',
        'ValorKg', 'USD', 'CantidadEstibas', 'FechaOrden', 'FechaETD',
        'FechaETA', 'FechaETAF', 'FechaQB', 'DescripcionExcel', 'DescripFacExcel', 'TipoDato', 'GuiaMaster'
    ];

    $col = 'A';
    foreach ($encabezados as $encabezado) {
        $sheet->setCellValue($col . '1', $encabezado);
        $sheet->getStyle($col . '1')->getFont()->setBold(true);
        $sheet->getStyle($col . '1')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('FFE6E6FA');
        $col++;
    }

    $fila = 2;
    foreach ($rows as $row) {
        $sheet->setCellValue('A' . $fila, $row['Anio']);
        $sheet->setCellValue('B' . $fila, $row['Mes']);
        $sheet->setCellValue('C' . $fila, $row['Frecuencia']);
        $sheet->setCellValue('D' . $fila, $row['Region']);
        $sheet->setCellValue('E' . $fila, $row['Orden']);
        $sheet->setCellValue('F' . $fila, $row['ListaEmpaque']);
        $sheet->setCellValue('G' . $fila, $row['Codigo_Siesa']);
        $sheet->setCellValue('H' . $fila, $row['Codigo_FDA']);
        $sheet->setCellValue('I' . $fila, $row['Cliente']);
        $sheet->setCellValue('J' . $fila, $row['Direccion']);
        $sheet->setCellValue('K' . $fila, $row['Lote']);
        $sheet->setCellValue('L' . $fila, $row['Descripcion']);
        $sheet->setCellValue('M' . $fila, $row['DescripFactura']);
        $sheet->setCellValue('N' . $fila, $row['CajasOrden']);
        $sheet->setCellValue('O' . $fila, $row['CajasDespachadas']);
        $sheet->setCellValue('P' . $fila, $row['CantidadCaja']);
        $sheet->setCellValue('Q' . $fila, $row['TotalTM']);
        $sheet->setCellValue('R' . $fila, $row['PesoUnd']);
        $sheet->setCellValue('S' . $fila, $row['PesoCj']);
        $sheet->setCellValue('T' . $fila, $row['KgNet']);
        $sheet->setCellValue('U' . $fila, $row['KgBrt']);
        $sheet->setCellValue('V' . $fila, $row['ValorKg']);
        $sheet->setCellValue('W' . $fila, $row['USD']);
        $sheet->setCellValue('X' . $fila, $row['CantidadEstibas']);
        $sheet->setCellValue('Y' . $fila, $row['FechaOrden']);
        $sheet->setCellValue('Z' . $fila, $row['FechaETD']);
        $sheet->setCellValue('AA' . $fila, $row['FechaETA']);
        $sheet->setCellValue('AB' . $fila, $row['FechaETAF']);
        $sheet->setCellValue('AC' . $fila, $row['FechaQB']);
        $sheet->setCellValue('AD' . $fila, $row['DescripcionExcel']);
        $sheet->setCellValue('AE' . $fila, $row['DescripFacExcel']);
        $sheet->setCellValue('AF' . $fila, $row['TipoDato']);
        $sheet->setCellValue('AG' . $fila, $row['GuiaMaster']);
        $fila++;
    }

    if (empty($rows)) {
        $sheet->setCellValue('A2', 'No hay datos para el período seleccionado');
    }

    foreach (range('A', 'AG') as $columnID) {
        $sheet->getColumnDimension($columnID)->setAutoSize(true);
    }
}

try {
    $enlace->query("SET lc_time_names = 'es_ES'");
    $rowsLocal = consolidacion_obtener_excel_proceso_local($enlace, $fechaDesde, $fechaHasta, $campoFechaBD);
    $rowsChile = consolidacion_obtener_excel_proceso_chile($enlace, $fechaDesde, $fechaHasta, $campoFechaBD);

    $spreadsheet = new Spreadsheet();
    $sheetLocal = $spreadsheet->getActiveSheet();
    $sheetLocal->setTitle("Pedidos Locales");
    consolidacion_llenar_hoja_proceso($sheetLocal, $rowsLocal);

    $sheetChile = $spreadsheet->createSheet();
    $sheetChile->setTitle("Pedidos Chile");
    consolidacion_llenar_hoja_proceso($sheetChile, $rowsChile);

    $archivoExcel = "Consolidacion_Pedidos_Consolidado_" . date("Ymd_His") . ".xlsx";
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="' . $archivoExcel . '"');
    header('Cache-Control: max-age=0');

    $writer = new Xlsx($spreadsheet);
    $writer->save('php://output');
    exit;
} catch (Exception $e) {
    die(json_encode(["error" => "Error al generar el Excel: " . $e->getMessage()]));
}
