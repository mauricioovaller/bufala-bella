<?php
//src/Api/PedidosChile/ApiImprimirListaEmpaque.php
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
                    enc.FechaDelivery,
                    DATE_FORMAT(enc.FechaDelivery, '%W, %e de %M de %Y') AS FechaEntregaCliente,
                    DATE_FORMAT(DATE_ADD(enc.FechaIngreso, INTERVAL 30 DAY), '%W, %e de %M de %Y') AS FechaVencimiento,
                    enc.GuiaMaster AS NoGuia,
                    enc.FacturaNo AS FEX,
                    COALESCE(age.NOMAGENCIA, '') AS AgenciaCarga,
                    COALESCE(aer.NOMAEROLINEA, '') AS Aerolinea,
                    CONCAT(cli.Nombre, ' - ', cli.Direccion) AS Destino_ClienteFinal,
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
    die(json_encode(["error" => "Pedido no encontrado."]));
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
                REPLACE(COALESCE(l.CodigoLote, ''), '-','') AS LoteCodigo,
                COALESCE(det.FechaElaboracion, '') AS FechaElaboracion,
                COALESCE(det.FechaVencimiento, '') AS FechaVencimiento,
                det.Cantidad AS Cajas,
                emb.Cantidad AS CantidadPorEmbalaje,
                (det.Cantidad * emb.Cantidad) AS TotalEmbalajes,
                (prod.PesoGr / 1000) AS PesoUnd,
                prod.PesoNetoUndGr AS PesoNetoUndGr,
                (prod.PesoNetoUndGr * (det.Cantidad * emb.Cantidad) / 1000) AS PesoNetoTotal,
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
    $pesoNetoUndGr,
    $pesoNetoTotal,
    $pesoCaja,
    $pesoNetoKg,
    $pesoBrutoKg
);

// Calcular totales
$totalCajas = 0;
$totalTotalEmbalajes = 0;
$totalPesoNeto = 0;
$totalPesoNetoTotal = 0;
$totalPesoBruto = 0;
$totalValor = 0;

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
        'peso_neto_und_gr' => $pesoNetoUndGr,
        'peso_neto_total' => $pesoNetoTotal,
        'peso_caja' => $pesoCaja,
        'peso_netoKg' => $pesoNetoKg,
        'peso_brutoKg' => $pesoBrutoKg,
    ];

    $totalCajas += $cajas;
    $totalTotalEmbalajes += $totalEmbalajes;
    $totalPesoNeto += $pesoNetoKg;
    $totalPesoNetoTotal += $pesoNetoTotal;
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
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalabella.jpg", 12, 15, 65);
        $this->SetFont('Arial', 'B', 8);
        $this->Cell(75, 5, '', 'LTR', 0,  'C');
        $this->Cell(127, 5, 'SIC - SISTEMA INTEGRADO DE CALIDAD', 'LTR', 0,  'C');
        $this->Cell(34, 5, 'EXPORTACIONES', 'LTR', 1, 'C');

        $this->Cell(75, 5, '', 'LR', 0,  'C');
        $this->Cell(127, 5, '', 'LRB', 0,  'C');
        $this->Cell(19, 5, u8('Página'), 1, 0, 'C');
        $this->Cell(15, 5, u8('Código'), 1, 1, 'C');

        $this->Cell(75, 5, '', 'LR', 0,  'C');
        $this->Cell(127, 5, '', 'LRT', 0,  'C');
        $this->Cell(19, 5, '1 de 1', 1, 0, 'C');
        $this->Cell(15, 5, 'R-EXP-002', 1, 1, 'C');

        $this->Cell(75, 5, '', 'LR', 0,  'C');
        $this->Cell(127, 5, u8('SOLICITUD DE PRODUCCIÓN / LISTA DE EMPAQUE PRODUCTO EXPORTACIÓN CHILE'), 'LR', 0,  'C');
        $this->Cell(19, 5, u8('Versión'), 1, 0, 'C');
        $this->Cell(15, 5, u8('Fecha'), 1, 1, 'C');

        $this->Cell(75, 5, '', 'LRB', 0,  'C');
        $this->Cell(127, 5, '', 'LRB', 0,  'C');
        $this->Cell(19, 5, '5', 1, 0, 'C');
        $this->Cell(15, 5, '01/02/2024', 1, 1, 'C');

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

// ENCABEZADO DEL PEDIDO (ancho total = 236mm)
$anchoTotalEnc = 236;
$pdf->SetFont('Arial', 'B', 8);
$pdf->Cell(51, 6, 'Lista Empaque No. ', 1, 0, 'L');
$pdf->SetFont('Arial', '', 8);
$pdf->Cell(36, 6, $noListaEmpaque, 1, 0, 'L');
$pdf->SetFont('Arial', 'B', 8);
$pdf->Cell(59, 6, u8('Fecha Recepción Orden'), 1, 0, 'L');
$pdf->SetFont('Arial', '', 8);
$pdf->Cell($anchoTotalEnc - 51 - 36 - 59, 6, u8($fechaOrden), 1, 1, 'C');

$pdf->SetFont('Arial', '', 8);
$pdf->Cell(51, 6, 'AWB No.' . $noGuia, 1, 0, 'L');
$pdf->Cell(36, 6, $fex, 1, 0, 'L');
$pdf->Cell(88, 6, 'Agencia Carga: ' . $agenciaCarga, 1, 0, 'L');
$pdf->Cell($anchoTotalEnc - 51 - 36 - 88, 6, 'Aerolinea: ' . $aerolinea, 1, 1, 'L');

function dibujarFilaConAlturaVariable($pdf, $etiqueta, $texto, $oc)
{
    // Configuración (ancho total = 236)
    $ancho_etiqueta = 35;
    $ancho_texto = 236 - 35 - 36; // 165
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
$pdf->Cell(86, 6, 'Fecha Solicitud Inicial Entrega Aeropuerto El Dorado (BOG) ', 'LTB', 0, 'L');
$pdf->Cell(40, 6, u8($fechaSalida), 'TBR', 0, 'L');
$pdf->Cell(40, 6, 'Fecha Final Entrega: ', 'LTB', 0, 'L');
$pdf->Cell(48, 6, u8($fechaEntregaCliente), 'TBR', 0, 'L');
$pdf->Cell($anchoTotalEnc - 86 - 40 - 40 - 48, 6, 'Cant Estibas: ' . $cantidadEstibas, 1, 1, 'L');

$pdf->Ln(3);

// DETALLE DEL PEDIDO


function u8($t) {
    if ($t === null || $t === '') return '';
    // Si ya viene en ISO-8859-1 (no es UTF-8 válido), se usa tal cual para no duplicar acentos
    if (@preg_match('//u', $t) !== 1) return $t;
    $conv = @iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $t);
    return $conv !== false ? $conv : $t;
}
function fmtDate($d) { return $d ? date('d/m/Y', strtotime($d)) : ''; }

// Encabezado de la tabla de detalle (multilínea)
$pdf->SetFont('Arial', 'B', 6);
$startY = $pdf->GetY();
$maxHeight = 0;

$cols = [
    [12, u8("Cód.\nCUST")],
    [10, u8("Cód.\nSIESA")],
    [38, u8("Referencia \n-")],
    [32, u8("Presentación \n-")],
    [10, u8("Peso N \nUnd")],
    [10, "Lote \n-"],
    [14, "Fecha\nElab."],
    [14, "Fecha\nVenc."],
    [10, "Cant.\nCajas"],
    [10, "Envase\nCaja"],
    [10, "Und\nSolicit"],
    [18, u8("Peso Esc.\nX Und")],
    [12, "Peso\nEsc Caja"],
    [12, u8("Kg\nEscurr.")],
    [12, u8("Peso N\nTotal Kg")],
    [12, "Kg\nBrutos"],
];

foreach ($cols as $col) {
    list($w, $text) = $col;
    $x = $pdf->GetX();
    $y = $pdf->GetY();
    $pdf->MultiCell($w, 3.5, $text, 1, 'C');
    $height = $pdf->GetY() - $y;
    if ($height > $maxHeight) $maxHeight = $height;
    $pdf->SetXY($x + $w, $y);
}
$pdf->SetY($startY + $maxHeight);

// Detalle de productos (anchos = mismos que $cols)
$anchos = [12, 10, 38, 32, 10, 10, 14, 14, 10, 10, 10, 18, 12, 12, 12, 12];
$idxRef = 2;
$idxPres = 3;

foreach ($detalles as $detalle) {
    $y0 = $pdf->GetY();
    $x0 = $pdf->GetX();
    
    $txtRef = u8($detalle['descrip_factura']);
    $txtPres = u8($detalle['descrip_producto']);
    $lineasRef = max(1, ceil($pdf->GetStringWidth($txtRef) / ($anchos[$idxRef] - 1)));
    $lineasPres = max(1, ceil($pdf->GetStringWidth($txtPres) / ($anchos[$idxPres] - 1)));
    $altoFila = max(5, max($lineasRef, $lineasPres) * 3);
    
    $vals = [
        u8($detalle['codigo_cust']), 
        u8($detalle['codigo_siesa']),
        '',
        '',
        number_format($detalle['peso_neto_und_gr'], 0),
        u8($detalle['lote_codigo']),
        fmtDate($detalle['fecha_elaboracion']),
        fmtDate($detalle['fecha_vencimiento']),
        number_format($detalle['cajas'], 0),
        number_format($detalle['cantidad_por_embalaje'], 0),
        number_format($detalle['total_embalajes'], 0),
        number_format($detalle['peso_und'], 3),
        number_format($detalle['peso_caja'], 2),
        number_format($detalle['peso_netoKg'], 2),
        number_format($detalle['peso_neto_total'], 2),
        number_format($detalle['peso_brutoKg'], 2),
    ];
    
    $cx = $x0;
    foreach ($anchos as $i => $w) {
        $pdf->Rect($cx, $y0, $w, $altoFila);
        if ($i === $idxRef) {
            $pdf->SetXY($cx + 0.5, $y0 + 0.2);
            $pdf->SetFont('Arial', '', 5.5);
            $pdf->MultiCell($w - 1, 2.8, $txtRef, 0, 'L');
        } elseif ($i === $idxPres) {
            $pdf->SetXY($cx + 0.5, $y0 + 0.2);
            $pdf->SetFont('Arial', '', 5.5);
            $pdf->MultiCell($w - 1, 2.8, $txtPres, 0, 'L');
        } else {
            $pdf->SetFont('Arial', '', 6);
            $align = ($i >= 7) ? 'R' : 'L';
            $pdf->SetXY($cx, $y0 + ($altoFila - 5) / 2);
            $pdf->Cell($w, 5, $vals[$i], 0, 0, $align);
        }
        $cx += $w;
    }
    $pdf->SetY($y0 + $altoFila);
}

// TOTALES por columna
$pdf->SetFont('Arial', 'B', 7);
$pdf->Cell(12+10+38+32+10+10+14+14,6, u8('TOTALES:'), 1, 0, 'L'); // cols 0-8
$pdf->Cell(10, 6, number_format($totalCajas, 0), 1, 0, 'R'); // col 9 Cant.Cajas
$pdf->Cell(10, 6, '', 1, 0, 'R');   // col 10 TM X Caja
$pdf->Cell(10, 6, number_format($totalTotalEmbalajes, 0), 1, 0, 'R'); // col 11 Total TM
$pdf->Cell(18, 6, '', 1, 0, 'R');   // col 12 Peso Esc X Und
$pdf->Cell(12, 6, '', 1, 0, 'R');   // col 13 Peso X Caja
$pdf->Cell(12, 6, number_format($totalPesoNeto, 2), 1, 0, 'R'); // col 12 Kg Escurr
$pdf->Cell(12, 6, number_format($totalPesoNetoTotal, 2), 1, 0, 'R'); // col 12 Kg Escurr
$pdf->Cell(12, 6, number_format($totalPesoBruto, 2), 1, 0, 'R'); // col 13 Kg Brutos
$pdf->Ln();

$pdf->Ln(3);

// OBSERVACIONES
if (!empty($observaciones)) {
    $pdf->SetFont('Arial', 'B', 9);
    $pdf->Cell(30, 6, 'Observaciones: ', 0, 0, 'L');
    $pdf->SetFont('Arial', '', 9);
    $pdf->MultiCell(180, 6, u8($observaciones), 0, 1);
}

// COLUMNA DE TOTALES: Peso Escurrido, Peso Bruto y Estibas
$pdf->Ln(3);
$pdf->SetFont('Arial', 'B', 7);
$anchoEtiquetaTotal = 50;
$anchoValorTotal = 22;
$anchoBloqueTotal = $anchoEtiquetaTotal + $anchoValorTotal;
$altoFilaTotal = 6;

$pdf->Cell(236 - $anchoBloqueTotal, $altoFilaTotal, '', 0, 0);
$pdf->Cell($anchoEtiquetaTotal, $altoFilaTotal, u8('Total Peso Escurrido (kg)'), 1, 0, 'L');
$pdf->Cell($anchoValorTotal, $altoFilaTotal, number_format($totalPesoNeto, 2), 1, 1, 'R');

$pdf->Cell(236 - $anchoBloqueTotal, $altoFilaTotal, '', 0, 0);
$pdf->Cell($anchoEtiquetaTotal, $altoFilaTotal, u8('Total Peso Bruto (kg)'), 1, 0, 'L');
$pdf->Cell($anchoValorTotal, $altoFilaTotal, number_format($totalPesoBruto, 2), 1, 1, 'R');

$pdf->Cell(236 - $anchoBloqueTotal, $altoFilaTotal, '', 0, 0);
$pdf->Cell($anchoEtiquetaTotal, $altoFilaTotal, u8('Total Estibas'), 1, 0, 'L');
$pdf->Cell($anchoValorTotal, $altoFilaTotal, number_format($cantidadEstibas, 0), 1, 1, 'R');

$pdf->Ln(6);
$pdf->SetFont('Arial', 'B', 8);
$pdf->Cell(236 - 51 - 51, 6, '', 0, 0);
$pdf->Cell(51, 6, 'RECIBIDO Y APROBADO POR:', 0, 0);
$pdf->Cell(51, 6, '', 'B', 1);
$pdf->Cell(236 - 51, 6, '', 0, 0);
$pdf->Cell(51, 6, 'Supervisor de Cto. Frio', 0, 1, 'C');
$pdf->Cell(236 - 180, 6, '', 0, 0);
$pdf->Cell(180, 6, u8('Fecha Minima de Vencimiento Aceptada: ' . fmtDate($fechaVencimiento)), 0, 1, 'L');
$pdf->Ln(8);



$pdf->Output('I', 'Lista Empaque No' . $noListaEmpaque . '.pdf'); // 'I' para mostrar en navegador
