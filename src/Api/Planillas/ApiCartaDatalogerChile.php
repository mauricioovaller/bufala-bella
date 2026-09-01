<?php
error_reporting(0);
ini_set('display_errors', 0);

require_once($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/fpdf/fpdf.php");
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["error" => "Metodo no permitido. Usa POST."]));
}

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['id_factura']) || empty($input['id_factura'])) {
    die(json_encode(["error" => "ID de factura no valido."]));
}

$id_factura = intval($input['id_factura']);

function pdu8($str) {
    return $str === null ? '' : iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $str);
}

// ============================================================
// CONSULTA 1: FACTURA + CLIENTE + PLANILLA
// ============================================================
$sqlEnc = "SELECT
    enc.Id_EncabInvoice,
    enc.GuiaMaster,
    enc.Fecha AS fecha_factura,
    pl.Id_Planilla,
    pl.Precinto,
    pl.Placa,
    pl.Vehiculo,
    cli.Nombre AS cliente,
    cli.Direccion,
    cli.Ciudad,
    cli.Pais
FROM EncabInvoiceChile enc
LEFT JOIN PlanillasChile pl ON enc.Id_Planilla = pl.Id_Planilla
INNER JOIN ClientesChile cli ON enc.Id_Cliente = cli.Id_Cliente
WHERE enc.Id_EncabInvoice = ?";

$stmtEnc = $enlace->prepare($sqlEnc);
$stmtEnc->bind_param("i", $id_factura);
$stmtEnc->execute();
$stmtEnc->bind_result(
    $id_factura, $guia_master, $fecha_factura,
    $id_planilla, $precinto, $placa, $vehiculo,
    $cliente, $direccion, $ciudad, $pais
);

if (!$stmtEnc->fetch()) {
    die(json_encode(["error" => "Factura Chile no encontrada."]));
}
$stmtEnc->close();

// CONSULTA 2: PEDIDOS ASOCIADOS (cotizaciones)
$sqlPed = "SELECT GROUP_CONCAT(Id_EncabPedido ORDER BY Id_EncabPedido SEPARATOR ', ') AS cotizaciones
FROM EncabPedidoChile
WHERE FacturaNo = CONCAT('FEX-', ?) OR FacturaNo = CONCAT('CHI-FEX-', ?)";

$stmtPed = $enlace->prepare($sqlPed);
$stmtPed->bind_param("ii", $id_factura, $id_factura);
$stmtPed->execute();
$stmtPed->bind_result($cotizaciones);
$stmtPed->fetch();
$stmtPed->close();

// CONSULTA 3: TERMÓGRAFO (cuando la columna exista)
$termografo = '';
if ($id_planilla) {
    $sqlTerm = "SELECT TermografoNo FROM PlanillasChile WHERE Id_Planilla = ?";
    $stmtTerm = $enlace->prepare($sqlTerm);
    if ($stmtTerm) {
        $stmtTerm->bind_param("i", $id_planilla);
        $stmtTerm->execute();
        $stmtTerm->bind_result($termografo);
        $stmtTerm->fetch();
        $stmtTerm->close();
    }
}

// ============================================================
// FECHAS FORMATEADAS
// ============================================================
function mesEspanol($mes) {
    $meses = ['', 'enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return $meses[intval($mes)];
}

setlocale(LC_TIME, 'es_ES.UTF-8', 'Spanish_Spain.1252');
$ts = strtotime($fecha_factura ?: 'now');
$fecha_formateada = date('j', $ts) . pdu8(' de ' . mesEspanol(date('n', $ts)) . ' de ') . date('Y', $ts);

// ============================================================
// CLASE PDF
// ============================================================
class PDF_CartaDataloger extends FPDF
{
    function Header()
    {
        $logoPath = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalaFactura.jpg";
        if (file_exists($logoPath)) $this->Image($logoPath, 15, 8, 38);

        $this->SetFillColor(33, 74, 127);
        $this->Rect(0, 0, 216, 3, 'F');
    }

    function Footer()
    {
        $this->SetY(-18);
        $this->SetDrawColor(33, 74, 127);
        $this->SetLineWidth(0.3);
        $this->Line(12, $this->GetY(), 204, $this->GetY());
        $this->SetLineWidth(0.2);
        $this->SetDrawColor(0);
        $this->SetFont('Helvetica', 'I', 6);
        $this->SetTextColor(100, 100, 100);
        $this->Cell(96, 4, pdu8('Address. Autopista Medellin Km 18 El Rosal, Cundinamarca-Colombia'), 0, 0, 'L');
        $this->Cell(96, 4, pdu8('E-Mail. exportaciones@bufalabella.com'), 0, 1, 'R');
        $this->Cell(96, 4, pdu8('Calle 93 Bis No. 19-50 Of. 305 Bogota, Colombia'), 0, 0, 'L');
        $this->Cell(96, 4, pdu8('Phone. (60) 1 9172185/5466633'), 0, 0, 'R');
        $this->SetTextColor(0, 0, 0);
    }
}

$pdf = new PDF_CartaDataloger('P', 'mm', 'Letter');
$pdf->SetMargins(15, 12, 15);
$pdf->AliasNbPages();
$pdf->SetAutoPageBreak(true, 24);
$pdf->AddPage();

// ============================================================
// CONTENIDO DE LA CARTA
// ============================================================
$pdf->Ln(8);
$pdf->SetFont('Helvetica', '', 10);
$pdf->Cell(0, 5, pdu8('El Rosal, ' . $fecha_formateada), 0, 1, 'R');
$pdf->Ln(6);

$pdf->SetFont('Helvetica', '', 10);
$pdf->Cell(0, 5, pdu8('Senor(es):'), 0, 1, 'L');
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(0, 5, pdu8('LATAM AIRLINES Y/O DEPARTAMENTO DE SEGURIDAD'), 0, 1, 'L');
$pdf->SetFont('Helvetica', '', 10);
$pdf->Cell(0, 5, pdu8('Aeropuerto El Dorado Bogota'), 0, 1, 'L');
$pdf->Ln(4);

$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(0, 5, pdu8('Respetados Senores,'), 0, 1, 'L');
$pdf->Ln(4);

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(0, 5, pdu8('Ref. Dispositivo de Control Interno en Exportacion'), 0, 1, 'L');
$pdf->Ln(3);

// CUERPO PRINCIPAL
$pdf->SetFont('Helvetica', '', 9);
$cuerpo = pdu8('Mediante la presente informamos que dentro de la Caja No.1 Ciliegine del despacho que se esta entregando hoy bajo la guia No. ')
    . ($guia_master ?: '_______________')
    . pdu8(' con No. de factura FEX-') . $id_factura
    . pdu8(' y cotizacion No. ') . ($cotizaciones ?: ($id_planilla ?: '_______________'))
    . pdu8(' con destino al cliente ')
    . ($cliente ? pdu8($cliente) : '_______________')
    . pdu8(', en ' . ($ciudad ? pdu8($ciudad) : 'Santiago de Chile') . ' - ' . ($pais ? pdu8($pais) : 'Chile'))
    . pdu8(' va un dispositivo tipo Termografo No. ')
    . ($termografo ?: '_______________')
    . pdu8(' como control de temperatura.');
$pdf->MultiCell(0, 5, $cuerpo, 0, 'J');
$pdf->Ln(6);

// FIRMA
$pdf->SetFont('Helvetica', '', 10);
$pdf->Cell(0, 5, pdu8('Cordialmente,'), 0, 1, 'L');
$pdf->Ln(6);
$pdf->Cell(0, 5, $fecha_formateada, 0, 1, 'L');
$pdf->Ln(14);

//$firmaPath = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/firma.jpg";
//if (file_exists($firmaPath)) {
//    $pdf->Image($firmaPath, 15, $pdf->GetY() - 10, 38);
//}
//$pdf->Ln(8);

$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(0, 5, pdu8('JOHN JAIRO VERA RIANO'), 0, 1, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 5, pdu8('C.C. 11.449.717 de Facatativa'), 0, 1, 'L');
$pdf->Cell(0, 5, pdu8('Coordinador de Exportaciones'), 0, 1, 'L');
$pdf->Ln(2);
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(0, 5, pdu8('BUFALABELLA S.A.S'), 0, 1, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 5, pdu8('Nit. 900.254.183-4'), 0, 1, 'L');

$pdf->Output('I', 'Carta_Dataloger_Chile_' . $id_factura . '.pdf');
?>
