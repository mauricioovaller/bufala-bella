<?php
error_reporting(0);
ini_set('display_errors', 0);

require_once($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/fpdf/fpdf.php");
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["error" => "Método no permitido. Usa POST."]));
}

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['id_factura']) || empty($input['id_factura'])) {
    die(json_encode(["error" => "ID de factura no válido."]));
}

$id_factura = intval($input['id_factura']);
$con_firma = isset($input['con_firma']) ? (bool)$input['con_firma'] : true;
$anexos_ids = isset($input['anexos_ids']) ? $input['anexos_ids'] : null;

function u8($str) {
    return $str === null ? '' : iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $str);
}

// CONSULTA 1: ENCABEZADO DE FACTURA + CLIENTE + FECHA DE INGRESO
$sqlEnc = "SELECT
    enc.Id_EncabInvoice,
    CONCAT('FEX-', enc.Id_EncabInvoice) AS numero_factura,
    DATE_FORMAT(enc.Fecha, '%Y/%m/%d') AS fecha,
    COALESCE(DATE_FORMAT(MIN(epc.FechaIngreso), '%Y/%m/%d'), DATE_FORMAT(enc.Fecha, '%Y/%m/%d')) AS fecha_ingreso,
    cli.Nombre AS cliente_nombre,
    cli.Rut,
    cli.Direccion,
    cli.Ciudad,
    cli.Pais,
    cli.Telefono,
    cli.Email
FROM EncabInvoiceChile enc
INNER JOIN ClientesChile cli ON enc.Id_Cliente = cli.Id_Cliente
LEFT JOIN EncabPedidoChile epc ON epc.FacturaNo = CONCAT('FEX-', enc.Id_EncabInvoice) OR epc.FacturaNo = CONCAT('CHI-FEX-', enc.Id_EncabInvoice)
WHERE enc.Id_EncabInvoice = ?
GROUP BY enc.Id_EncabInvoice";

$stmtEnc = $enlace->prepare($sqlEnc);
$stmtEnc->bind_param("i", $id_factura);
$stmtEnc->execute();
$stmtEnc->bind_result($id_factura, $numero_factura, $fecha, $fecha_ingreso, $cliente_nombre, $rut, $direccion, $ciudad, $pais, $telefono, $email);

if (!$stmtEnc->fetch()) {
    die(json_encode(["error" => "Factura Chile no encontrada."]));
}
$stmtEnc->close();

// CONSULTA 2: DETALLE DE PRODUCTOS (nombres, cantidades, pesos)
$sqlDet = "SELECT
    det.DescripFactura,
    prd.DescripProducto,
    det.CantidadEmbalaje AS unidades,
    det.CantidadEmbalaje * prd.PesoNetoUndGr / 1000 AS kilogramos,
    det.Cajas,
    emb.Cantidad AS emb_factor,
    prd.PesoGr,
    prd.Codigo_Siesa
FROM DetInvoiceChile det
INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
INNER JOIN ProductosChile prd ON det.Codigo_Siesa = prd.Codigo_Siesa
WHERE det.Id_EncabInvoice = ?
ORDER BY det.Item";

$stmtDet = $enlace->prepare($sqlDet);
$stmtDet->bind_param("i", $id_factura);
$stmtDet->execute();
$stmtDet->bind_result($descripFactura, $descripProducto, $unidades, $kilogramos, $cajas, $embFactor, $pesoGr, $codigoSiesa);

$productos = [];
$total_unidades = 0;
$total_peso_neto = 0;
$total_peso_escurrido = 0;
$productos_nombres = [];

while ($stmtDet->fetch()) {
    $pesoEsc = $cajas * $embFactor * ($pesoGr / 1000);
    $nombreCompleto = trim($descripFactura) . ' - ' . trim($descripProducto);
    $productos[] = [
        'nombre' => $nombreCompleto,
        'unidades' => $unidades,
        'kg' => $kilogramos,
        'peso_esc' => $pesoEsc,
    ];
    $total_unidades += $unidades;
    $total_peso_neto += $kilogramos;
    $total_peso_escurrido += $pesoEsc;
    $productos_nombres[] = $nombreCompleto;
}
$stmtDet->close();

// CONSULTA 3: LOTES DESDE DetPedidoChile con JOIN a Lotes y Embalajes
$sqlLotes = "SELECT REPLACE(COALESCE(l.CodigoLote, d.Lote1), '-', '') AS LoteCodigo,
       d.FechaElaboracion,
       d.FechaVencimiento,
       (d.Cantidad * emb.Cantidad) AS CantidadEmbalaje
FROM DetPedidoChile d
INNER JOIN EncabPedidoChile e ON d.Id_EncabPedido = e.Id_EncabPedido
INNER JOIN Embalajes emb ON d.Id_Embalaje = emb.Id_Embalaje
LEFT JOIN Lotes l ON d.Lote1 = l.Id_Lote
WHERE (e.FacturaNo = CONCAT('FEX-', ?) OR e.FacturaNo = CONCAT('CHI-FEX-', ?)) AND d.Lote1 IS NOT NULL
ORDER BY d.Id_DetPedido";

$stmtLotes = $enlace->prepare($sqlLotes);
$stmtLotes->bind_param("ii", $id_factura, $id_factura);
$stmtLotes->execute();
$stmtLotes->bind_result($loteCodigo, $fechaElab, $fechaVenc, $cantLote);

$lotesInfo = [];
while ($stmtLotes->fetch()) {
    $lotesInfo[] = [
        'lote' => $loteCodigo,
        'fecha_elab' => $fechaElab,
        'fecha_venc' => $fechaVenc,
        'cantidad' => $cantLote,
    ];
}
$stmtLotes->close();

// Construir productos_str
$productos_str = implode("\n", $productos_nombres);

class PDF_AutoDecl extends FPDF
{
    function Header()
    {
        // Barra de título corporativa
        $this->SetFillColor(33, 74, 127);
        $this->Rect(0, 0, 216, 13, 'F');
        $this->SetTextColor(255, 255, 255);
        $this->SetFont('Helvetica', 'B', 9);
        $this->SetY(3);
        $this->Cell(0, 7, u8('AUTODECLARACIÓN PARA EXPORTACIÓN DE LECHE Y PRODUCTOS LÁCTEOS CON DESTINO A CHILE'), 0, 1, 'C');
        $this->SetTextColor(0, 0, 0);
        $this->Ln(5);
    }

    function Footer()
    {
        $this->SetY(-12);
        $this->SetDrawColor(33, 74, 127);
        $this->SetLineWidth(0.3);
        $this->Line(12, $this->GetY(), 204, $this->GetY());
        $this->SetLineWidth(0.2);
        $this->SetDrawColor(0);
        $this->SetFont('Helvetica', 'I', 6);
        $this->SetTextColor(100, 100, 100);
        $this->Cell(0, 8, u8('Bufalabella S.A.S. — Documento generado ' . date('d/m/Y')), 0, 0, 'C');
        $this->SetTextColor(0, 0, 0);
    }
}

$pdf = new PDF_AutoDecl('P', 'mm', array(216, 330));
$pdf->SetMargins(12, 8, 12);
$pdf->AliasNbPages();
$pdf->SetAutoPageBreak(true, 22);

$pdf->AddPage();

// ============================================================
// FUNCIÓN PARA DIBUJAR FILA CON DOS COLUMNAS (ESTILO CUADRÍCULA)
// ============================================================
function drawRow($pdf, $campo, $detalle, $campo_w = 55, $num = '')
{
    $page_w = 190;
    $det_w = $page_w - $campo_w - 2;
    $lh = 3.5;
    $x0 = $pdf->GetX();
    $y0 = $pdf->GetY();

    $label = $num ? "{$num}. {$campo}" : $campo;

    // Estimar altura total antes de dibujar
    $pdf->SetFont('Helvetica', 'B', 7);
    $cw = $pdf->GetStringWidth(u8($label));
    $campo_lines = max(1, ceil($cw / ($campo_w - 2)));
    $campo_h = $campo_lines * $lh + 1;

    $pdf->SetFont('Helvetica', '', 7);
    $dw = $pdf->GetStringWidth(u8($detalle));
    $det_lines = max(1, ceil($dw / $det_w));
    $det_h = $det_lines * $lh + 1;

    $est_h = max($campo_h, $det_h);

    // Page break si no cabe completo
    if ($y0 + $est_h + 2 > 308) {
        $pdf->AddPage();
        $x0 = $pdf->GetX();
        $y0 = $pdf->GetY();
    }

    // 1. Colocar texto Campo
    $pdf->SetFont('Helvetica', 'B', 7);
    $pdf->SetXY($x0 + 1, $y0 + 0.5);
    $pdf->MultiCell($campo_w - 2, $lh, u8($label), 0, 'L');
    $y1 = $pdf->GetY();

    // 2. Colocar texto Detalle
    $pdf->SetFont('Helvetica', '', 7);
    $pdf->SetXY($x0 + $campo_w + 1, $y0 + 0.5);
    $pdf->MultiCell($det_w, $lh, u8($detalle), 0, 'L');
    $y2 = $pdf->GetY();

    // 3. Dibujar borde exterior de la fila
    $h = max($y1 - $y0, $y2 - $y0) + 0.5;
    $pdf->SetDrawColor(180);
    $pdf->Rect($x0, $y0, $page_w, $h);
    $pdf->SetDrawColor(0);

    // 4. Dibujar línea divisoria vertical
    $pdf->SetDrawColor(180);
    $pdf->Line($x0 + $campo_w, $y0, $x0 + $campo_w, $y0 + $h);
    $pdf->SetDrawColor(0);

    // 5. Mover cursor a la siguiente fila
    $pdf->SetXY($x0, $y0 + $h);
}

// ============================================================
// FUNCIÓN PARA DIBUJAR FILA 9 CON TACHADO (STRIKETHROUGH)
// ============================================================
function drawRowTratamiento($pdf, $campo, $lotesInfo, $campo_w = 55, $num = '')
{
    $page_w = 190;
    $det_w = $page_w - $campo_w - 2;
    $x0 = $pdf->GetX();
    $y0 = $pdf->GetY();
    $lh = 3.5;

    // Estimar altura total antes de dibujar
    $pdf->SetFont('Helvetica', 'B', 7);
    $campo_text = u8($num ? "{$num}. {$campo}" : $campo);
    $cw = $pdf->GetStringWidth($campo_text);
    $campo_lines = max(1, ceil($cw / ($campo_w - 2)));
    $campo_h = $campo_lines * $lh + 1;

    $pdf->SetFont('Helvetica', '', 7);
    $a_intro = $pdf->GetStringWidth(u8('a. Seleccione el tratamiento térmico realizado a la leche con que se elaboran los productos:'));
    $a_1 = $pdf->GetStringWidth(u8('  1. Pasteurización rápida a alta temperatura dos veces consecutivas, o'));
    $a_2 = $pdf->GetStringWidth(u8('  ☑ 2. Pasteurización rápida a alta temperatura combinada con otro tratamiento físico (por ejemplo mantenimiento de un pH de 6 durante, por lo menos, una hora, o calentamiento adicional a 72°C seguido de desecación) o,'));
    $a_3 = $pdf->GetStringWidth(u8('  3. Tratamiento UHT combinado con otro de los tratamientos físicos descritos en el presente acápite'));
    $anexo_lote = (isset($lotesInfo[0]) && $lotesInfo[0]['lote']) ? "por lote {$lotesInfo[0]['lote']}" : "";
    $b_text = u8("b. El fabricante debe emitir el certificado de tratamiento térmico, con fecha, nombre y firma del responsable del proceso. Anexo 1. Certificado tratamiento térmico {$anexo_lote}");
    $b_w = $pdf->GetStringWidth($b_text);

    $det_lines = ceil($a_intro / $det_w) + ceil($a_1 / $det_w) + ceil($a_2 / $det_w) + ceil($a_3 / $det_w) + ceil($b_w / $det_w);
    $det_h = $det_lines * $lh + 2;

    $est_h = max($campo_h, $det_h);

    // Page break si no cabe completo
    if ($y0 + $est_h + 2 > 308) {
        $pdf->AddPage();
        $x0 = $pdf->GetX();
        $y0 = $pdf->GetY();
    }

    // 1. Colocar texto Campo
    $pdf->SetFont('Helvetica', 'B', 7);
    $pdf->SetXY($x0 + 1, $y0 + 0.5);
    $pdf->MultiCell($campo_w - 2, $lh, $campo_text, 0, 'L');
    $y_campo = $pdf->GetY();

    // 2. Colocar detalle línea por línea en columna derecha
    $dx = $x0 + $campo_w + 1;
    $dy = $y0 + 0.5;

    // a. Introducción (texto normal)
    $pdf->SetFont('Helvetica', '', 7);
    $pdf->SetXY($dx, $dy);
    $pdf->MultiCell($det_w, $lh, u8('a. Seleccione el tratamiento térmico realizado a la leche con que se elaboran los productos:'), 0, 'L');
    $dy = $pdf->GetY();

    // 1. Tachado
    $pdf->SetFont('Helvetica', '', 7);
    $pdf->SetXY($dx, $dy);
    $y1 = $pdf->GetY();
    $pdf->MultiCell($det_w, $lh, u8('  1. Pasteurización rápida a alta temperatura dos veces consecutivas, o'), 0, 'L');
    $y2 = $pdf->GetY();
    $num_lines1 = max(1, round(($y2 - $y1) / $lh));
    for ($i = 0; $i < $num_lines1; $i++) {
        $pdf->Line($dx, $y1 + $i * $lh + $lh / 2, $x0 + $page_w - 1, $y1 + $i * $lh + $lh / 2);
    }
    $dy = $y2;

    // 2. Texto normal con checkbox
    $pdf->SetFont('Helvetica', '', 7);
    $pdf->SetXY($dx, $dy);
    // Dibujar checkbox pequeño con chulo
    $bx = $dx + 0.2;
    $by = $dy + 1;
    $bs = 1.8;
    $pdf->Rect($bx, $by, $bs, $bs);
    $pdf->Line($bx + 0.3, $by + 0.9, $bx + 0.7, $by + 1.4);
    $pdf->Line($bx + 0.7, $by + 1.4, $bx + 1.5, $by + 0.4);
    $pdf->MultiCell($det_w, $lh, u8('  2. Pasteurización rápida a alta temperatura combinada con otro tratamiento físico (por ejemplo mantenimiento de un pH de 6 durante, por lo menos, una hora, o calentamiento adicional a 72°C seguido de desecación) o,'), 0, 'L');
    $dy = $pdf->GetY();

    // 3. Tachado
    $pdf->SetFont('Helvetica', '', 7);
    $pdf->SetXY($dx, $dy);
    $y3 = $pdf->GetY();
    $pdf->MultiCell($det_w, $lh, u8('  3. Tratamiento UHT combinado con otro de los tratamientos físicos descritos en el presente acápite'), 0, 'L');
    $y4 = $pdf->GetY();
    $num_lines3 = max(1, round(($y4 - $y3) / $lh));
    for ($i = 0; $i < $num_lines3; $i++) {
        $pdf->Line($dx, $y3 + $i * $lh + $lh / 2, $x0 + $page_w - 1, $y3 + $i * $lh + $lh / 2);
    }
    $dy = $y4 + 0.5;

    // b. Texto normal
    $pdf->SetFont('Helvetica', '', 7);
    $pdf->SetXY($dx, $dy);
    $pdf->MultiCell($det_w, $lh, $b_text, 0, 'L');
    $dy = $pdf->GetY();

    // 3. Dibujar borde exterior de la fila
    $h = max($y_campo - $y0, $dy - $y0) + 0.5;
    $pdf->SetDrawColor(180);
    $pdf->Rect($x0, $y0, $page_w, $h);

    // 4. Línea divisoria vertical
    $pdf->Line($x0 + $campo_w, $y0, $x0 + $campo_w, $y0 + $h);
    $pdf->SetDrawColor(0);

    // 5. Mover cursor al final del rectángulo
    $pdf->SetXY($x0, $y0 + $h);
}

// ============================================================
// FUNCIÓN PARA DIBUJAR FILA CON TABLA DE LOTES EMBEBIDA
// ============================================================
function drawRowLotes($pdf, $campo, $lotesInfo, $campo_w = 55, $num = '')
{
    $page_w = 190;
    $det_w = $page_w - $campo_w - 2;
    $x0 = $pdf->GetX();
    $y0 = $pdf->GetY();

    // Configuración sub-tabla
    $sub_cols = [35, 28, 33, 33];
    $header_h = 6;
    $row_h = 5;
    $num_lotes = count($lotesInfo);
    $sub_h = $header_h + ($num_lotes > 0 ? $num_lotes : 1) * $row_h + $row_h; // header + data + total
    $sub_h += 1; // padding

    // Altura del texto del campo
    $pdf->SetFont('Helvetica', 'B', 7);
    $campo_text = u8($num ? "{$num}. {$campo}" : $campo);
    $campo_lines = ceil($pdf->GetStringWidth($campo_text) / ($campo_w - 2));
    $campo_h = $campo_lines * 3.5 + 1;

    // Altura final de la fila y verificar salto de página
    $h = max($campo_h, $sub_h);
    if ($y0 + $h + 2 > 308) {
        $pdf->AddPage();
        $x0 = $pdf->GetX();
        $y0 = $pdf->GetY();
    }

    $tx = $x0 + $campo_w + 1; // X inicio sub-tabla
    $ty = $y0 + 1;            // Y inicio sub-tabla

    // Colocar texto campo
    $pdf->SetFont('Helvetica', 'B', 7);
    $pdf->SetXY($x0 + 1, $y0 + 0.5);
    $pdf->MultiCell($campo_w - 2, 3.5, $campo_text, 0, 'L');

    // --- Sub-tabla de lotes ---
    // Header
    $pdf->SetFillColor(180, 180, 180);
    $pdf->SetFont('Helvetica', 'B', 6);
    $headers = ['Lote', 'Cantidad', 'F. Fabricación', 'F. Vencimiento'];
    $hx = $tx;
    foreach ($headers as $i => $header) {
        $pdf->SetXY($hx, $ty);
        $pdf->Cell($sub_cols[$i], $header_h, u8($header), 1, 0, 'C', true);
        $hx += $sub_cols[$i];
    }

    // Filas de datos
    $pdf->SetFont('Helvetica', '', 6);
    $ty += $header_h;
    $total_cant = 0;

    if ($num_lotes > 0) {
        foreach ($lotesInfo as $l) {
            $fe = $l['fecha_elab'] ? date('d/m/Y', strtotime($l['fecha_elab'])) : 'N/A';
            $fv = $l['fecha_venc'] ? date('d/m/Y', strtotime($l['fecha_venc'])) : 'N/A';
            $cant = $l['cantidad'];
            $total_cant += $cant;

            $hx = $tx;
            $row_data = [$l['lote'], number_format($cant, 0, ',', '.'), $fe, $fv];
            foreach ($row_data as $i => $val) {
                $pdf->SetXY($hx, $ty);
                $pdf->Cell($sub_cols[$i], $row_h, u8($val), 1, 0, 'C');
                $hx += $sub_cols[$i];
            }
            $ty += $row_h;
        }
    } else {
        $hx = $tx;
        $pdf->SetXY($hx, $ty);
        $pdf->Cell(array_sum($sub_cols), $row_h, u8('Sin datos de lotes'), 1, 0, 'C');
        $ty += $row_h;
    }

    // Fila de total
    $pdf->SetFont('Helvetica', 'B', 6);
    $hx = $tx;
    $pdf->SetXY($hx, $ty);
    $pdf->Cell($sub_cols[0], $row_h, u8('Total'), 1, 0, 'C');
    $hx += $sub_cols[0];
    $pdf->SetXY($hx, $ty);
    $pdf->Cell($sub_cols[1], $row_h, number_format($total_cant, 0, ',', '.'), 1, 0, 'C');
    $hx += $sub_cols[1];
    $pdf->SetXY($hx, $ty);
    $pdf->Cell($sub_cols[2] + $sub_cols[3], $row_h, '', 1, 0, 'C');

    // --- Dibujar borde exterior de la fila ---
    $pdf->SetDrawColor(180);
    $pdf->Rect($x0, $y0, $page_w, $h);

    // Línea divisoria vertical
    $pdf->Line($x0 + $campo_w, $y0, $x0 + $campo_w, $y0 + $h);
    $pdf->SetDrawColor(0);

    // Mover cursor al final del rectángulo
    $pdf->SetXY($x0, $y0 + $h);
}

// ============================================================
// FUNCIÓN PARA DIBUJAR ENCABEZADO DE LA TABLA
// ============================================================
function drawTableHeader($pdf, $campo_w = 55)
{
    $page_w = 190;
    $x0 = $pdf->GetX();
    $y0 = $pdf->GetY();
    $h = 7;

    // Relleno gris más marcado
    $pdf->SetFillColor(180, 180, 180);
    $pdf->SetTextColor(0, 0, 0);
    $pdf->Rect($x0, $y0, $page_w, $h, 'F');

    // Borde exterior
    $pdf->SetDrawColor(180);
    $pdf->Rect($x0, $y0, $page_w, $h, 'D');

    // Línea divisoria vertical
    $pdf->Line($x0 + $campo_w, $y0, $x0 + $campo_w, $y0 + $h);
    $pdf->SetDrawColor(0);

    // Texto del encabezado
    $pdf->SetFont('Helvetica', 'B', 7);
    $pdf->SetXY($x0 + 1, $y0 + 1.5);
    $pdf->Cell($campo_w - 2, 4, u8('Campo'), 0, 0, 'C');
    $pdf->SetXY($x0 + $campo_w + 1, $y0 + 1.5);
    $pdf->Cell($page_w - $campo_w - 2, 4, u8('Detalle que debe incluirse'), 0, 0, 'C');

    $pdf->SetXY($x0, $y0 + $h);
}

// ============================================================
// 13 PUNTOS DE LA AUTODECLARACION
// ============================================================
$cliente_dir = $direccion ? ($direccion . ', ' . $ciudad . ', ' . $pais) : ($cliente_nombre . ' - ' . $pais);

// Encabezado de la tabla
drawTableHeader($pdf, 55);

drawRow($pdf, 'Fecha de diligenciamiento de autodeclaración', $fecha_ingreso, 55, '1');
drawRow($pdf, 'Razón Social del Exportador', 'Bufalabella S.A.S.', 55, '2');
drawRow($pdf, 'Razón Social del fabricante y código del establecimiento', "Bufalabella S.A.S.\nRSA-0034032-2024\nID del establecimiento: L12", 55, '3');
drawRow($pdf, 'Nombre del Consignatario / País de destino', "{$cliente_nombre}\nPaís: {$pais}", 55, '4');

// Productos
$prod_detalle = "Productos a exportar:\n" . $productos_str;
drawRow($pdf, 'Nombre del Producto a Exportar', $prod_detalle, 55, '5');

// Cantidades
$cant_detalle = number_format($total_unidades, 0, ',', '.') . " Unidades\n"
    . number_format($total_peso_neto, 2, ',', '.') . " Kg peso neto\n"
    . number_format($total_peso_escurrido, 2, ',', '.') . " Kg peso escurrido";
drawRow($pdf, 'Cantidad total de producto a exportar (unidades y peso neto)', $cant_detalle, 55, '6');

// Lotes
drawRowLotes($pdf, 'Lote(s) - Cantidad de unidades producidas, fecha de fabricación y fecha de vencimiento', $lotesInfo, 55, '7');

drawRow($pdf, 'Origen de la materia prima o derivados lácteos', 'Colombia - Departamento Meta y Antioquia', 55, '8');

drawRowTratamiento($pdf, "a. Tratamiento térmico aplicado a los lotes a exportar\nb. Certificado de tratamiento térmico", $lotesInfo, 55, '9');

$precauciones = "Implementación de sistema de inocuidad HACCP.\n"
    . "Capacitación continua de personal (BPM; inocuidad, contaminación cruzada).\n"
    . "Implementación de programa de Control de agua potable, programa limpieza y desinfección.\n"
    . "Estandarización parámetros de proceso (elaboración, empaque), programa de calibración de equipos (críticos: temperatura, pH).\n"
    . "Plan de muestreo microbiológico (insumos, producto semielaborado, terminado, vida útil, manipuladores, superficies).\n"
    . "Programa de monitoreo ambiental, control de temperaturas almacenamiento y distribución refrigerado.";
drawRow($pdf, 'Precauciones post-tratamiento', $precauciones, 55, '10');

// Construir $envase dinamicamente desde documentos_chile_items
$anexos_textos = [];
if (!empty($anexos_ids) && is_array($anexos_ids)) {
    $ids_placeholder = str_repeat('?,', count($anexos_ids) - 1) . '?';
    $sqlAnexos = "SELECT Texto FROM documentos_chile_items WHERE Tipo = 'anexo' AND Id IN ($ids_placeholder) AND Activo = 1 ORDER BY Orden";
    $stmtAnexos = $enlace->prepare($sqlAnexos);
    $stmtAnexos->bind_param(str_repeat('i', count($anexos_ids)), ...$anexos_ids);
    $stmtAnexos->execute();
    $stmtAnexos->bind_result($textoAnexo);
    while ($stmtAnexos->fetch()) { $anexos_textos[] = $textoAnexo; }
    $stmtAnexos->close();
} else {
    $sqlAnexos = "SELECT Texto FROM documentos_chile_items WHERE Tipo = 'anexo' AND Activo = 1 ORDER BY Orden";
    $stmtAnexos = $enlace->prepare($sqlAnexos);
    $stmtAnexos->execute();
    $stmtAnexos->bind_result($textoAnexo);
    while ($stmtAnexos->fetch()) { $anexos_textos[] = $textoAnexo; }
    $stmtAnexos->close();
}
$envase = !empty($anexos_textos) ? implode("\n", $anexos_textos) . "\nObservación: Se unifica en un solo PDF la evidencia de cada Producto" : 'No aplica';
drawRow($pdf, 'Envase y etiquetado', $envase, 55, '11');

drawRow($pdf, 'Condiciones sanitarias del medio de transporte', 'Anexo 13. Acta de Inspección de Vehículo', 55, '12');

$invima = "Septiembre 2024\n"
    . "Anexo 8. INFORME COMPLETO AUDIT INVIMA SEP 2024";
drawRow($pdf, 'Fecha última visita del INVIMA', $invima, 55, '13');

// NOTA ADICIONAL DENTRO DE CUADRO
$y_nota = $pdf->GetY();
$pdf->SetDrawColor(180);
$pdf->SetFont('Helvetica', 'B', 7);
$nota_text = u8("Nota. Se deben adjuntar a la presente autodeclaración por producto:\n")
    . u8("a. Soportes de producción del fabricante y termo registros donde se evidencie el tratamiento térmico. Anexo Cartas Termográficas y Formatos de proceso con pH.\n")
    . u8("b. Diagrama de flujo del proceso. Observación: Se unifica en un solo PDF: Evidencia de cada Producto. Anexo 14. Información gráfica PAST. CONTINUA DIBUFALA.\n")
    . u8("c. Certificado del tratamiento térmico. " . (isset($lotesInfo[0]) ? "Anexo 1 - Certificado Pasteurización - pH FEX {$id_factura}" : "Anexo 1 - Certificado Pasteurización") . "\n")
    . u8("d. Registro fotográfico del producto y su rotulo. Anexo 7. Fotografías Producto y Anexo 9. P-LAB-025 v15 PROCEDIMIENTO LIBERACIÓN PT. EMPAQUE\n")
    . u8("e. Acta de IVC de la última visita Invima al fabricante. Anexo 8. INFORME COMPLETO AUDIT INVIMA SEP 2024\n")
    . u8("Observaciones: Se unifica los anexos 8, 9, 13 y 14 en un pdf mencionado como Anexos adicionales.\n\n\n\n\n\n\n\n");
$pdf->MultiCell(190, 4, $nota_text, 1, 'L');

// FIRMA - imagen dentro del cuadro de Nota
if ($con_firma) {
    $y_fin_nota = $pdf->GetY();
    $firmaPath = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/firma.jpg";
    if (file_exists($firmaPath)) {
        $pdf->Image($firmaPath, 190 - 50 + 12, $y_fin_nota - 28, 50);
        $pdf->SetY($y_fin_nota);
    }
}

$pdf->Output('I', 'Autodeclaracion_Chile_' . $id_factura . '.pdf');
?>
