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

function consolidacion_llenar_hoja_transporte($sheet, $rows, $titulo, $fechaDesde, $fechaHasta)
{
    $sheet->setCellValue('A1', $titulo);
    $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
    $sheet->mergeCells('A1:L1');
    $sheet->setCellValue('A2', 'Período: ' . $fechaDesde . ' a ' . $fechaHasta);
    $sheet->getStyle('A2')->getFont()->setItalic(true);
    $sheet->mergeCells('A2:L2');

    $encabezados = [
        'FECHA COMPLETA', 'FECHA', 'CANTIDAD CAJAS', 'PESO NETO (KG)', 'PESO BRUTO (KG)',
        'GUIA MASTER', 'GUIA HIJA', 'PALLETS', 'PALLETS PAGAS', 'COSTO TRANSPORTE', 'FACTURAS', 'PRECINTO'
    ];
    $col = 'A';
    foreach ($encabezados as $encabezado) {
        $sheet->setCellValue($col . '4', $encabezado);
        $sheet->getStyle($col . '4')->getFont()->setBold(true);
        $sheet->getStyle($col . '4')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('FFE6E6FA');
        $col++;
    }

    $fila = 5;
    $totalCajas = $totalPesoNeto = $totalPesoBruto = $totalEstibas = $totalEstibasPagas = $totalCosto = 0;
    foreach ($rows as $row) {
        $sheet->setCellValue('A' . $fila, $row['FechaCompleta']);
        $sheet->setCellValue('B' . $fila, $row['FechaCorta']);
        $sheet->setCellValue('C' . $fila, $row['CantidadCajas']);
        $sheet->setCellValue('D' . $fila, $row['PesoNeto']);
        $sheet->setCellValue('E' . $fila, $row['PesoBruto']);
        $sheet->setCellValue('F' . $fila, $row['GuiaMaster']);
        $sheet->setCellValue('G' . $fila, $row['GuiaHija']);
        $sheet->setCellValue('H' . $fila, $row['CantidadEstibas']);
        $sheet->setCellValue('I' . $fila, $row['CantidadEstibasPagas']);
        $sheet->setCellValue('J' . $fila, $row['CostoTransporte']);
        $sheet->setCellValue('K' . $fila, $row['Facturas']);
        $sheet->setCellValue('L' . $fila, $row['Precintos']);
        $totalCajas += $row['CantidadCajas'];
        $totalPesoNeto += $row['PesoNeto'];
        $totalPesoBruto += $row['PesoBruto'];
        $totalEstibas += $row['CantidadEstibas'];
        $totalEstibasPagas += $row['CantidadEstibasPagas'];
        $totalCosto += $row['CostoTransporte'];
        $fila++;
    }

    if (!empty($rows)) {
        $sheet->setCellValue('A' . $fila, 'TOTALES:');
        $sheet->setCellValue('C' . $fila, $totalCajas);
        $sheet->setCellValue('D' . $fila, $totalPesoNeto);
        $sheet->setCellValue('E' . $fila, $totalPesoBruto);
        $sheet->setCellValue('H' . $fila, $totalEstibas);
        $sheet->setCellValue('I' . $fila, $totalEstibasPagas);
        $sheet->setCellValue('J' . $fila, $totalCosto);
        $sheet->getStyle('A' . $fila . ':L' . $fila)->getFont()->setBold(true);
        $sheet->getStyle('A' . $fila . ':L' . $fila)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('FFDCDCDC');
    } else {
        $sheet->setCellValue('A5', 'No hay datos para las fechas seleccionadas: ' . $fechaDesde . ' a ' . $fechaHasta);
        $sheet->mergeCells('A5:L5');
    }

    foreach (range('A', 'L') as $columnID) {
        $sheet->getColumnDimension($columnID)->setAutoSize(true);
    }
}

try {
    $enlace->query("SET lc_time_names = 'es_ES'");
    $rowsLocal = consolidacion_obtener_transporte_local($enlace, $fechaDesde, $fechaHasta, $campoFechaBD);
    $rowsChile = consolidacion_obtener_transporte_chile($enlace, $fechaDesde, $fechaHasta, $campoFechaBD);

    $spreadsheet = new Spreadsheet();
    $sheetLocal = $spreadsheet->getActiveSheet();
    $sheetLocal->setTitle("Pedidos Locales");
    consolidacion_llenar_hoja_transporte($sheetLocal, $rowsLocal, 'TRANSPORTE POR DIA - PEDIDOS LOCALES', $fechaDesde, $fechaHasta);

    $sheetChile = $spreadsheet->createSheet();
    $sheetChile->setTitle("Pedidos Chile");
    consolidacion_llenar_hoja_transporte($sheetChile, $rowsChile, 'TRANSPORTE POR DIA - PEDIDOS CHILE', $fechaDesde, $fechaHasta);

    $archivoExcel = "Transporte_Consolidado_" . date("Ymd_His") . ".xlsx";
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="' . $archivoExcel . '"');
    header('Cache-Control: max-age=0');

    $writer = new Xlsx($spreadsheet);
    $writer->save('php://output');
    exit;
} catch (Exception $e) {
    die(json_encode(["error" => "Error al generar el Excel: " . $e->getMessage()]));
}
