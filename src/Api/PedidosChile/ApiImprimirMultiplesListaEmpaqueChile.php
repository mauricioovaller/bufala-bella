<?php
//src/Api/PedidosChile/ApiImprimirMultiplesListaEmpaque.php
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
if (!isset($input['tipoDocumento'])) {
    die(json_encode(["error" => "Filtro requerido: tipoDocumento"]));
}

// 👇 NUEVO: Obtener modo
$modo = $input['modo'] ?? 'porFechas'; // 'porFechas' o 'porNumeros'
$bodegaId = $input['bodegaId'] ?? '';
$tipoDocumento = $input['tipoDocumento'];

// 👇 MODIFICADO: Consultar pedidos según el MODO
if ($modo === 'porFechas') {
    // Modo por fechas (comportamiento original)
    if (!isset($input['fechaDesde']) || !isset($input['fechaHasta'])) {
        die(json_encode(["error" => "Para modo por fechas se requieren: fechaDesde, fechaHasta"]));
    }
    
    $fechaDesde = $input['fechaDesde'];
    $fechaHasta = $input['fechaHasta'];
    
    $sqlPedidos = "SELECT ep.Id_EncabPedidoChile 
                   FROM EncabPedidoChile ep
                   WHERE (ep.FechaSalida BETWEEN ? AND ?) AND ep.Estado = 'Activo'";
                   
    $params = [$fechaDesde, $fechaHasta];
    $types = "ss";
    
} else if ($modo === 'porNumeros') {
    // Modo por números (NUEVO)
    if (!isset($input['numeroDesde']) || !isset($input['numeroHasta'])) {
        die(json_encode(["error" => "Para modo por números se requieren: numeroDesde, numeroHasta"]));
    }
    
    $numeroDesde = intval($input['numeroDesde']);
    $numeroHasta = intval($input['numeroHasta']);
    
    $sqlPedidos = "SELECT ep.Id_EncabPedidoChile 
                   FROM EncabPedidoChile ep
                   WHERE (ep.Id_EncabPedidoChile BETWEEN ? AND ?) AND ep.Estado = 'Activo'";
                   
    $params = [$numeroDesde, $numeroHasta];
    $types = "ii";
    
} else {
    die(json_encode(["error" => "Modo no válido. Use 'porFechas' o 'porNumeros'"]));
}

// 👇 MANTENER: Filtro por bodega (común para ambos modos)
if (!empty($bodegaId)) {
    $sqlPedidos .= " AND ep.Id_Bodega = ?";
    $params[] = $bodegaId;
    $types .= "i";
}

$sqlPedidos .= " ORDER BY ep.FechaSalida, ep.Id_EncabPedidoChile";

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

function u8($t) {
    if ($t === null || $t === '') return '';
    // Si ya viene en ISO-8859-1 (no es UTF-8 válido), se usa tal cual para no duplicar acentos
    if (@preg_match('//u', $t) !== 1) return $t;
    $conv = @iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $t);
    return $conv !== false ? $conv : $t;
}
function fmtDate($d) { return $d ? date('d/m/Y', strtotime($d)) : ''; }

// ======================
// CLASE PDF PARA MÚLTIPLES LISTAS DE EMPAQUE
// ======================
class PDF extends FPDF
{
    private $pedidoCount = 0;
    
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
        $this->Cell(17, 5, $this->PageNo() . ' de {nb}', 1, 0, 'C');
        $this->Cell(17, 5, utf8_decode('R-EXP-002'), 1, 1, 'C');

        $this->Cell(81, 5, '', 'LR', 0,  'C');
        $this->Cell(147, 5, utf8_decode('SOLICITUD DE PRODUCCIÓN / LISTA DE EMPAQUE PRODUCTO EXPORTACIÓN CHILE'), 'LR', 0,  'C');
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
    
    function dibujarFilaConAlturaVariable($etiqueta, $texto, $oc)
    {
        // Configuración
        $ancho_etiqueta = 35;
        $ancho_texto = 191;
        $ancho_oc = 36;
        $altura_linea = 6;

        // Guardar posición inicial
        $x_inicial = $this->GetX();
        $y_inicial = $this->GetY();

        // Calcular altura necesaria
        $texto_utf8 = utf8_decode($texto);
        $ancho_texto_calculado = $ancho_texto - 2; // Margen interno
        $num_lineas = max(1, ceil($this->GetStringWidth($texto_utf8) / $ancho_texto_calculado));
        $altura_total = $num_lineas * $altura_linea;

        // Dibujar etiqueta
        $this->SetFont('Arial', 'B', 8);
        $this->Cell($ancho_etiqueta, $altura_total, $etiqueta, 1, 0, 'L');

        // Dibujar texto con MultiCell
        $this->SetFont('Arial', '', 8);
        $this->MultiCell($ancho_texto, $altura_linea, $texto_utf8, 1, 'L');

        // Calcular nueva posición Y después del MultiCell
        $nuevo_y = $this->GetY();

        // Dibujar O.C. alineada con la fila completa
        $this->SetXY($x_inicial + $ancho_etiqueta + $ancho_texto, $y_inicial);
        $this->Cell($ancho_oc, $altura_total, 'O.C.' . $oc, 1, 0, 'L');

        // Mover a la siguiente línea
        $this->SetY($nuevo_y);
    }
    
    function agregarListaEmpaque($idPedido, $enlace) {
        $this->pedidoCount++;
        
        // Agregar nueva página para cada pedido después del primero
        if ($this->pedidoCount > 1) {
            $this->AddPage();
        }

        // Primero estableces el idioma para la sesión
        $enlace->query("SET lc_time_names = 'es_ES'");
        
        // Consultar datos del encabezado del pedido
        $sqlEncabezado = "SELECT 
                            enc.Id_EncabPedido AS NoListaEmpaque,
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
                            CONCAT(cli.Nombre) AS Destino_ClienteFinal,
                            enc.PurchaseOrder,
                            enc.CantidadEstibas,
                            enc.Observaciones
                          FROM EncabPedidoChile enc
                          INNER JOIN ClientesChile cli ON enc.Id_Cliente = cli.Id_Cliente
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
            $destinoClienteFinal,
            $purchaseOrder,
            $cantidadEstibas,
            $observaciones
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
                        prod.Codigo_CUST,
                        emb.Descripcion AS DescripEmbalaje,
                        emb.Cantidad AS CantidadEmbalaje,
                        COALESCE(l.CodigoLote, '') AS LoteCodigo,
                        COALESCE(det.FechaElaboracion, '') AS FechaElaboracion,
                        COALESCE(det.FechaVencimiento, '') AS FechaVencimiento,
                        det.Cantidad AS Cajas,
                        emb.Cantidad AS CantidadPorEmbalaje,
                        (det.Cantidad * emb.Cantidad) AS TotalEmbalajes,
                        (prod.PesoGr / 1000) AS PesoUnd,
                        (emb.Cantidad * prod.PesoGr / 1000) AS PesoCaja,
                        (det.PesoNeto) AS PesoNetoKg,
                        (det.PesoBruto) AS PesoBrutoKg
                       FROM DetPedidoChile det
                       INNER JOIN ProductosChile prod ON det.Id_Producto = prod.Id_Producto
                       INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
                       LEFT JOIN Lotes l ON det.Lote1 = l.Id_Lote
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
            $codigoCUST,
            $descripEmbalaje,
            $cantidadEmbalaje,
            $loteCodigo,
            $fechaElaboracion,
            $fechaVencimiento,
            $cajas,
            $cantidadPorEmbalaje,
            $totalEmbalajes,
            $pesoUnd,
            $pesoCaja,
            $pesoNetoKg,
            $pesoBrutoKg
        );

        // Calcular totales
        $totalCajas = 0;
        $totalTotalEmbalajes = 0;
        $totalPesoNeto = 0;
        $totalPesoBruto = 0;

        $detalles = [];
        while ($stmtDetalle->fetch()) {
            $detalles[] = [
                'codigo_siesa' => $codigoSiesa,
                'codigo_cust' => $codigoCUST,
                'descrip_factura' => $descripFactura,
                'descrip_producto' => $descripProducto,
                'lote_codigo' => $loteCodigo,
                'fecha_elaboracion' => $fechaElaboracion,
                'fecha_vencimiento' => $fechaVencimiento,
                'cajas' => $cajas,
                'cantidad_por_embalaje' => $cantidadPorEmbalaje,
                'total_embalajes' => $totalEmbalajes,
                'peso_und' => $pesoUnd,
                'peso_caja' => $pesoCaja,
                'peso_netoKg' => $pesoNetoKg,
                'peso_brutoKg' => $pesoBrutoKg,
            ];

            $totalCajas += $cajas;
            $totalTotalEmbalajes += $totalEmbalajes;
            $totalPesoNeto += $pesoNetoKg;
            $totalPesoBruto += $pesoBrutoKg;
        }
        $stmtDetalle->close();

        // ENCABEZADO DEL PEDIDO
        $this->SetFont('Arial', 'B', 8);
        $this->Cell(51, 6, 'Lista Empaque Orden BUF No. ', 1, 0, 'L');
        $this->SetFont('Arial', '', 8);
        $this->Cell(36, 6, $noListaEmpaque, 1, 0, 'L');
        $this->SetFont('Arial', 'B', 8);
        $this->Cell(59, 6, utf8_decode('Fecha Recepción Orden'), 1, 0, 'L');
        $this->SetFont('Arial', '', 8);
        $this->Cell(116, 6, u8($fechaOrden), 1, 1, 'C');

        $this->SetFont('Arial', '', 8);
        $this->Cell(51, 6, 'AWB No.' . $noGuia, 1, 0, 'L');
        $this->Cell(36, 6, 'FEX-', 1, 0, 'L');
        $this->Cell(88, 6, 'Agencia Carga: ' . $agenciaCarga, 1, 0, 'L');
        $this->Cell(87, 6, 'Aerolinea: ' . $aerolinea, 1, 1, 'L');

        // Llamar la función reemplazando tu código original
        $this->dibujarFilaConAlturaVariable('Destino / Cliente Final ', $destinoClienteFinal, $purchaseOrder);

        $this->SetFont('Arial', 'B', 8);
        $this->Cell(86, 6, 'Fecha Solicitud Inicial Entrega Aeropuerto El Dorado (BOG) ', 'LTB', 0, 'L');
        $this->Cell(50, 6, u8($fechaSalida), 'TBR', 0, 'L');
        $this->Cell(47, 6, 'Fecha Final Entrega Cliente: ', 'LTB', 0, 'L');
        $this->Cell(49, 6, u8($fechaEntregaCliente), 'TBR', 0, 'L');
        $this->Cell(30, 6, 'Cant Estibas: ' . $cantidadEstibas, 1, 1, 'L');

        $this->Ln(3);

        // DETALLE DEL PEDIDO

        // Encabezado de la tabla de detalle (multilínea)
        $this->SetFont('Arial', 'B', 6);
        $startY = $this->GetY();
        $startX = $this->GetX();
        $maxHeight = 0;

        $cols = [
            [12, "Cód.\nCUST"],
            [12, "Cód.\nSIESA"],
            [40, u8("Referencia")],
            [54, u8("Presentación")],
            [14, "Lote"],
            [14, "F.\nElab."],
            [14, "F.\nVenc."],
            [12, "Cant.\nCajas"],
            [12, "TM X\nCaja"],
            [12, "Total\nTM"],
            [17, u8("Peso Esc.\nX Und")],
            [15, "Peso X\nCaja"],
            [15, u8("Kg\nEscurr.")],
            [17, "Kg\nBrutos"],
        ];

        foreach ($cols as $col) {
            list($w, $text) = $col;
            $x = $this->GetX();
            $y = $this->GetY();
            $this->MultiCell($w, 3.5, $text, 1, 'C');
            $height = $this->GetY() - $y;
            if ($height > $maxHeight) $maxHeight = $height;
            $this->SetXY($x + $w, $y);
        }
        $this->SetY($startY + $maxHeight);

        // Detalle de productos con altura de fila variable
        $anchos = [12, 12, 40, 54, 14, 14, 14, 12, 12, 12, 17, 15, 15, 17];
        $idxRef = 2;
        $idxPres = 3;

        foreach ($detalles as $detalle) {
            $y0 = $this->GetY();
            $x0 = $this->GetX();
            
            $txtRef = u8($detalle['descrip_factura']);
            $txtPres = u8($detalle['descrip_producto']);
            $lineasRef = max(1, ceil($this->GetStringWidth($txtRef) / ($anchos[$idxRef] - 1)));
            $lineasPres = max(1, ceil($this->GetStringWidth($txtPres) / ($anchos[$idxPres] - 1)));
            $altoFila = max(5, max($lineasRef, $lineasPres) * 3);
            
            $vals = [
                u8($detalle['codigo_cust']), u8($detalle['codigo_siesa']),
                '', '',
                u8($detalle['lote_codigo']),
                fmtDate($detalle['fecha_elaboracion']),
                fmtDate($detalle['fecha_vencimiento']),
                number_format($detalle['cajas'], 0),
                number_format($detalle['cantidad_por_embalaje'], 0),
                number_format($detalle['total_embalajes'], 0),
                number_format($detalle['peso_und'], 2),
                number_format($detalle['peso_caja'], 2),
                number_format($detalle['peso_netoKg'], 2),
                number_format($detalle['peso_brutoKg'], 2),
            ];
            
            $cx = $x0;
            foreach ($anchos as $i => $w) {
                $this->Rect($cx, $y0, $w, $altoFila);
                if ($i === $idxRef) {
                    $this->SetXY($cx + 0.5, $y0 + 0.2);
                    $this->SetFont('Arial', '', 5.5);
                    $this->MultiCell($w - 1, 2.8, $txtRef, 0, 'L');
                } elseif ($i === $idxPres) {
                    $this->SetXY($cx + 0.5, $y0 + 0.2);
                    $this->SetFont('Arial', '', 5.5);
                    $this->MultiCell($w - 1, 2.8, $txtPres, 0, 'L');
                } else {
                    $this->SetFont('Arial', '', 6);
                    $align = ($i >= 7) ? 'R' : 'L';
                    $this->SetXY($cx, $y0 + ($altoFila - 5) / 2);
                    $this->Cell($w, 5, $vals[$i], 0, 0, $align);
                }
                $cx += $w;
            }
            $this->SetY($y0 + $altoFila);
        }

        // TOTALES
        $anchoTotales = 12+12+40+54+14+14+14+12+12+12; // 196mm
        $this->SetFont('Arial', 'B', 8);
        $this->Cell($anchoTotales, 6, u8('TOTALES:'), 1);
        $this->Cell(17, 6, '', 1, 0, 'R');
        $this->Cell(15, 6, '', 1, 0, 'R');
        $this->Cell(15, 6, number_format($totalPesoNeto, 2), 1, 0, 'R');
        $this->Cell(17, 6, number_format($totalPesoBruto, 2), 1, 0, 'R');
        $this->Ln();

        $this->Ln(3);
        // OBSERVACIONES
        if (!empty($observaciones)) {
            $this->SetFont('Arial', 'B', 9);
            $this->Cell(30, 6, 'Observaciones: ', 0, 0, 'L');
            $this->SetFont('Arial', '', 9);
            $this->MultiCell(188, 6, utf8_decode($observaciones), 0, 1);
        }

        // COLUMNA DE TOTALES: Peso Escurrido, Peso Bruto y Estibas
        $this->Ln(3);
        $this->SetFont('Arial', 'B', 7);
        $anchoEtiquetaTotal = 50;
        $anchoValorTotal = 22;
        $anchoBloqueTotal = $anchoEtiquetaTotal + $anchoValorTotal;
        $altoFilaTotal = 6;

        $this->Cell(262 - $anchoBloqueTotal, $altoFilaTotal, '', 0, 0);
        $this->Cell($anchoEtiquetaTotal, $altoFilaTotal, u8('Total Peso Escurrido (kg)'), 1, 0, 'L');
        $this->Cell($anchoValorTotal, $altoFilaTotal, number_format($totalPesoNeto, 2), 1, 1, 'R');

        $this->Cell(262 - $anchoBloqueTotal, $altoFilaTotal, '', 0, 0);
        $this->Cell($anchoEtiquetaTotal, $altoFilaTotal, u8('Total Peso Bruto (kg)'), 1, 0, 'L');
        $this->Cell($anchoValorTotal, $altoFilaTotal, number_format($totalPesoBruto, 2), 1, 1, 'R');

        $this->Cell(262 - $anchoBloqueTotal, $altoFilaTotal, '', 0, 0);
        $this->Cell($anchoEtiquetaTotal, $altoFilaTotal, u8('Total Estibas'), 1, 0, 'L');
        $this->Cell($anchoValorTotal, $altoFilaTotal, number_format($cantidadEstibas, 0), 1, 1, 'R');

        $this->Ln(8);
        $this->SetFont('Arial', 'B', 8);
        $this->Cell(160, 6, '', 0, 0);
        $this->Cell(51, 6, 'RECIBIDO Y APROBADO POR:', 0, 0);
        $this->Cell(51, 6, '', 'B', 1);
        $this->SetFont('Arial', 'B', 8);
        $this->Cell(211, 6, '', 0, 0);
        $this->Cell(51, 6, 'Supervisor de Cto. Frio', 0, 1, 'C');
        $this->Cell(160, 6, '', 0, 0);
        $this->Cell(51, 6, 'Fecha Minima de Vencimiento Aceptada: ' . utf8_decode($fechaVencimiento), 0, 1, 'L');

        return true;
    }
}

// Crear PDF
$pdf = new PDF('L', 'mm', array(216, 279));
$pdf->SetMargins(10, 10, 10);
$pdf->AliasNbPages();
$pdf->AddPage();

// Agregar cada lista de empaque al PDF
$pedidosProcesados = 0;
foreach ($pedidosIds as $idPedido) {
    if ($pdf->agregarListaEmpaque($idPedido, $enlace)) {
        $pedidosProcesados++;
    }
}

if ($pedidosProcesados === 0) {
    die(json_encode(["error" => "No se pudieron procesar las listas de empaque"]));
}

// Generar nombre del archivo
$nombreArchivo = 'listaempaque_multiple_' . date('Y-m-d') . '.pdf';

// Enviar PDF
$pdf->Output('I', $nombreArchivo);
?>
