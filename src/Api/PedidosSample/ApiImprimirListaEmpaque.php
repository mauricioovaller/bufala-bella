<?php
require_once($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/fpdf/fpdf.php");  // Incluye la librería FPDF
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4"); // 👈 importante
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Verificar si la petición es POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["error" => "Método no permitido. Usa POST."]));
}

// Obtener los datos enviados en formato JSON
$input = json_decode(file_get_contents("php://input"), true);

// Verificar si se recibió el ID del pedido correctamente
if (!isset($input['idPedido']) || empty($input['idPedido'])) {
    die(json_encode(["error" => "ID de pedido no válido."]));
}

$idPedido = intval($input['idPedido']);

// Primero estableces el idioma para la sesión
$enlace->query("SET lc_time_names = 'es_ES'");
// Consultar datos del encabezado del pedido
$sqlEncabezado = "SELECT 
                    CONCAT('SAMPLE - ',enc.Id_EncabPedido) AS NoListaEmpaque,
                    DATE_FORMAT(enc.FechaOrden, '%W, %e de %M de %Y') AS FechaOrden,
                    DATE_FORMAT(enc.FechaSalida, '%W, %e de %M de %Y') AS FechaSalida,
                    enc.FechaEnroute,
                    enc.FechaDelivery,
                    DATE_FORMAT(enc.FechaDelivery, '%W, %e de %M de %Y') AS FechaEntregaCliente,
                    DATE_FORMAT(DATE_ADD(enc.FechaIngreso, INTERVAL 30 DAY), '%W, %e de %M de %Y') AS FechaVencimiento,
                    enc.GuiaMaster AS NoGuia,
                    '' AS FEX,
                    COALESCE(age.NOMAGENCIA, '') AS AgenciaCarga,
                    COALESCE(aer.NOMAEROLINEA, '') AS Aerolinea,
                    'GT Brokers Corp' AS Brokers,
                    '' AS Inv,
                    CONCAT(enc.Cliente, ' - ') AS Destino_ClienteFinal,
                    enc.PurchaseOrder,
                    enc.CantidadEstibas,
                    enc.Observaciones,
                    enc.Cliente AS NombreCliente,
                    '' AS Region,
                    '' AS Direccion,
                    trans.Nombre AS Transportadora,
                    bod.Descripcion AS Bodega
                  FROM EncabPedidoSample enc
                  LEFT JOIN Transportadoras trans ON enc.Id_Transportadora = trans.Id_Transportadora
                  LEFT JOIN Bodegas bod ON enc.Id_Bodega = bod.Id_Bodega
                  LEFT JOIN Agencias age ON enc.IdAgencia = age.IdAgencia
                  LEFT JOIN Aerolineas aer ON enc.IdAerolinea = aer.IdAerolinea
                  WHERE enc.Id_EncabPedido = ?";

$stmtEncabezado = $enlace->prepare($sqlEncabezado);
$stmtEncabezado->bind_param("i", $idPedido);
$stmtEncabezado->execute();
$stmtEncabezado->bind_result(
    $noListaEmpaque,
    $fechaOrden,
    $fechaSalida,
    $fechaEnroute,
    $fechaDelivery,
    $fechaEntregaCliente,
    $fechaVencimiento,
    $noGuia,
    $fex,
    $agenciaCarga,
    $aerolinea,
    $brokers,
    $inv,
    $destinoClienteFinal,
    $purchaseOrder,
    $cantidadEstibas,
    $observaciones,
    $nombreCliente,
    $region,
    $direccion,
    $transportadora,
    $bodega
);

if (!$stmtEncabezado->fetch()) {
    die(json_encode(["error" => "Pedido no encontrado."]));
}
$stmtEncabezado->close();

// Consultar datos del detalle del pedido
$sqlDetalle = "SELECT 
                det.Id_DetPedido,
                prod.DescripProducto,
                prod.DescripFactura,
                prod.Codigo_Siesa,
                det.Descripcion,
                emb.Descripcion AS DescripEmbalaje,
                emb.Cantidad AS CantidadEmbalaje,
                '' AS LoteNo,
                '' AS RespEmbalaje,
                CASE 
                    WHEN prod.DescripProducto NOT LIKE '%Orgánic%' AND prod.DescripProducto NOT LIKE '%Organic%' THEN 'X'
                    ELSE ''
                END AS LineaConvencional,
                CASE 
                    WHEN prod.DescripProducto LIKE '%Orgánic%' OR prod.DescripProducto LIKE '%Organic%' THEN 'X'
                    ELSE ''
                END AS LineaOrganica,
                det.Cantidad AS Cajas,
                emb.Cantidad AS CantidadPorEmbalaje,
                (det.Cantidad * emb.Cantidad) AS TotalEmbalajes,
                det.PrecioUnitario,
                (prod.PesoGr / 1000) AS PesoUnd,
                (emb.Cantidad * prod.PesoGr / 1000) AS PesoCaja,
                prod.FactorPesoBruto,
                (det.Cantidad * emb.Cantidad * prod.PesoGr / 1000) AS PesoNetoKg,
                (det.Cantidad * emb.Cantidad * prod.PesoGr * prod.FactorPesoBruto / 1000) AS PesoBrutoKg,
                ((det.Cantidad * emb.Cantidad * prod.PesoGr / 1000) * det.PrecioUnitario) AS Subtotal
               FROM DetPedidoSample det
               INNER JOIN Productos prod ON det.Id_Producto = prod.Id_Producto
               INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
               WHERE det.Id_EncabPedido = ?
               ORDER BY det.Id_DetPedido";

$stmtDetalle = $enlace->prepare($sqlDetalle);
$stmtDetalle->bind_param("i", $idPedido);
$stmtDetalle->execute();
$stmtDetalle->bind_result(
    $idDetalle,
    $descripProducto,
    $descripFactura,
    $codigoSiesa,
    $descripcionPedido,
    $descripEmbalaje,
    $cantidadEmbalaje,
    $loteNo,
    $respEmbalaje,
    $lineaConvencional,
    $lineaOrganica,
    $cajas,
    $cantidadPorEmbalaje,
    $totalEmbalajes,
    $precioUnitario,
    $pesoUnd,
    $pesoCaja,
    $factorPesoBruto,
    $pesoNetoKg,
    $pesoBrutoKg,
    $subtotal,
);

// Calcular totales
$totalCajas = 0;
$totalTotalEmbalajes = 0;
$totalPesoNeto = 0;
$totalPesoBruto = 0;
$totalValor = 0;

$detalles = [];
while ($stmtDetalle->fetch()) {
    $detalles[] = [
        'id_detalle' => $idDetalle,
        'descrip_producto' => $descripProducto,
        'descrip_factura' => $descripFactura,
        'codigo_siesa' => $codigoSiesa,
        'descrip_pedido' => $descripcionPedido,
        'descrip_embalaje' => $descripEmbalaje,
        'cantidad_embalaje' => $cantidadEmbalaje,
        'lote_no' => $loteNo,
        'resp_embalaje' => $respEmbalaje,
        'linea_convencional' => $lineaConvencional,
        'linea_organica' => $lineaOrganica,
        'cajas' => $cajas,
        'cantidad_por_embalaje' => $cantidadPorEmbalaje,
        'total_embalajes' => $totalEmbalajes,
        'precio_unitario' => $precioUnitario,
        'peso_und' => $pesoUnd,
        'peso_caja' => $pesoCaja,
        'factor_peso_bruto' => $factorPesoBruto,
        'peso_netoKg' => $pesoNetoKg,
        'peso_brutoKg' => $pesoBrutoKg,
        'subtotal' => $subtotal
    ];

    $totalCajas += $cajas;
    $totalTotalEmbalajes += $totalEmbalajes;
    $totalPesoNeto += $pesoNetoKg;
    $totalPesoBruto += $pesoBrutoKg;
}
$stmtDetalle->close();
// ======================
// GENERAR PDF
// ======================
class PDF extends FPDF
{
    function Header()
    {
        // Logo alineado a la izquierda
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalabella.jpg", 15, 15, 70);
        // Título centrado
        $this->SetFont('Arial', 'B', 8);
        $this->Cell(81, 5, '', 'LTR', 0,  'C');
        $this->Cell(147, 5, 'SIC - SISTEMA INTEGRADO DE CALIDAD', 'LTR', 0,  'C');
        $this->Cell(34, 5, 'EXPORTACIONES', 'LTR', 1, 'C');

        $this->Cell(81, 5, '', 'LR', 0,  'C');
        $this->Cell(147, 5, '', 'LRB', 0,  'C');
        $this->Cell(17, 5, utf8_decode('Página'), 1, 0, 'C');
        $this->Cell(17, 5, utf8_decode('Código'), 1, 1, 'C');

        $this->Cell(81, 5, '', 'LR', 0,  'C');
        $this->Cell(147, 5, '', 'LRT', 0,  'C');
        $this->Cell(17, 5, utf8_decode('1 de 1'), 1, 0, 'C');
        $this->Cell(17, 5, utf8_decode('R-EXP-002'), 1, 1, 'C');

        $this->Cell(81, 5, '', 'LR', 0,  'C');
        $this->Cell(147, 5, utf8_decode('SOLICITUD DE PRODUCCIÓN/ LISTA DE  EMPAQUE  - PRODUCTO TERMINADO PARA EXPORTACIÓN'), 'LR', 0,  'C');
        $this->Cell(17, 5, utf8_decode('Versión'), 1, 0, 'C');
        $this->Cell(17, 5, utf8_decode('Fecha'), 1, 1, 'C');

        $this->Cell(81, 5, '', 'LRB', 0,  'C');
        $this->Cell(147, 5, '', 'LRB', 0,  'C');
        $this->Cell(17, 5, utf8_decode('5'), 1, 0, 'C');
        $this->Cell(17, 5, utf8_decode('01/02/2024'), 1, 1, 'C');

        $this->Ln(3);
    }

    function Footer()
    {
        $this->SetY(-15);
        $this->SetFont('Arial', 'I', 8);
        $this->Cell(0, 10, 'Pagina ' . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }
}

$pdf = new PDF('L', 'mm', array(216, 279)); // P = Portrait, mm = milímetros, tamaño  carta
$pdf->SetMargins(10, 10, 10);                // Izquierda, arriba, derecha
$pdf->AliasNbPages();
$pdf->AddPage();

// ENCABEZADO DEL PEDIDO
$pdf->SetFont('Arial', 'B', 8);
$pdf->Cell(51, 6, 'Lista Empaque Orden BUF No. ', 1, 0, 'L');
$pdf->SetFont('Arial', '', 8);
$pdf->Cell(36, 6, $noListaEmpaque, 1, 0, 'L');
$pdf->SetFont('Arial', 'B', 8);
$pdf->Cell(59, 6, utf8_decode('Fecha Recepción Orden'), 1, 0, 'L');
$pdf->SetFont('Arial', '', 8);
$pdf->Cell(116, 6, $fechaOrden, 1, 1, 'C');

$pdf->SetFont('Arial', '', 8);
$pdf->Cell(51, 6, 'AWB No.' . $noGuia, 1, 0, 'L');
$pdf->Cell(36, 6, 'FEX-', 1, 0, 'L');
$pdf->Cell(59, 6, 'Agencia Carga: ' . $agenciaCarga, 1, 0, 'L');
$pdf->Cell(59, 6, 'Aerolinea: ' . $aerolinea, 1, 0, 'L');
$pdf->Cell(37, 6, 'Broker: ' . $brokers, 1, 0, 'L');
$pdf->Cell(20, 6, 'Inv.' . $inv, 1, 1, 'L');

function dibujarFilaConAlturaVariable($pdf, $etiqueta, $texto, $oc)
{
    // Configuración
    $ancho_etiqueta = 35;
    $ancho_texto = 191;
    $ancho_oc = 36;
    $altura_linea = 6;

    // Guardar posición inicial
    $x_inicial = $pdf->GetX();
    $y_inicial = $pdf->GetY();

    // Calcular altura necesaria
    $texto_utf8 = utf8_decode($texto);
    $ancho_texto_calculado = $ancho_texto - 2; // Margen interno
    $num_lineas = max(1, ceil($pdf->GetStringWidth($texto_utf8) / $ancho_texto_calculado));
    $altura_total = $num_lineas * $altura_linea;

    // Dibujar etiqueta
    $pdf->SetFont('Arial', 'B', 8);
    $pdf->Cell($ancho_etiqueta, $altura_total, $etiqueta, 1, 0, 'L');

    // Dibujar texto con MultiCell
    $pdf->SetFont('Arial', '', 8);
    $pdf->MultiCell($ancho_texto, $altura_linea, $texto_utf8, 1, 'L');

    // Calcular nueva posición Y después del MultiCell
    $nuevo_y = $pdf->GetY();

    // Dibujar O.C. alineada con la fila completa
    $pdf->SetXY($x_inicial + $ancho_etiqueta + $ancho_texto, $y_inicial);
    $pdf->Cell($ancho_oc, $altura_total, 'O.C.' . $oc, 1, 0, 'L');

    // Mover a la siguiente línea
    $pdf->SetY($nuevo_y);
}

// Llamar la función reemplazando tu código original
dibujarFilaConAlturaVariable($pdf, 'Destino / Cliente Final ', $destinoClienteFinal, $purchaseOrder);

$pdf->SetFont('Arial', 'B', 8);
$pdf->Cell(90, 6, 'Fecha Solicitud Inicial Entrega Aeropuerto El Dorado (BOG) ', 'LTB', 0, 'L');
$pdf->Cell(46, 6, utf8_decode($fechaSalida), 'TBR', 0, 'L');
$pdf->Cell(49, 6, 'Fecha Final Entrega Cliente: ', 'LTB', 0, 'L');
$pdf->Cell(47, 6, utf8_decode($fechaEntregaCliente), 'TBR', 0, 'L');
$pdf->Cell(30, 6, 'Cant Estibas: ' . $cantidadEstibas, 1, 1, 'L');

$pdf->Ln(3);

// DETALLE DEL PEDIDO


// Encabezado de la tabla de detalle
$pdf->SetFont('Arial', 'B', 7);
$pdf->Cell(16, 6, utf8_decode('Cód. Siesa'), 1, 0, 'C');
$pdf->Cell(65, 6, utf8_decode('Referencia - Presentación'), 1, 0, 'C');
$pdf->Cell(17, 6, 'Lote No.', 1, 0, 'C');
$pdf->Cell(19, 6, 'Resp. Embalaje', 1, 0, 'C');
$pdf->Cell(12, 6, 'Linea C', 1, 0, 'C');
$pdf->Cell(12, 6, 'Linea O', 1, 0, 'C');
$pdf->Cell(19, 6, 'Cantidad Cajas', 1, 0, 'C');
$pdf->Cell(16, 6, 'TM X Caja', 1, 0, 'C');
$pdf->Cell(16, 6, 'Total TM', 1, 0,  'C');
$pdf->Cell(19, 6, 'Peso X Unidad', 1, 0, 'C');
$pdf->Cell(17, 6, 'Peso X Caja', 1, 0, 'C');
$pdf->Cell(17, 6, 'Kg Netos', 1, 0, 'C');
$pdf->Cell(17, 6, 'Kg Brutos', 1, 0, 'C');

$pdf->Ln();

// Detalle de productos
$pdf->SetFont('Arial', '', 7);
foreach ($detalles as $detalle) {
    $pdf->Cell(16, 6, utf8_decode($detalle['codigo_siesa']), 1);
    $pdf->Cell(65, 6, utf8_decode($detalle['descrip_producto']), 1);
    $pdf->Cell(17, 6, utf8_decode($detalle['lote_no']), 1);
    $pdf->Cell(19, 6, utf8_decode($detalle['resp_embalaje']), 1);
    $pdf->Cell(12, 6, utf8_decode($detalle['linea_convencional']), 1, 0, 'C');
    $pdf->Cell(12, 6, utf8_decode($detalle['linea_organica']), 1, 0, 'C');
    $pdf->Cell(19, 6, number_format($detalle['cajas'], 0), 1, 0, 'R');
    $pdf->Cell(16, 6, number_format($detalle['cantidad_por_embalaje'], 0), 1, 0, 'R');
    $pdf->Cell(16, 6, number_format($detalle['total_embalajes'], 0), 1, 0, 'R');
    $pdf->Cell(19, 6, number_format($detalle['peso_und'], 2), 1, 0, 'R');
    $pdf->Cell(17, 6, number_format($detalle['peso_caja'], 2), 1, 0, 'R');
    $pdf->Cell(17, 6, number_format($detalle['peso_netoKg'], 2), 1, 0, 'R');
    $pdf->Cell(17, 6, number_format($detalle['peso_brutoKg'], 2), 1, 0, 'R');
    $pdf->Ln();
}

// TOTALES
$pdf->SetFont('Arial', 'B', 9);
$pdf->Cell(141, 6, 'TOTALES:', 1);
$pdf->Cell(19, 6, number_format($totalCajas, 0), 1, 0, 'R');
$pdf->Cell(16, 6, '', 1, 0, 'R');
$pdf->Cell(16, 6, number_format($totalTotalEmbalajes, 0), 1, 0, 'R');
$pdf->Cell(19, 6, '', 1, 0, 'R');
$pdf->Cell(17, 6, '', 1, 0, 'R');
$pdf->Cell(17, 6, number_format($totalPesoNeto, 2), 1, 0, 'R');
$pdf->Cell(17, 6, number_format($totalPesoBruto, 2), 1, 0, 'R');
$pdf->Ln();

$pdf->Ln(3);
$pdf->Cell(141, 6, utf8_decode('C: Producto Terminado Convencional, O: Producto Terminado Orgánico '), 0, 1);

// OBSERVACIONES
if (!empty($observaciones)) {
    $pdf->SetFont('Arial', 'B', 9);
    $pdf->Cell(30, 6, 'Observaciones: ', 0, 0, 'L');
    $pdf->SetFont('Arial', '', 9);
    $pdf->MultiCell(188, 6, utf8_decode($observaciones), 0, 1);
}

$pdf->Ln(8);
$pdf->SetFont('Arial', 'B', 8);
$pdf->Cell(160, 6, '', 0, 0);
$pdf->Cell(51, 6, 'RECIBIDO Y APROBADO POR:', 0, 0);
$pdf->Cell(51, 6, '', 'B', 1);
$pdf->SetFont('Arial', 'B', 8);
$pdf->Cell(211, 6, '', 0, 0);
$pdf->Cell(51, 6, 'Supervisor de Cto. Frio', 0, 1, 'C');
$pdf->Cell(160, 6, '', 0, 0);
$pdf->Cell(51, 6, 'Fecha Minima de Vencimiento Aceptada: ' . utf8_decode($fechaVencimiento), 0, 1, 'L');



$pdf->Output('I', 'Lista Empaque No' . $noListaEmpaque . '.pdf'); // 'I' para mostrar en navegador
