<?php
require_once($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/fpdf/fpdf.php");
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Verificar si la petición es POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["error" => "Método no permitido. Usa POST."]));
}

// Obtener los datos enviados en formato JSON
$input = json_decode(file_get_contents("php://input"), true);

// Verificar filtros
if (!isset($input['fechaDesde']) || !isset($input['fechaHasta']) || !isset($input['tipoDocumento'])) {
    die(json_encode(["error" => "Filtros requeridos: fechaDesde, fechaHasta, tipoDocumento"]));
}

$fechaDesde = $input['fechaDesde'];
$fechaHasta = $input['fechaHasta'];
$bodegaId = $input['bodegaId'] ?? '';
$tipoDocumento = $input['tipoDocumento'];

// Consultar pedidos según filtros
$sqlPedidos = "SELECT ep.Id_EncabPedido 
               FROM EncabPedido ep
               WHERE ep.FechaSalida BETWEEN ? AND ?";
               
$params = [$fechaDesde, $fechaHasta];
$types = "ss";

if (!empty($bodegaId)) {
    $sqlPedidos .= " AND ep.Id_Bodega = ?";
    $params[] = $bodegaId;
    $types .= "i";
}

$sqlPedidos .= " ORDER BY ep.FechaSalida, ep.Id_EncabPedido";

$stmtPedidos = $enlace->prepare($sqlPedidos);
if ($stmtPedidos === false) {
    die(json_encode(["error" => "Error en la consulta: " . $enlace->error]));
}

$stmtPedidos->bind_param($types, ...$params);
$stmtPedidos->execute();
$stmtPedidos->bind_result($idPedido);

$pedidosIds = [];
while ($stmtPedidos->fetch()) {
    $pedidosIds[] = $idPedido;
}
$stmtPedidos->close();

if (empty($pedidosIds)) {
    die(json_encode(["error" => "No se encontraron pedidos con los filtros especificados"]));
}

// ======================
// CLASE PDF PARA MÚLTIPLES BOLs
// ======================
class PDF extends FPDF
{
    private $pedidoCount = 0;
    
    function Header()
    {
        // Logo alineado a la derecha
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
    
    function agregarBOL($idPedido, $enlace) {
        $this->pedidoCount++;
        
        // Agregar nueva página para cada pedido después del primero
        if ($this->pedidoCount > 1) {
            $this->AddPage();
        }

        // Primero estableces el idioma para la sesión
        $enlace->query("SET lc_time_names = 'es_ES'");

        // Consultar datos del encabezado del pedido CON COMENTARIOS
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
            bod.Descripcion AS Bodega,
            -- 👇 NUEVO: Campos de comentarios seleccionados
            enc.ComentarioPrimario,
            enc.ComentarioSecundario,
            -- 👇 NUEVO: Campos de comentarios de la tabla Comentarios (usando subconsulta)
            (SELECT ComentarioPrimario FROM Comentarios 
             WHERE Id_Cliente = enc.Id_Cliente AND Id_ClienteRegion = enc.Id_ClienteRegion 
             LIMIT 1) AS TextoComentarioPrimario,
            (SELECT ComentarioSecundario FROM Comentarios 
             WHERE Id_Cliente = enc.Id_Cliente AND Id_ClienteRegion = enc.Id_ClienteRegion 
             LIMIT 1) AS TextoComentarioSecundario
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
            $bodega,
            // 👇 NUEVO: Variables para comentarios
            $comentarioPrimarioSeleccionado,
            $comentarioSecundarioSeleccionado,
            $textoComentarioPrimario,
            $textoComentarioSecundario
        );

        if (!$stmtEncabezado->fetch()) {
            $stmtEncabezado->close();
            return false;
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
            $subtotal
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

        // ENCABEZADO DEL PEDIDO
        $this->SetFont('Arial', 'B', 9);
        $this->Cell(98, 3, '', 'LTR', 0,  'L');
        $this->Cell(2, 3, '', '0', 0,  'L');
        $this->Cell(98, 3, '', 'LTR', 1,  'L');
        $this->Cell(98, 3, 'CONSIGNEE:', 'LR', 0,  'L');
        $this->Cell(2, 3, '', '0', 0,  'L');
        $this->Cell(98, 3, 'CARRIER:', 'LR', 1,  'L');

        $this->SetFont('Arial', '', 8);
        // Coordenadas iniciales
        $yInicio = $this->GetY();
        $xInicio = $this->GetX();

        // --- PRIMERA CELDA ---
        $this->SetXY($xInicio, $yInicio);
        $this->MultiCell(98, 8, utf8_decode($destinoClienteFinal), 'LRB', 'L');
        $alturaDestino = $this->GetY() - $yInicio;

        // --- SEGUNDA CELDA ---
        $this->SetXY($xInicio + 100, $yInicio);
        $this->MultiCell(98, 8, utf8_decode($transportadoraFinal), 'LRB', 'L');
        $alturaTransp = $this->GetY() - $yInicio;

        // --- ALTURA MÁXIMA ---
        $alturaMax = max($alturaDestino, $alturaTransp);

        // --- RELLENAR SOLO EL BORDE INFERIOR FALTANTE ---
        if ($alturaDestino < $alturaMax) {
            $this->Line($xInicio, $yInicio + $alturaMax, $xInicio + 98, $yInicio + $alturaMax); // línea inferior
            $this->Line($xInicio + 98, $yInicio, $xInicio + 98, $yInicio + $alturaMax); // borde derecho
        }
        if ($alturaTransp < $alturaMax) {
            $this->Line($xInicio + 100, $yInicio + $alturaMax, $xInicio + 198, $yInicio + $alturaMax); // línea inferior
            $this->Line($xInicio + 198, $yInicio, $xInicio + 198, $yInicio + $alturaMax); // borde derecho
        }

        // --- Mover cursor a la siguiente línea ---
        $this->SetY($yInicio + $alturaMax);

        $this->Ln(5);

        // Bloque para shipper y comments CON COMENTARIOS
        $this->SetFont('Arial', 'B', 9);
        $this->Cell(98, 3, '', 'LTR', 0,  'L');
        $this->Cell(2, 3, '', 0, 0,  'L');
        $this->Cell(98, 3, '', 'LTR', 1,  'L');
        $this->Cell(98, 3, 'SHIPPER:', 'LR', 0,  'L');
        $this->Cell(2, 3, '', 0, 0,  'L');
        $this->Cell(98, 3, 'COMMENTS:', 'LR', 1,  'L');
        $this->Cell(98, 3, '', 'LR', 0,  'L');
        $this->Cell(2, 3, '', 0, 0,  'L');
        $this->Cell(98, 3, '', 'LR', 1,  'L');
        $this->Cell(98, 3, 'BUF CREAMERY LLC', 'LR', 0,  'L');
        $this->Cell(2, 3, '', 0, 0,  'L');
        $this->Cell(98, 3, '', 'LR', 1,  'L');
        $this->SetFont('Arial', '', 8);
        $this->Cell(98, 3, 'PO BOX 506 ', 'LR', 0,  'L');
        $this->Cell(2, 3, '', 0, 0,  'L');
        $this->Cell(98, 3, '', 'LR', 1,  'L');
        $this->Cell(98, 3, 'Charlottesvile VA, 22902', 'LR', 0,  'L');
        $this->Cell(2, 3, '', 0, 0,  'L');

        // 👇 NUEVO: Mostrar comentarios si están seleccionados
        $comentariosParaMostrar = [];

        // Verificar si debe mostrar comentario primario
        if ($comentarioPrimarioSeleccionado == 1 && !empty($textoComentarioPrimario)) {
            $comentariosParaMostrar[] = $textoComentarioPrimario;
        }

        // Verificar si debe mostrar comentario secundario
        if ($comentarioSecundarioSeleccionado == 1 && !empty($textoComentarioSecundario)) {
            $comentariosParaMostrar[] = $textoComentarioSecundario;
        }

        // Si hay comentarios para mostrar
        if (!empty($comentariosParaMostrar)) {
            $comentariosTexto = implode("\n", $comentariosParaMostrar);
            $this->MultiCell(98, 3, utf8_decode($comentariosTexto), 'LR', 'L');
        } else {
            $this->Cell(98, 3, '', 'LR', 1,  'L');
        }

        $this->Cell(98, 3, '(434) 434-0034', 'LRB', 0,  'L');
        $this->Cell(2, 3, '', 0, 0,  'L');
        $this->Cell(98, 3, '', 'LRB', 1,  'L');

        // Fin bloque para shipper y comments

        $this->Ln(5);

        $this->SetFont('Arial', 'B', 9);
        $this->Cell(140, 5, '', 0, 0,  'L');
        $this->Cell(38, 5, 'Purchase Order#:', 'LT', 0,  'R');
        $this->Cell(20, 5, $purchaseOrder, 'TR', 1,  'L');
        $this->Cell(140, 5, '', 0, 0,  'L');
        $this->Cell(38, 5, 'Date Enroute:', 'L', 0,  'R');
        $this->Cell(20, 5, $fechaEnrouteFormateada, 'R', 1,  'L');
        $this->Cell(140, 5, '', 0, 0,  'L');
        $this->Cell(38, 5, 'Date of Delivery:', 'LB', 0,  'R');
        $this->Cell(20, 5, $fechaDeliveryFormateada, 'BR', 1,  'L');

        $this->Ln(5);

        // DETALLE DEL PEDIDO
        // Encabezado de la tabla de detalle
        $this->SetFont('Arial', 'B', 7);
        $this->Cell(30, 6, 'Producer', 1, 0, 'C');
        $this->Cell(115, 6, 'Product', 1, 0, 'C');
        $this->Cell(19, 6, 'Box Size', 1, 0, 'C');
        $this->Cell(19, 6, 'Cubes', 1, 0, 'C');
        $this->Cell(15, 6, 'Pieces', 1, 0, 'C');
        $this->Ln();

        // Detalle de productos
        $this->SetFont('Arial', '', 7);
        foreach ($detalles as $detalle) {
            $this->Cell(30, 6, utf8_decode('BUF CREAMERY'), 1);
            $this->Cell(115, 6, utf8_decode($detalle['descrip_pedido']), 1);
            $this->Cell(19, 6, utf8_decode($detalle['box_size']), 1, 0, 'C');
            $this->Cell(19, 6, utf8_decode($detalle['cubes']), 1, 0, 'C');
            $this->Cell(15, 6, number_format($detalle['cajas'], 0), 1, 0, 'R');
            $this->Ln();
        }

        // TOTALES
        $this->SetFont('Arial', 'B', 9);
        $this->Cell(164, 6, 'Total:', 1, 0, 'R');
        $this->Cell(19, 6, number_format($totalCubes, 3), 1, 0, 'R');
        $this->Cell(15, 6, number_format($totalCajas, 0), 1, 1, 'R');

        $this->Cell(183, 6, 'Total Stowage:', 1, 0, 'R');
        $this->Cell(15, 6, number_format($cantidadEstibas, 2), 1, 1, 'R');
        $this->Ln(8);

        // OBSERVACIONES
        if (!empty($observaciones)) {
            $this->SetFont('Arial', 'B', 9);
            $this->Cell(30, 6, 'Observaciones: ', 0, 0, 'L');
            $this->SetFont('Arial', '', 9);
            $this->MultiCell(188, 6, utf8_decode($observaciones), 0, 1);
        }

        $this->Ln(8);

        $this->Cell(49, 15, 'Recived by:', 1, 0, 'L');
        $this->Cell(1, 15, '', 0, 0, 'L');
        $this->Cell(49, 15, 'Initials:', 1, 0, 'L');
        $this->Cell(1, 15, '', 0, 0, 'L');
        $this->Cell(49, 15, 'Temperature:', 1, 0, 'L');
        $this->Cell(1, 15, '', 0, 0, 'L');
        $this->Cell(49, 15, 'Driver:', 1, 0, 'L');

        $this->Ln(3);

        return true;
    }
}

// Crear PDF
$pdf = new PDF('P', 'mm', array(216, 279));
$pdf->SetMargins(10, 10, 10);
$pdf->AliasNbPages();
$pdf->AddPage();

// Agregar cada BOL al PDF
$pedidosProcesados = 0;
foreach ($pedidosIds as $idPedido) {
    if ($pdf->agregarBOL($idPedido, $enlace)) {
        $pedidosProcesados++;
    }
}

if ($pedidosProcesados === 0) {
    die(json_encode(["error" => "No se pudieron procesar los BOLs"]));
}

// Generar nombre del archivo
$nombreArchivo = 'bol_multiple_' . date('Y-m-d') . '.pdf';

// Enviar PDF
$pdf->Output('I', $nombreArchivo);
?>