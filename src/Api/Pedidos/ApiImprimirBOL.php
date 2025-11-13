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
                    enc.Id_EncabPedido AS NoListaEmpaque,
                    DATE_FORMAT(enc.FechaOrden, '%W, %e de %M de %Y') AS FechaOrden,
                    DATE_FORMAT(enc.FechaSalida, '%W, %e de %M de %Y') AS FechaSalida,
                    enc.FechaEnroute,
                    DATE_FORMAT(enc.FechaEnroute, '%d-%b-%y') AS FechaEnrouteFormateada,
                    enc.FechaDelivery,
                    DATE_FORMAT(enc.FechaDelivery, '%d-%b-%y') AS FechaDeliveryFormateada,
                    DATE_FORMAT(enc.FechaIngreso, '%W, %e de %M de %Y') AS FechaEntregaCliente,
                    DATE_FORMAT(DATE_ADD(enc.FechaIngreso, INTERVAL 30 DAY), '%W, %e de %M de %Y') AS FechaVencimiento,
                    '' AS NoGuia,
                    '' AS FEX,
                    'Kuehne + Nagel S.A.S' AS AgenciaCarga,
                    'UPS' AS Aerolinea,
                    'GT Brokers Corp' AS Brokers,
                    '' AS Inv,
                    CONCAT(cli.Nombre, ' - ', cliReg.Direccion) AS Destino_ClienteFinal,
                    enc.PurchaseOrder,
                    enc.CantidadEstibas,
                    enc.Observaciones,
                    cli.Nombre AS NombreCliente,
                    cliReg.Region,
                    cliReg.Direccion,
                    trans.Nombre AS Transportadora,
                    CONCAT(trans.Nombre, ' - ', trans.Direccion) AS TransportadoraFinal,
                    bod.Descripcion AS Bodega
                  FROM EncabPedido enc
                  INNER JOIN Clientes cli ON enc.Id_Cliente = cli.Id_Cliente
                  INNER JOIN ClientesRegion cliReg ON enc.Id_ClienteRegion = cliReg.Id_ClienteRegion
                  LEFT JOIN Transportadoras trans ON enc.Id_Transportadora = trans.Id_Transportadora
                  LEFT JOIN Bodegas bod ON enc.Id_Bodega = bod.Id_Bodega
                  WHERE enc.Id_EncabPedido = ?";

$stmtEncabezado = $enlace->prepare($sqlEncabezado);
$stmtEncabezado->bind_param("i", $idPedido);
$stmtEncabezado->execute();
$stmtEncabezado->bind_result(
    $noListaEmpaque,
    $fechaOrden,
    $fechaSalida,
    $fechaEnroute,
    $fechaEnrouteFormateada,
    $fechaDelivery,
    $fechaDeliveryFormateada,
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
    $transportadoraFinal,
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
                CONCAT(emb.Lado1, ' x ', emb.Lado2, ' x ', emb.Lado3) AS BoxSize,
                ROUND((emb.Lado1 * emb.Lado2 * emb.Lado3) / 1728 * det.Cantidad, 3) AS Cubes,
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
               FROM DetPedido det
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
    $boxSize,
    $cubes,
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
$totalCubes = 0;
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
        'box_size' => $boxSize,
        'cubes' => $cubes,
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

    $totalCubes += $cubes;
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
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufCreamery.jpg", 172, 15, 30);
        // Título centrado
        $this->SetFont('Arial', 'B', 9);
        $this->Cell(198, 3, '', 'LTR', 1,  'L');
        $this->Cell(198, 5, 'BUF Creamery LLC', 'LR', 1,  'L');
        $this->SetFont('Arial', '', 8);
        $this->Cell(198, 4, 'PO Box 506', 'LR', 1,  'L');
        $this->Cell(198, 4, 'Charlottesville VA, 22902', 'LR', 1,  'L');
        $this->Cell(198, 9, '', 'LBR', 1,  'L');

        $this->Ln(8);       
        
    }

    function Footer()
    {
        $this->SetY(-15);
        $this->SetFont('Arial', 'I', 8);
        $this->Cell(0, 10, 'Pagina ' . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }
}

$pdf = new PDF('P', 'mm', array(216, 279)); // P = Portrait, mm = milímetros, tamaño  carta
$pdf->SetMargins(10, 10, 10);                // Izquierda, arriba, derecha
$pdf->AliasNbPages();
$pdf->AddPage();

// ENCABEZADO DEL PEDIDO
$pdf->SetFont('Arial', 'B', 9);
$pdf->Cell(98, 3, '', 'LTR', 0,  'L');
$pdf->Cell(2, 3, '', '0', 0,  'L');
$pdf->Cell(98, 3, '', 'LTR', 1,  'L');
$pdf->Cell(98, 3, 'CONSIGNEE:', 'LR', 0,  'L');
$pdf->Cell(2, 3, '', '0', 0,  'L');
$pdf->Cell(98, 3, 'CARRIER:', 'LR', 1,  'L');

$pdf->SetFont('Arial', '', 8);
// Coordenadas iniciales
$yInicio = $pdf->GetY();
$xInicio = $pdf->GetX();

// --- PRIMERA CELDA ---
$pdf->SetXY($xInicio, $yInicio);
$pdf->MultiCell(98, 8, utf8_decode($destinoClienteFinal), 'LRB', 'L');
$alturaDestino = $pdf->GetY() - $yInicio;

// --- SEGUNDA CELDA ---
$pdf->SetXY($xInicio + 100, $yInicio);
$pdf->MultiCell(98, 8, utf8_decode($transportadoraFinal), 'LRB', 'L');
$alturaTransp = $pdf->GetY() - $yInicio;

// --- ALTURA MÁXIMA ---
$alturaMax = max($alturaDestino, $alturaTransp);

// --- RELLENAR SOLO EL BORDE INFERIOR FALTANTE ---
if ($alturaDestino < $alturaMax) {
    $pdf->Line($xInicio, $yInicio + $alturaMax, $xInicio + 98, $yInicio + $alturaMax); // línea inferior
    $pdf->Line($xInicio + 98, $yInicio, $xInicio + 98, $yInicio + $alturaMax); // borde derecho
}
if ($alturaTransp < $alturaMax) {
    $pdf->Line($xInicio + 100, $yInicio + $alturaMax, $xInicio + 198, $yInicio + $alturaMax); // línea inferior
    $pdf->Line($xInicio + 198, $yInicio, $xInicio + 198, $yInicio + $alturaMax); // borde derecho
}

// --- Mover cursor a la siguiente línea ---
$pdf->SetY($yInicio + $alturaMax);


$pdf->Ln(5);

// bloque para shipper y comments

$pdf->SetFont('Arial', 'B', 9);
$pdf->Cell(98, 3, '', 'LTR', 0,  'L');
$pdf->Cell(2, 3, '', 0, 0,  'L');
$pdf->Cell(98, 3, '', 'LTR', 1,  'L');
$pdf->Cell(98, 3, 'SHIPPER:', 'LR', 0,  'L');
$pdf->Cell(2, 3, '', 0, 0,  'L');
$pdf->Cell(98, 3, 'COMMENTS:', 'LR', 1,  'L');
$pdf->Cell(98, 3, '', 'LR', 0,  'L');
$pdf->Cell(2, 3, '', 0, 0,  'L');
$pdf->Cell(98, 3, '', 'LR', 1,  'L');
$pdf->Cell(98, 3, 'BUF CREAMERY LLC', 'LR', 0,  'L');
$pdf->Cell(2, 3, '', 0, 0,  'L');
$pdf->Cell(98, 3, '', 'LR', 1,  'L');
$pdf->SetFont('Arial', '', 8);
$pdf->Cell(98, 3, 'PO BOX 506 ', 'LR', 0,  'L');
$pdf->Cell(2, 3, '', 0, 0,  'L');
$pdf->Cell(98, 3, '', 'LR', 1,  'L');
$pdf->Cell(98, 3, 'Charlottesvile VA, 22902', 'LR', 0,  'L');
$pdf->Cell(2, 3, '', 0, 0,  'L');
$pdf->Cell(98, 3, '', 'LR', 1,  'L');
$pdf->Cell(98, 3, '(434) 434-0034', 'LRB', 0,  'L');
$pdf->Cell(2, 3, '', 0, 0,  'L');
$pdf->Cell(98, 3, '', 'LRB', 1,  'L');

// Fin bloque para shipper y comments

$pdf->Ln(5);

$pdf->SetFont('Arial', 'B', 9);
$pdf->Cell(140, 5, '', 0, 0,  'L');
$pdf->Cell(38, 5, 'Purchase Order#:', 'LT', 0,  'R');
$pdf->Cell(20, 5, $purchaseOrder, 'TR', 1,  'L');
$pdf->Cell(140, 5, '', 0, 0,  'L');
$pdf->Cell(38, 5, 'Date Enroute:', 'L', 0,  'R');
$pdf->Cell(20, 5, $fechaEnrouteFormateada, 'R', 1,  'L');
$pdf->Cell(140, 5, '', 0, 0,  'L');
$pdf->Cell(38, 5, 'Date of Delivery:', 'LB', 0,  'R');
$pdf->Cell(20, 5, $fechaDeliveryFormateada, 'BR', 1,  'L');

$pdf->Ln(5);
// DETALLE DEL PEDIDO

// Encabezado de la tabla de detalle
$pdf->SetFont('Arial', 'B', 7);
$pdf->Cell(30, 6, 'Producer', 1 , 0, 'C');
$pdf->Cell(115, 6, 'Product', 1 , 0, 'C');
$pdf->Cell(19, 6, 'Box Size', 1 , 0, 'C');
$pdf->Cell(19, 6, 'Cubes', 1 , 0, 'C');
$pdf->Cell(15, 6, 'Pieces', 1, 0, 'C');

$pdf->Ln();

// Detalle de productos
$pdf->SetFont('Arial', '', 7);
foreach ($detalles as $detalle) {
    $pdf->Cell(30, 6, utf8_decode('BUF CREAMERY'), 1);
    $pdf->Cell(115, 6, utf8_decode($detalle['descrip_pedido']), 1);
    $pdf->Cell(19, 6, utf8_decode($detalle['box_size']), 1, 0, 'C');
    $pdf->Cell(19, 6, utf8_decode($detalle['cubes']), 1, 0, 'C');
    $pdf->Cell(15, 6, number_format($detalle['cajas'], 0), 1, 0, 'R');
    $pdf->Ln();
}

// TOTALES
$pdf->SetFont('Arial', 'B', 9);
$pdf->Cell(164, 6, 'Total:', 1, 0, 'R');
$pdf->Cell(19, 6, number_format($totalCubes, 3), 1, 0, 'R');
$pdf->Cell(15, 6, number_format($totalCajas, 0), 1, 1, 'R');

$pdf->Cell(183, 6, 'Total Stowage:', 1, 0, 'R');
$pdf->Cell(15, 6, number_format($cantidadEstibas, 2), 1, 1, 'R');
$pdf->Ln(8);

// OBSERVACIONES
if (!empty($observaciones)) {   
    $pdf->SetFont('Arial', 'B', 9);
    $pdf->Cell(30, 6, 'Observaciones: ', 0, 0, 'L');
    $pdf->SetFont('Arial', '', 9);
    $pdf->MultiCell(188, 6, utf8_decode($observaciones), 0, 1);
}

$pdf->Ln(8);

$pdf->Cell(49, 15, 'Recived by:', 1, 0, 'L');
$pdf->Cell(1, 15, '', 0, 0, 'L');
$pdf->Cell(49, 15, 'Initials:', 1, 0, 'L');
$pdf->Cell(1, 15, '', 0, 0, 'L');
$pdf->Cell(49, 15, 'Temperature:', 1, 0, 'L');
$pdf->Cell(1, 15, '', 0, 0, 'L');
$pdf->Cell(49, 15, 'Driver:', 1, 0, 'L');

$pdf->Ln(3);

$pdf->Output('I', 'Lista Empaque No' . $noListaEmpaque . '.pdf'); // 'I' para mostrar en navegador
