<?php
// src/Api/PedidosChile/ApiImprimirListaEmpaqueChile.php
// Genera el PDF "Lista de Empaque - Chile" usando FPDF
require_once($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/fpdf/fpdf.php");
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["error" => "Método no permitido."]));
}

$input = json_decode(file_get_contents("php://input"), true);
if (!isset($input['idPedido']) || empty($input['idPedido'])) {
    die(json_encode(["error" => "ID de pedido no válido."]));
}

$idPedido = intval($input['idPedido']);
$enlace->query("SET lc_time_names = 'es_ES'");

// ── Encabezado ────────────────────────────────────────────────────────────────
$sqlEnc = "SELECT
    enc.Id_EncabPedidoChile,
    DATE_FORMAT(enc.FechaRecepcionOrden, '%d/%m/%Y') AS FechaRecepcionOrden,
    DATE_FORMAT(enc.FechaSolicitudEntrega, '%d/%m/%Y') AS FechaSolicitudEntrega,
    DATE_FORMAT(enc.FechaFinalEntrega, '%d/%m/%Y') AS FechaFinalEntrega,
    enc.NumeroOrden,
    enc.GuiaAerea,
    enc.CantidadEstibas,
    enc.DescuentoComercial,
    enc.Observaciones,
    enc.FacturaNo,
    cli.Nombre AS NombreCliente,
    cli.Direccion,
    cli.Ciudad,
    cli.Pais,
    COALESCE(age.NOMAGENCIA, '') AS AgenciaCarga,
    COALESCE(aer.NOMAEROLINEA, '') AS Aerolinea
  FROM EncabPedidoChile enc
  INNER JOIN ClientesChile cli ON enc.Id_ClienteChile = cli.Id_ClienteChile
  LEFT JOIN Agencias age ON enc.IdAgencia = age.IdAgencia
  LEFT JOIN Aerolineas aer ON enc.IdAerolinea = aer.IdAerolinea
  WHERE enc.Id_EncabPedidoChile = ?";

$stmtEnc = $enlace->prepare($sqlEnc);
$stmtEnc->bind_param("i", $idPedido);
$stmtEnc->execute();
$stmtEnc->bind_result(
    $numPedido,
    $fechaRecep,
    $fechaSol,
    $fechaFinal,
    $numeroOrden,
    $guiaAerea,
    $cantEstibas,
    $descuento,
    $observaciones,
    $facturaNo,
    $nombreCliente,
    $direccion,
    $ciudad,
    $pais,
    $agencia,
    $aerolinea
);

if (!$stmtEnc->fetch()) {
    die(json_encode(["error" => "Pedido Chile no encontrado."]));
}
$stmtEnc->close();

// ── Detalle ───────────────────────────────────────────────────────────────────
$sqlDet = "SELECT
    det.Descripcion,
    det.CodigoCliente,
    det.CodigoSiesa,
    det.Lote,
    DATE_FORMAT(det.FechaElaboracion, '%d/%m/%Y') AS FechaElab,
    DATE_FORMAT(det.FechaVencimiento, '%d/%m/%Y') AS FechaVenc,
    det.CantidadCajas,
    det.EnvaseInternoxCaja,
    (det.CantidadCajas * det.EnvaseInternoxCaja) AS UnidadesSolicitadas,
    det.PesoNetoGr,
    det.PesoEscurridoKg,
    (det.PesoEscurridoKg * det.EnvaseInternoxCaja) AS PesoEscurridoCaja,
    (det.PesoEscurridoKg * det.EnvaseInternoxCaja * det.CantidadCajas) AS PesoEscurridoTotal,
    ((det.PesoNetoGr / 1000) * det.CantidadCajas * det.EnvaseInternoxCaja) AS PesoNetoTotal,
    ((det.PesoNetoGr / 1000) * det.CantidadCajas * det.EnvaseInternoxCaja * det.FactorPesoBruto) AS PesoBrutoTotal,
    det.ValorXKilo,
    (det.PesoEscurridoKg * det.EnvaseInternoxCaja * det.CantidadCajas * det.ValorXKilo) AS ValorTotal
  FROM DetPedidoChile det
  WHERE det.Id_EncabPedidoChile = ?
  ORDER BY det.Id_DetPedidoChile";

$stmtDet = $enlace->prepare($sqlDet);
$stmtDet->bind_param("i", $idPedido);
$stmtDet->execute();
$stmtDet->bind_result(
    $rDescripcion,
    $rCodCli,
    $rCodSiesa,
    $rLote,
    $rFechaElab,
    $rFechaVenc,
    $rCajas,
    $rEnvase,
    $rUnidades,
    $rPesoNetoGr,
    $rPesoEscUnd,
    $rPesoEscCaja,
    $rPesoEscTotal,
    $rPesoNetoTotal,
    $rPesoBrutoTotal,
    $rValorKilo,
    $rValorTotal
);

$detalles = [];
$totCajas = 0;
$totUnidades = 0;
$totPesoNetoTotal = 0;
$totPesoBruto = 0;
$totPesoEscTotal = 0;
$totValor = 0;

while ($stmtDet->fetch()) {
    $detalles[] = compact(
        'rDescripcion',
        'rCodCli',
        'rCodSiesa',
        'rLote',
        'rFechaElab',
        'rFechaVenc',
        'rCajas',
        'rEnvase',
        'rUnidades',
        'rPesoNetoGr',
        'rPesoEscUnd',
        'rPesoEscCaja',
        'rPesoEscTotal',
        'rPesoNetoTotal',
        'rPesoBrutoTotal',
        'rValorKilo',
        'rValorTotal'
    );
    $totCajas         += $rCajas;
    $totUnidades      += $rUnidades;
    $totPesoEscTotal  += $rPesoEscTotal;
    $totPesoNetoTotal += $rPesoNetoTotal;
    $totPesoBruto     += $rPesoBrutoTotal;
    $totValor         += $rValorTotal;
}
$stmtDet->close();
$enlace->close();

$totalFinal = $totValor - floatval($descuento);

// ── FPDF ──────────────────────────────────────────────────────────────────────
function iconv_utf8($str)
{
    return iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $str ?? '');
}

class PDFChile extends FPDF
{
    public $headerData = [];

    function Header()
    {
        $hd = $this->headerData;

        // Logo
        $logoPath = $_SERVER['DOCUMENT_ROOT'] . '/DatenBankenApp/DiBufala/assets/logo_bufala_bella.png';
        if (file_exists($logoPath)) {
            $this->Image($logoPath, 10, 8, 30);
        }

        // Título central
        $this->SetFont('Arial', 'B', 13);
        $this->SetTextColor(0, 70, 130);
        $this->SetXY(0, 10);
        $this->Cell(0, 6, iconv_utf8('LISTA DE EMPAQUE - CHILE'), 0, 1, 'C');
        $this->SetFont('Arial', '', 9);
        $this->SetTextColor(0, 0, 0);
        $this->SetX(0);
        $this->Cell(0, 5, 'BUFALA BELLA S.A.S  |  NIT: 900.584.373-5', 0, 1, 'C');

        // Número de pedido (esquina derecha)
        $this->SetFont('Arial', 'B', 10);
        $this->SetXY(220, 8);
        $this->Cell(70, 6, iconv_utf8('CHI-' . str_pad($hd['numPedido'], 6, '0', STR_PAD_LEFT)), 0, 0, 'R');

        $this->Ln(6);

        // Bloque de datos del encabezado
        $this->SetFont('Arial', '', 8);
        $lx = 10;
        $rx = 150;

        // Línea 1
        $this->SetXY($lx, $this->GetY());
        $this->SetFont('Arial', 'B', 8);
        $this->Cell(35, 5, iconv_utf8('Cliente:'), 0);
        $this->SetFont('Arial', '', 8);
        $this->Cell(100, 5, iconv_utf8($hd['nombreCliente'] . ' - ' . $hd['ciudad'] . ', ' . $hd['pais']), 0, 0);
        $this->SetXY($rx, $this->GetY());
        $this->SetFont('Arial', 'B', 8);
        $this->Cell(30, 5, iconv_utf8('Factura No. FEX-'), 0);
        $this->SetFont('Arial', '', 8);
        $this->Cell(40, 5, iconv_utf8($hd['facturaNo']), 0, 1);

        // Línea 2
        $this->SetXY($lx, $this->GetY());
        $this->SetFont('Arial', 'B', 8);
        $this->Cell(35, 5, iconv_utf8('No. Orden Cliente:'), 0);
        $this->SetFont('Arial', '', 8);
        $this->Cell(60, 5, iconv_utf8($hd['numeroOrden']), 0, 0);
        $this->SetXY($rx, $this->GetY());
        $this->SetFont('Arial', 'B', 8);
        $this->Cell(30, 5, iconv_utf8('Agencia Carga:'), 0);
        $this->SetFont('Arial', '', 8);
        $this->Cell(40, 5, iconv_utf8($hd['agencia']), 0, 1);

        // Línea 3
        $this->SetXY($lx, $this->GetY());
        $this->SetFont('Arial', 'B', 8);
        $this->Cell(35, 5, iconv_utf8('Fecha Recepción:'), 0);
        $this->SetFont('Arial', '', 8);
        $this->Cell(60, 5, iconv_utf8($hd['fechaRecep']), 0, 0);
        $this->SetXY($rx, $this->GetY());
        $this->SetFont('Arial', 'B', 8);
        $this->Cell(30, 5, iconv_utf8('Aerolínea:'), 0);
        $this->SetFont('Arial', '', 8);
        $this->Cell(40, 5, iconv_utf8($hd['aerolinea']), 0, 1);

        // Línea 4
        $this->SetXY($lx, $this->GetY());
        $this->SetFont('Arial', 'B', 8);
        $this->Cell(35, 5, iconv_utf8('Fecha Solicitud Entrega:'), 0);
        $this->SetFont('Arial', '', 8);
        $this->Cell(60, 5, iconv_utf8($hd['fechaSol']), 0, 0);
        $this->SetXY($rx, $this->GetY());
        $this->SetFont('Arial', 'B', 8);
        $this->Cell(30, 5, iconv_utf8('Guía Aérea AWB No.:'), 0);
        $this->SetFont('Arial', '', 8);
        $this->Cell(40, 5, iconv_utf8($hd['guiaAerea']), 0, 1);

        // Línea 5
        $this->SetXY($lx, $this->GetY());
        $this->SetFont('Arial', 'B', 8);
        $this->Cell(35, 5, iconv_utf8('Fecha Final Entrega:'), 0);
        $this->SetFont('Arial', '', 8);
        $this->Cell(60, 5, iconv_utf8($hd['fechaFinal']), 0, 0);
        $this->SetXY($rx, $this->GetY());
        $this->SetFont('Arial', 'B', 8);
        $this->Cell(30, 5, iconv_utf8('Cantidad Estibas:'), 0);
        $this->SetFont('Arial', '', 8);
        $this->Cell(40, 5, iconv_utf8($hd['cantEstibas']), 0, 1);

        $this->Ln(2);

        // Encabezado de tabla (columnas)
        $this->SetFillColor(0, 70, 130);
        $this->SetTextColor(255, 255, 255);
        $this->SetFont('Arial', 'B', 6.5);

        $cols = [
            ['Descripcion',         30],
            ['Cod.Cust.',  13],
            ['Cod.SIESA', 13],
            ['Lote',                12],
            ['Fc.Elab.',   13],
            ['Fc.Venc.',  13],
            ['Cajas',                9],
            ['Env/Caja',    9],
            ['Unid.',               9],
            ['PesoNeto Gr', 13],
            ['PEscUrnd', 12],
            ['PEscU/Cj',           12],
            ['PEsc Tot.',  12],
            ['Pn Total',           12],
            ['PB Total',   12],
            ['Vr/Kilo',            12],
            ['Vr Total',   15],
        ];

        foreach ($cols as [$label, $w]) {
            $this->Cell($w, 7, iconv_utf8($label), 1, 0, 'C', true);
        }
        $this->Ln();
        $this->SetTextColor(0, 0, 0);
    }

    function Footer()
    {
        $this->SetY(-12);
        $this->SetFont('Arial', 'I', 7);
        $this->SetTextColor(128);
        $this->Cell(0, 5, iconv_utf8('Página ' . $this->PageNo()), 0, 0, 'C');
    }
}

$pdf = new PDFChile('L', 'mm', 'A4');
$pdf->headerData = compact(
    'numPedido',
    'fechaRecep',
    'fechaSol',
    'fechaFinal',
    'numeroOrden',
    'guiaAerea',
    'cantEstibas',
    'descuento',
    'facturaNo',
    'nombreCliente',
    'ciudad',
    'pais',
    'agencia',
    'aerolinea'
);
$pdf->AddPage();
$pdf->SetFont('Arial', '', 7.5);
$pdf->SetFillColor(240, 247, 255);

// ── Filas de detalle ──────────────────────────────────────────────────────────
$cols = [
    ['descrip',    30],
    ['codcli',   13],
    ['codsiesa', 13],
    ['lote',       12],
    ['felab',    13],
    ['fevenc',   13],
    ['cajas',       9],
    ['envase',    9],
    ['unidades',    9],
    ['pesonetogr', 13],
    ['pesoescund', 12],
    ['pesoesccaja', 12],
    ['peoesctot', 12],
    ['pesonetot',  12],
    ['pesobrutot', 12],
    ['valorkilo',  12],
    ['valortotal', 15],
];

$fill = false;
foreach ($detalles as $idx => $d) {
    // Calcular altura de la fila según longitud de descripción
    $lines = $pdf->GetStringWidth(iconv_utf8($d['rDescripcion'])) / 30;
    $rowH = ($lines > 1) ? 5 : 5;

    $pdf->SetFont('Arial', '', 6.5);
    $pdf->Cell(30, $rowH, iconv_utf8($d['rDescripcion']), 1, 0, 'L', $fill);
    $pdf->Cell(13, $rowH, iconv_utf8($d['rCodCli']), 1, 0, 'C', $fill);
    $pdf->Cell(13, $rowH, iconv_utf8($d['rCodSiesa']), 1, 0, 'C', $fill);
    $pdf->Cell(12, $rowH, iconv_utf8($d['rLote']), 1, 0, 'C', $fill);
    $pdf->Cell(13, $rowH, iconv_utf8($d['rFechaElab']), 1, 0, 'C', $fill);
    $pdf->Cell(13, $rowH, iconv_utf8($d['rFechaVenc']), 1, 0, 'C', $fill);
    $pdf->Cell(9,  $rowH, number_format($d['rCajas'], 0), 1, 0, 'C', $fill);
    $pdf->Cell(9,  $rowH, number_format($d['rEnvase'], 0), 1, 0, 'C', $fill);
    $pdf->Cell(9,  $rowH, number_format($d['rUnidades'], 0), 1, 0, 'C', $fill);
    $pdf->Cell(13, $rowH, number_format($d['rPesoNetoGr'], 0), 1, 0, 'C', $fill);
    $pdf->Cell(12, $rowH, number_format($d['rPesoEscUnd'], 3), 1, 0, 'C', $fill);
    $pdf->Cell(12, $rowH, number_format($d['rPesoEscCaja'], 4), 1, 0, 'C', $fill);
    $pdf->Cell(12, $rowH, number_format($d['rPesoEscTotal'], 4), 1, 0, 'C', $fill);
    $pdf->Cell(12, $rowH, number_format($d['rPesoNetoTotal'], 4), 1, 0, 'C', $fill);
    $pdf->Cell(12, $rowH, number_format($d['rPesoBrutoTotal'], 4), 1, 0, 'C', $fill);
    $pdf->Cell(12, $rowH, number_format($d['rValorKilo'], 4), 1, 0, 'C', $fill);
    $pdf->Cell(15, $rowH, '$ ' . number_format($d['rValorTotal'], 4), 1, 1, 'R', $fill);

    $fill = !$fill;
}

// ── Fila de totales ───────────────────────────────────────────────────────────
$pdf->SetFont('Arial', 'B', 7);
$pdf->SetFillColor(200, 220, 240);
$anchoFijo = 30 + 13 + 13 + 12 + 13 + 13; // columnas descrip+codcli+siesa+lote+felab+fevenc
$pdf->Cell($anchoFijo, 6, iconv_utf8('TOTALES'), 1, 0, 'C', true);
$pdf->Cell(9,  6, number_format($totCajas, 0), 1, 0, 'C', true);
$pdf->Cell(9,  6, '', 1, 0, 'C', true); // envase (sin total)
$pdf->Cell(9,  6, number_format($totUnidades, 0), 1, 0, 'C', true);
$pdf->Cell(13, 6, '', 1, 0, 'C', true); // PesoNetoGr
$pdf->Cell(12, 6, '', 1, 0, 'C', true); // PesoEscUnd
$pdf->Cell(12, 6, '', 1, 0, 'C', true); // PesoEscCaja
$pdf->Cell(12, 6, number_format($totPesoEscTotal, 4), 1, 0, 'C', true);
$pdf->Cell(12, 6, number_format($totPesoNetoTotal, 4), 1, 0, 'C', true);
$pdf->Cell(12, 6, number_format($totPesoBruto, 4), 1, 0, 'C', true);
$pdf->Cell(12, 6, '', 1, 0, 'C', true); // ValorKilo
$pdf->Cell(15, 6, '$ ' . number_format($totValor, 4), 1, 1, 'R', true);

// ── Descuento y Total Final ───────────────────────────────────────────────────
if (floatval($descuento) > 0) {
    $anchoDesc = 30 + 13 + 13 + 12 + 13 + 13 + 9 + 9 + 9 + 13 + 12 + 12 + 12 + 12 + 12;
    $pdf->Cell($anchoDesc, 6, iconv_utf8('Descuento Comercial:'), 1, 0, 'R', false);
    $pdf->Cell(15, 6, '- $ ' . number_format($descuento, 4), 1, 1, 'R', false);

    $pdf->SetFont('Arial', 'B', 8);
    $pdf->Cell($anchoDesc, 7, iconv_utf8('TOTAL (USD):'), 1, 0, 'R', true);
    $pdf->Cell(15, 7, '$ ' . number_format($totalFinal, 4), 1, 1, 'R', true);
}

// ── Observaciones ─────────────────────────────────────────────────────────────
if (!empty($observaciones)) {
    $pdf->Ln(3);
    $pdf->SetFont('Arial', 'B', 8);
    $pdf->Cell(40, 5, iconv_utf8('Observaciones:'), 0, 0);
    $pdf->SetFont('Arial', '', 8);
    $pdf->MultiCell(0, 5, iconv_utf8($observaciones), 0);
}

// ── Salida ────────────────────────────────────────────────────────────────────
$nombreArchivo = 'ListaEmpaque_Chile_CHI-' . str_pad($idPedido, 6, '0', STR_PAD_LEFT) . '.pdf';
header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="' . $nombreArchivo . '"');
$pdf->Output('I', $nombreArchivo);
