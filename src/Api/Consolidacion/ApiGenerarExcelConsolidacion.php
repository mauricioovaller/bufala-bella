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
    // CONSULTA SQL UNIFICADA - COMBINA DATOS NORMALES Y SAMPLE
    $enlace->query("SET lc_time_names = 'es_ES'");
    $sql = "    
    SELECT
        YEAR(enc.FechaSalida) AS Anio,
        MONTHNAME(enc.FechaSalida) AS Mes,
        crg.Frecuencia,
        crg.Region,
        enc.PurchaseOrder AS Orden,
        enc.Id_EncabPedido AS ListaEmpaque,
        prd.Codigo_Siesa,
        prd.Codigo_FDA,
        cli.Nombre AS Cliente,
        crg.Direccion,
        '' AS Lote,
        CONCAT(prd.DescripProducto, ' ', emb.Descripcion) AS Descripcion,
        prd.DescripFactura,
        SUM(det.Cantidad) AS CajasOrden,
        SUM(det.Cantidad) AS CajasDespachadas,
        emb.Cantidad AS CantidadCaja,
        SUM(det.Cantidad * emb.Cantidad) AS TotalTM,
        (prd.PesoGr / 1000) AS PesoUnd,
        ROUND((emb.Cantidad * prd.PesoGr / 1000), 2) AS PesoCj,
        ROUND(SUM(det.Cantidad * emb.Cantidad * prd.PesoGr / 1000),2) AS KgNet,
        ROUND(SUM(det.Cantidad * emb.Cantidad * prd.PesoGr * prd.FactorPesoBruto / 1000),2) AS KgBrt,
        det.PrecioUnitario AS ValorKg,
        ROUND(SUM(det.Cantidad * emb.Cantidad * prd.PesoGr / 1000 * det.PrecioUnitario),2) AS USD,
        
        -- DISTRIBUCIÓN PROPORCIONAL DE ESTIBAS
        ROUND(
            enc.CantidadEstibas * (
                det.Cantidad / total_pedido.TotalCajasPedido
            ), 
        3) AS CantidadEstibas,
        
        DATE_FORMAT(enc.FechaOrden, '%d/%m/%Y') AS FechaOrden,
        DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaETD,
        DATE_FORMAT(enc.FechaEnroute, '%d/%m/%Y') AS FechaETA,
        DATE_FORMAT(enc.FechaDelivery, '%d/%m/%Y') AS FechaETAF,
        DATE_FORMAT(enc.FechaIngreso, '%d/%m/%Y') AS FechaQB,

        -- NUEVA COLUMNA TEMPORAL: Descripción del Excel anterior
        (
            SELECT pt.Productos
            FROM ProductosTransitorios pt 
            WHERE pt.Id_Producto = det.Id_Producto 
            AND pt.Id_Embalaje = det.Id_Embalaje            
            LIMIT 1
        ) AS DescripcionExcel,
        -- NUEVA COLUMNA TEMPORAL: Descripción Factura del Excel anterior
        (
            SELECT pt.DescripcionFactura AS DescripFacExcel
            FROM ProductosTransitorios pt 
            WHERE pt.Id_Producto = det.Id_Producto 
            AND pt.Id_Embalaje = det.Id_Embalaje            
            LIMIT 1
        ) AS DescripFacExcel,
        'Normal' AS TipoDato

    FROM EncabPedido enc
    INNER JOIN DetPedido det ON enc.Id_EncabPedido = det.Id_EncabPedido
    INNER JOIN Clientes cli ON enc.Id_Cliente = cli.Id_Cliente
    -- RELACIÓN DIRECTA CON EL Id_ClienteRegion ESPECÍFICO DEL PEDIDO
    INNER JOIN ClientesRegion crg ON enc.Id_ClienteRegion = crg.Id_ClienteRegion
    INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
    INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje

    -- SUBCONSULTA PARA OBTENER EL TOTAL DE CAJAS POR PEDIDO
    INNER JOIN (
        SELECT 
            Id_EncabPedido,
            SUM(Cantidad) AS TotalCajasPedido
        FROM DetPedido
        GROUP BY Id_EncabPedido
    ) total_pedido ON enc.Id_EncabPedido = total_pedido.Id_EncabPedido

    WHERE enc.{$campoFecha} BETWEEN ? AND ?
    GROUP BY enc.Id_EncabPedido, det.Id_Producto, det.Id_Embalaje

    UNION ALL

    SELECT
        YEAR(enc.FechaSalida) AS Anio,
        MONTHNAME(enc.FechaSalida) AS Mes,
        '' AS Frecuencia,  -- Frecuencia por defecto para samples
        '' AS Region,      -- Region por defecto para samples
        enc.PurchaseOrder AS Orden,
        enc.Id_EncabPedido AS ListaEmpaque,
        prd.Codigo_Siesa,
        prd.Codigo_FDA,
        enc.Cliente AS Cliente,
        '' AS Direccion,
        '' AS Lote,
        CONCAT(prd.DescripProducto, ' ', emb.Descripcion) AS Descripcion,
        prd.DescripFactura,
        SUM(det.Cantidad) AS CajasOrden,
        SUM(det.Cantidad) AS CajasDespachadas,
        emb.Cantidad AS CantidadCaja,
        SUM(det.Cantidad * emb.Cantidad) AS TotalTM,
        (prd.PesoGr / 1000) AS PesoUnd,
        ROUND((emb.Cantidad * prd.PesoGr / 1000), 2) AS PesoCj,
        ROUND(SUM(det.Cantidad * emb.Cantidad * prd.PesoGr / 1000),2) AS KgNet,
        ROUND(SUM(det.Cantidad * emb.Cantidad * prd.PesoGr * prd.FactorPesoBruto / 1000),2) AS KgBrt,
        det.PrecioUnitario AS ValorKg,
        ROUND(SUM(det.Cantidad * emb.Cantidad * prd.PesoGr / 1000 * det.PrecioUnitario),2) AS USD,
        
        -- DISTRIBUCIÓN PROPORCIONAL DE ESTIBAS
        ROUND(
            enc.CantidadEstibas * (
                det.Cantidad / total_pedido.TotalCajasPedido
            ), 
        3) AS CantidadEstibas,
        
        DATE_FORMAT(enc.FechaOrden, '%d/%m/%Y') AS FechaOrden,
        DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaETD,
        DATE_FORMAT(enc.FechaEnroute, '%d/%m/%Y') AS FechaETA,
        DATE_FORMAT(enc.FechaDelivery, '%d/%m/%Y') AS FechaETAF,
        DATE_FORMAT(enc.FechaIngreso, '%d/%m/%Y') AS FechaQB,

        -- NUEVA COLUMNA TEMPORAL: Descripción del Excel anterior
        (
            SELECT pt.Productos
            FROM ProductosTransitorios pt 
            WHERE pt.Id_Producto = det.Id_Producto 
            AND pt.Id_Embalaje = det.Id_Embalaje            
            LIMIT 1
        ) AS DescripcionExcel,
        -- NUEVA COLUMNA TEMPORAL: Descripción Factura del Excel anterior
        (
            SELECT pt.DescripcionFactura AS DescripFacExcel
            FROM ProductosTransitorios pt 
            WHERE pt.Id_Producto = det.Id_Producto 
            AND pt.Id_Embalaje = det.Id_Embalaje            
            LIMIT 1
        ) AS DescripFacExcel,
        'Sample' AS TipoDato

    FROM EncabPedidoSample enc
    INNER JOIN DetPedidoSample det ON enc.Id_EncabPedido = det.Id_EncabPedido
    INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
    INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje

    -- SUBCONSULTA PARA OBTENER EL TOTAL DE CAJAS POR PEDIDO
    INNER JOIN (
        SELECT 
            Id_EncabPedido,
            SUM(Cantidad) AS TotalCajasPedido
        FROM DetPedidoSample
        GROUP BY Id_EncabPedido
    ) total_pedido ON enc.Id_EncabPedido = total_pedido.Id_EncabPedido

    WHERE enc.{$campoFecha} BETWEEN ? AND ?
    GROUP BY enc.Id_EncabPedido, det.Id_Producto, det.Id_Embalaje

    ORDER BY FechaETD, ListaEmpaque, Codigo_Siesa";

    // Preparar y ejecutar la consulta
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("ssss", $fechaDesde, $fechaHasta, $fechaDesde, $fechaHasta);
    $stmt->execute();
    
    // BIND RESULT - Reemplazando get_result()
    $stmt->bind_result(
        $Anio, $Mes, $Frecuencia, $Region, $Orden, $ListaEmpaque,
        $Codigo_Siesa, $Codigo_FDA, $Cliente, $Direccion, $Lote,
        $Descripcion, $DescripFactura, $CajasOrden, $CajasDespachadas,
        $CantidadCaja, $TotalTM, $PesoUnd, $PesoCj, $KgNet, $KgBrt,
        $ValorKg, $USD, $CantidadEstibas, $FechaOrden, $FechaETD,
        $FechaETA, $FechaETAF, $FechaQB, $DescripcionExcel, $DescripFacExcel, $TipoDato
    );
    
    // CREAR EL EXCEL
    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->setTitle("Consolidación Pedidos");

    // ENCABEZADOS (agregar columna TipoDato al final)
    $encabezados = [
        'Año', 'Mes', 'Frecuencia', 'Region', 'Orden', 'ListaEmpaque', 
        'Codigo_Siesa', 'Codigo_FDA', 'Cliente', 'Direccion', 'Lote', 
        'Descripcion', 'DescripFactura', 'CajasOrden', 'CajasDespachadas', 
        'CantidadCaja', 'TotalTM', 'PesoUnd', 'PesoCj', 'KgNet', 'KgBrt', 
        'ValorKg', 'USD', 'CantidadEstibas', 'FechaOrden', 'FechaETD', 
        'FechaETA', 'FechaETAF', 'FechaQB', 'DescripcionExcel', 'DescripFacExcel', 'TipoDato'
    ];

    // Aplicar estilos a los encabezados
    $col = 'A';
    foreach ($encabezados as $encabezado) {
        $sheet->setCellValue($col . '1', $encabezado);
        $sheet->getStyle($col . '1')->getFont()->setBold(true);
        $sheet->getStyle($col . '1')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('FFE6E6FA');
        $col++;
    }

    // LLENAR DATOS CON BIND_RESULT
    $fila = 2;
    $contadorFilas = 0;
    
    while ($stmt->fetch()) {
        $sheet->setCellValue('A' . $fila, $Anio);
        $sheet->setCellValue('B' . $fila, $Mes);
        $sheet->setCellValue('C' . $fila, $Frecuencia);
        $sheet->setCellValue('D' . $fila, $Region);
        $sheet->setCellValue('E' . $fila, $Orden);
        $sheet->setCellValue('F' . $fila, $ListaEmpaque);
        $sheet->setCellValue('G' . $fila, $Codigo_Siesa);
        $sheet->setCellValue('H' . $fila, $Codigo_FDA);
        $sheet->setCellValue('I' . $fila, $Cliente);
        $sheet->setCellValue('J' . $fila, $Direccion);
        $sheet->setCellValue('K' . $fila, $Lote);
        $sheet->setCellValue('L' . $fila, $Descripcion);
        $sheet->setCellValue('M' . $fila, $DescripFactura);
        $sheet->setCellValue('N' . $fila, $CajasOrden);
        $sheet->setCellValue('O' . $fila, $CajasDespachadas);
        $sheet->setCellValue('P' . $fila, $CantidadCaja);
        $sheet->setCellValue('Q' . $fila, $TotalTM);
        $sheet->setCellValue('R' . $fila, $PesoUnd);
        $sheet->setCellValue('S' . $fila, $PesoCj);
        $sheet->setCellValue('T' . $fila, $KgNet);
        $sheet->setCellValue('U' . $fila, $KgBrt);
        $sheet->setCellValue('V' . $fila, $ValorKg);
        $sheet->setCellValue('W' . $fila, $USD);
        $sheet->setCellValue('X' . $fila, $CantidadEstibas);
        $sheet->setCellValue('Y' . $fila, $FechaOrden);
        $sheet->setCellValue('Z' . $fila, $FechaETD);
        $sheet->setCellValue('AA' . $fila, $FechaETA);
        $sheet->setCellValue('AB' . $fila, $FechaETAF);
        $sheet->setCellValue('AC' . $fila, $FechaQB);
        $sheet->setCellValue('AD' . $fila, $DescripcionExcel);
        $sheet->setCellValue('AE' . $fila, $DescripFacExcel);
        $sheet->setCellValue('AF' . $fila, $TipoDato);
        
        $fila++;
        $contadorFilas++;
    }

    // Si no hay datos, mostrar mensaje
    if ($contadorFilas === 0) {
        $sheet->setCellValue('A2', 'No hay datos para las fechas seleccionadas: ' . $fechaDesde . ' a ' . $fechaHasta);
    }

    // Autoajustar columnas
    foreach (range('A', 'AF') as $columnID) {
        $sheet->getColumnDimension($columnID)->setAutoSize(true);
    }

    // GENERAR Y DESCARGAR ARCHIVO
    $archivoExcel = "Consolidacion_Pedidos_Unificada_" . date("Ymd_His") . ".xlsx";
    
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="' . $archivoExcel . '"');
    header('Cache-Control: max-age=0');
    
    $writer = new Xlsx($spreadsheet);
    $writer->save('php://output');
    exit;

} catch (Exception $e) {
    die(json_encode(["error" => "Error al generar el Excel: " . $e->getMessage()]));
}