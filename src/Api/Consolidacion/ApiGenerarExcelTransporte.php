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
$tipoFecha = $input['tipoFecha'] ?? 'fechaSalida';

// Validar fechas
if (!$fechaDesde || !$fechaHasta) {
    die(json_encode(["error" => "Debe proporcionar un rango de fechas válido."]));
}

// Mapear tipo de fecha al campo correcto en la base de datos
$campoFechaBD = consolidacion_mapear_campo_fecha($tipoFecha);

try {
    // Establecer idioma para días de la semana en español
    $enlace->query("SET lc_time_names = 'es_ES'");
    
    // Datos de transporte: una fila por Fecha + Guia Master + Guia Hija
    // (costo diario prorrateado por cajas; facturas/precintos por Fecha + Guia Master)
    $datosTransporte = consolidacion_obtener_transporte_local($enlace, $fechaDesde, $fechaHasta, $campoFechaBD);

    // CREAR EL EXCEL
    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->setTitle("Transporte Consolidado");

    // AGREGAR ENCABEZADO CON TÍTULO, PERÍODO Y LOGO
    $filaActual = 1;
    
    // Intentar agregar logo si existe
    $logoPath = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalabella.jpg";
    $logoExiste = file_exists($logoPath);
    if ($logoExiste) {
        $drawing = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
        $drawing->setName('Logo');
        $drawing->setDescription('Logo');
        $drawing->setPath($logoPath);
        $drawing->setHeight(50);
        $drawing->setCoordinates('A' . $filaActual);
        $drawing->setWorksheet($sheet);
        // Ajustar altura de fila para el logo
        $sheet->getRowDimension($filaActual)->setRowHeight(50);
    }
    
    // Determinar columnas para título y período según si hay logo
    $colInicio = $logoExiste ? 'C' : 'A';
    $colFin = $logoExiste ? 'H' : 'J';
    
    // Título principal (centrado)
    $sheet->mergeCells($colInicio . $filaActual . ':' . $colFin . $filaActual);
    $sheet->setCellValue($colInicio . $filaActual, 'TRANSPORTE POR DÍA');
    $sheet->getStyle($colInicio . $filaActual)->getFont()->setBold(true)->setSize(16);
    $sheet->getStyle($colInicio . $filaActual)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
    
    $filaActual++;
    
    // Período (centrado)
    $sheet->mergeCells($colInicio . $filaActual . ':' . $colFin . $filaActual);
    $sheet->setCellValue($colInicio . $filaActual, 'Período: ' . $fechaDesde . ' a ' . $fechaHasta);
    $sheet->getStyle($colInicio . $filaActual)->getFont()->setItalic(true)->setSize(10);
    $sheet->getStyle($colInicio . $filaActual)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
    
    $filaActual += 2; // Espacio antes de los encabezados de columna
    
    // ENCABEZADOS (10 columnas como en el PDF)
    $encabezados = [
        'FECHA COMPLETA', 
        'FECHA', 
        'CANTIDAD CAJAS', 
        'PESO NETO (KG)', 
        'PESO BRUTO (KG)', 
        'GUIA MASTER', 
        'GUIA HIJA', 
        'PALLETS',
        'PALLETS PAGAS',
        'COSTO TRANSPORTE',
        'FACTURAS', 
        'PRECINTO'
    ];

    // Aplicar estilos a los encabezados
    $col = 'A';
    foreach ($encabezados as $encabezado) {
        $sheet->setCellValue($col . $filaActual, $encabezado);
        $sheet->getStyle($col . $filaActual)->getFont()->setBold(true);
        $sheet->getStyle($col . $filaActual)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('FFE6E6FA');
        $col++;
    }

    // LLENAR DATOS
    $fila = $filaActual + 1;
    $contadorFilas = 0;
    $totalCajas = 0;
    $totalPesoNeto = 0;
    $totalPesoBruto = 0;
    $totalEstibas = 0;
    $totalEstibasPagas = 0;
    $totalCostoTransporte = 0;
    
    foreach ($datosTransporte as $dato) {
        $sheet->setCellValue('A' . $fila, $dato['FechaCompleta']);
        $sheet->setCellValue('B' . $fila, $dato['FechaCorta']);
        $sheet->setCellValue('C' . $fila, $dato['CantidadCajas']);
        $sheet->setCellValue('D' . $fila, $dato['PesoNeto']);
        $sheet->setCellValue('E' . $fila, $dato['PesoBruto']);
        $sheet->setCellValue('F' . $fila, $dato['GuiaMaster']);
        $sheet->setCellValue('G' . $fila, $dato['GuiaHija']);
        $sheet->setCellValue('H' . $fila, $dato['CantidadEstibas']);
        $sheet->setCellValue('I' . $fila, $dato['CantidadEstibasPagas']);
        $sheet->setCellValue('J' . $fila, $dato['CostoTransporte']);
        $sheet->setCellValue('K' . $fila, $dato['Facturas']);
        $sheet->setCellValue('L' . $fila, $dato['Precintos']);
        
        $totalCajas += $dato['CantidadCajas'];
        $totalPesoNeto += $dato['PesoNeto'];
        $totalPesoBruto += $dato['PesoBruto'];
        $totalEstibas += $dato['CantidadEstibas'];
        $totalEstibasPagas += $dato['CantidadEstibasPagas'];
        $totalCostoTransporte += $dato['CostoTransporte'];
        
        $fila++;
        $contadorFilas++;
    }

    // Agregar fila de totales
    if ($contadorFilas > 0) {
        $sheet->setCellValue('A' . $fila, 'TOTALES:');
        $sheet->setCellValue('C' . $fila, $totalCajas);
        $sheet->setCellValue('D' . $fila, $totalPesoNeto);
        $sheet->setCellValue('E' . $fila, $totalPesoBruto);
        $sheet->setCellValue('H' . $fila, $totalEstibas);
        $sheet->setCellValue('I' . $fila, $totalEstibasPagas);
        $sheet->setCellValue('J' . $fila, $totalCostoTransporte);
        
        // Aplicar estilo a la fila de totales
        $sheet->getStyle('A' . $fila . ':L' . $fila)->getFont()->setBold(true);
        $sheet->getStyle('A' . $fila . ':L' . $fila)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('FFDCDCDC');
    }
    
    // Si no hay datos, mostrar mensaje
    if ($contadorFilas === 0) {
        $filaMensaje = $filaActual + 1;
        $sheet->setCellValue('A' . $filaMensaje, 'No hay datos para las fechas seleccionadas: ' . $fechaDesde . ' a ' . $fechaHasta);
        $sheet->mergeCells('A' . $filaMensaje . ':L' . $filaMensaje);
        $sheet->getStyle('A' . $filaMensaje)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
    }

    // Autoajustar columnas
    foreach (range('A', 'L') as $columnID) {
        $sheet->getColumnDimension($columnID)->setAutoSize(true);
    }

    // GENERAR Y DESCARGAR ARCHIVO
    $archivoExcel = "Transporte_Consolidado_" . date("Ymd_His") . ".xlsx";
    
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="' . $archivoExcel . '"');
    header('Cache-Control: max-age=0');
    
    $writer = new Xlsx($spreadsheet);
    $writer->save('php://output');
    exit;

} catch (Exception $e) {
    die(json_encode(["error" => "Error al generar el Excel de transporte: " . $e->getMessage()]));
}