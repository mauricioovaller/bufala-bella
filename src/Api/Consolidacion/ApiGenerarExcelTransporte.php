<?php

require $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
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
$campoFecha = '';
switch($tipoFecha) {
    case 'fechaEnroute':
        $campoFecha = 'FechaEnroute';
        break;
    case 'fechaDelivery':
        $campoFecha = 'FechaDelivery';
        break;
    default:
        $campoFecha = 'FechaSalida';
}

try {
    // Establecer idioma para días de la semana en español
    $enlace->query("SET lc_time_names = 'es_ES'");
    
    // CONSULTA SQL UNIFICADA - COMBINA DATOS NORMALES Y SAMPLE
    $sql = "SELECT
        DATE_FORMAT(enc.FechaSalida, '%W, %e de %M de %Y') AS FechaCompleta,
        DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaCorta,
        SUM(det.Cantidad) AS CantidadCajas,
        ROUND(SUM(det.PesoNeto), 2) AS PesoNeto,
        ROUND(SUM(det.PesoNeto * 2.6), 2) AS PesoBruto,
        enc.GuiaMaster,
        enc.GuiaHija,
        MAX(est.TotalEstibas) AS CantidadEstibas,
        '07:00:00' AS HoraCargue,
        'Normal' AS TipoDato,
        COALESCE((SELECT GROUP_CONCAT(DISTINCT Id_EncabInvoice ORDER BY Id_EncabInvoice SEPARATOR '-') FROM EncabInvoice WHERE DATE(enc.FechaSalida) = Fecha AND TipoPedido = 'normal'), '') AS Facturas,
        COALESCE((SELECT GROUP_CONCAT(DISTINCT pl.Precinto ORDER BY pl.Precinto SEPARATOR '-') FROM EncabInvoice ei LEFT JOIN Planillas pl ON ei.Id_Planilla = pl.Id_Planilla WHERE DATE(enc.FechaSalida) = ei.Fecha AND ei.TipoPedido = 'normal'), '') AS Precintos
    FROM EncabPedido enc
    INNER JOIN DetPedido det ON enc.Id_EncabPedido = det.Id_EncabPedido   
    INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
    INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
    INNER JOIN (
        SELECT 
            {$campoFecha},
            SUM(CantidadEstibas) AS TotalEstibas
        FROM EncabPedido
        WHERE {$campoFecha} BETWEEN ? AND ?
          AND Estado = 'Activo'
        GROUP BY {$campoFecha}
    ) est ON est.{$campoFecha} = enc.{$campoFecha}
    WHERE enc.{$campoFecha} BETWEEN ? AND ? AND enc.Estado = 'Activo'
    GROUP BY enc.{$campoFecha}

    UNION ALL

    SELECT
        DATE_FORMAT(enc.FechaSalida, '%W, %e de %M de %Y') AS FechaCompleta,
        DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaCorta,
        SUM(det.Cantidad) AS CantidadCajas,
        ROUND(SUM(det.PesoNeto), 2) AS PesoNeto,
        ROUND(SUM(det.PesoNeto * 2.6), 2) AS PesoBruto,
        enc.GuiaMaster,
        enc.GuiaHija,
        MAX(est.TotalEstibas) AS CantidadEstibas,
        '07:00:00' AS HoraCargue,
        'Sample' AS TipoDato,
        COALESCE((SELECT GROUP_CONCAT(DISTINCT Id_EncabInvoice ORDER BY Id_EncabInvoice SEPARATOR '-') FROM EncabInvoice WHERE DATE(enc.FechaSalida) = Fecha AND TipoPedido = 'sample'), '') AS Facturas,
        COALESCE((SELECT GROUP_CONCAT(DISTINCT pl.Precinto ORDER BY pl.Precinto SEPARATOR '-') FROM EncabInvoice ei LEFT JOIN Planillas pl ON ei.Id_Planilla = pl.Id_Planilla WHERE DATE(enc.FechaSalida) = ei.Fecha AND ei.TipoPedido = 'sample'), '') AS Precintos
    FROM EncabPedidoSample enc
    INNER JOIN DetPedidoSample det ON enc.Id_EncabPedido = det.Id_EncabPedido   
    INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
    INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
    INNER JOIN (
        SELECT 
            {$campoFecha},
            SUM(CantidadEstibas) AS TotalEstibas
        FROM EncabPedidoSample
        WHERE {$campoFecha} BETWEEN ? AND ?
          AND Estado = 'Activo'
        GROUP BY {$campoFecha}
    ) est ON est.{$campoFecha} = enc.{$campoFecha}
    WHERE enc.{$campoFecha} BETWEEN ? AND ? AND enc.Estado = 'Activo'
    GROUP BY enc.{$campoFecha}

    ORDER BY FechaCorta ASC";

    // Preparar y ejecutar la consulta
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("ssssssss", $fechaDesde, $fechaHasta, $fechaDesde, $fechaHasta, $fechaDesde, $fechaHasta, $fechaDesde, $fechaHasta);
    $stmt->execute();
    
    // BIND RESULT
    $stmt->bind_result(
        $fechaCompleta,
        $fechaCorta,
        $cantidadCajas,
        $pesoNeto,
        $pesoBruto,
        $guiaMaster,
        $guiaHija,
        $cantidadEstibas,
        $horaCargue,
        $tipoDato,
        $facturas,
        $precintos
    );
    
    // Procesar y consolidar datos por fecha (igual que en ApiConsolidadoTransporte.php)
    $datosConsolidados = [];
    
    while ($stmt->fetch()) {
        $claveUnica = $fechaCorta;

        if (isset($datosConsolidados[$claveUnica])) {
            // Sumar todos los valores
            $datosConsolidados[$claveUnica]['CantidadCajas'] += $cantidadCajas;
            $datosConsolidados[$claveUnica]['PesoNeto'] += $pesoNeto;
            $datosConsolidados[$claveUnica]['PesoBruto'] += $pesoBruto;
            $datosConsolidados[$claveUnica]['CantidadEstibas'] += $cantidadEstibas;

            // Para Guías: mantener la del registro "Normal" o concatenar
            if ($tipoDato === 'Normal') {
                $datosConsolidados[$claveUnica]['GuiaMaster'] = $guiaMaster;
                $datosConsolidados[$claveUnica]['GuiaHija'] = $guiaHija;
            }

            // Combinar Facturas y Precintos
            if (!empty($facturas)) {
                $existingFacturas = $datosConsolidados[$claveUnica]['Facturas'] ?? '';
                if (!empty($existingFacturas)) {
                    // Combinar y eliminar duplicados
                    $combined = array_unique(array_merge(
                        explode('-', $existingFacturas),
                        explode('-', $facturas)
                    ));
                    $datosConsolidados[$claveUnica]['Facturas'] = implode('-', array_filter($combined));
                } else {
                    $datosConsolidados[$claveUnica]['Facturas'] = $facturas;
                }
            }

            if (!empty($precintos)) {
                $existingPrecintos = $datosConsolidados[$claveUnica]['Precintos'] ?? '';
                if (!empty($existingPrecintos)) {
                    $combined = array_unique(array_merge(
                        explode('-', $existingPrecintos),
                        explode('-', $precintos)
                    ));
                    $datosConsolidados[$claveUnica]['Precintos'] = implode('-', array_filter($combined));
                } else {
                    $datosConsolidados[$claveUnica]['Precintos'] = $precintos;
                }
            }
        } else {
            $datosConsolidados[$claveUnica] = [
                'FechaCompleta' => $fechaCompleta,
                'FechaCorta' => $fechaCorta,
                'CantidadCajas' => $cantidadCajas,
                'PesoNeto' => $pesoNeto,
                'PesoBruto' => $pesoBruto,
                'GuiaMaster' => $guiaMaster,
                'GuiaHija' => $guiaHija,
                'CantidadEstibas' => $cantidadEstibas,
                'HoraCargue' => $horaCargue,
                'Facturas' => $facturas,
                'Precintos' => $precintos
            ];
        }
    }
    
    $stmt->close();
    
    // Convertir el array asociativo a indexado para facilitar el uso
    $datosTransporte = array_values($datosConsolidados);
    
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
    
    foreach ($datosTransporte as $dato) {
        $sheet->setCellValue('A' . $fila, $dato['FechaCompleta']);
        $sheet->setCellValue('B' . $fila, $dato['FechaCorta']);
        $sheet->setCellValue('C' . $fila, $dato['CantidadCajas']);
        $sheet->setCellValue('D' . $fila, $dato['PesoNeto']);
        $sheet->setCellValue('E' . $fila, $dato['PesoBruto']);
        $sheet->setCellValue('F' . $fila, $dato['GuiaMaster']);
        $sheet->setCellValue('G' . $fila, $dato['GuiaHija']);
        $sheet->setCellValue('H' . $fila, $dato['CantidadEstibas']);
        $sheet->setCellValue('I' . $fila, $dato['Facturas']);
        $sheet->setCellValue('J' . $fila, $dato['Precintos']);
        
        $totalCajas += $dato['CantidadCajas'];
        $totalPesoNeto += $dato['PesoNeto'];
        $totalPesoBruto += $dato['PesoBruto'];
        $totalEstibas += $dato['CantidadEstibas'];
        
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
        
        // Aplicar estilo a la fila de totales
        $sheet->getStyle('A' . $fila . ':J' . $fila)->getFont()->setBold(true);
        $sheet->getStyle('A' . $fila . ':J' . $fila)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('FFDCDCDC');
    }
    
    // Si no hay datos, mostrar mensaje
    if ($contadorFilas === 0) {
        $filaMensaje = $filaActual + 1;
        $sheet->setCellValue('A' . $filaMensaje, 'No hay datos para las fechas seleccionadas: ' . $fechaDesde . ' a ' . $fechaHasta);
        $sheet->mergeCells('A' . $filaMensaje . ':J' . $filaMensaje);
        $sheet->getStyle('A' . $filaMensaje)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
    }

    // Autoajustar columnas
    foreach (range('A', 'J') as $columnID) {
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