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

function pdu8($str)
{
    return $str === null ? '' : iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $str);
}

function mesEspanol($mes)
{
    $meses = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return $meses[intval($mes)];
}

try {

    // ============================================================
    // CONSULTA: FACTURA + CLIENTE + PLANILLA
    // ============================================================
    $sql = "SELECT
    enc.Id_EncabInvoice,
    enc.Fecha AS fecha_factura,
    enc.GuiaMaster,
    pl.Id_Planilla,
    cli.Nombre AS cliente,
    cli.Rut,
    cli.Direccion,
    cli.Ciudad,
    cli.Pais,
    cli.Telefono
FROM EncabInvoiceChile enc
LEFT JOIN PlanillasChile pl ON enc.Id_Planilla = pl.Id_Planilla
INNER JOIN ClientesChile cli ON enc.Id_Cliente = cli.Id_Cliente
WHERE enc.Id_EncabInvoice = ?";

    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("i", $id_factura);
    $stmt->execute();
    $stmt->bind_result(
        $id_factura,
        $fecha_factura,
        $guia_master,
        $id_planilla,
        $cliente,
        $rut,
        $direccion,
        $ciudad,
        $pais,
        $telefono
    );

    if (!$stmt->fetch()) {
        die(json_encode(["error" => "Factura Chile no encontrada."]));
    }
    $stmt->close();

    // ============================================================
    // FECHA FORMATEADA
    // ============================================================
    $ts = strtotime($fecha_factura ?: 'now');
    $fecha_formateada = date('j', $ts) . pdu8(' de ' . mesEspanol(date('n', $ts)) . ' de ') . date('Y', $ts);

    $cliente_clean = $cliente ? pdu8($cliente) : '';
    $ciudad_clean = $ciudad ? pdu8($ciudad) : '';
    $pais_clean = $pais ? pdu8($pais) : '';
    $direccion_clean = $direccion ? pdu8( $direccion) : '';
    $telefono_clean = $telefono ? pdu8($telefono) : '';
    $rut_clean = $rut ? pdu8($rut) : '';
    $planilla_no = $id_planilla ?: $id_factura;

    // ============================================================
    // CLASE PDF
    // ============================================================
    class PDF_SolicitudICA extends FPDF
    {
        function Header()
        {
            $this->SetFillColor(33, 74, 127);
            $this->Rect(0, 0, 216, 3, 'F');

            $logoPath = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalaFactura.jpg";
            if (file_exists($logoPath)) $this->Image($logoPath, 12, 15, 38);
            $this->SetFont('Helvetica', 'B', 11);
            $this->SetXY(55, 20);
            $this->Cell(150, 5, pdu8('BUFALABELLA S.A.S'), 0, 1, 'C');
            $this->SetFont('Helvetica', '', 9);
            $this->SetX(55);
            $this->Cell(150, 4, pdu8('Nit. 900.254.183-4'), 0, 1, 'C');
            $this->Ln(8);
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

    $pdf = new PDF_SolicitudICA('P', 'mm', 'Letter');
    $pdf->SetMargins(15, 12, 15);
    $pdf->AliasNbPages();
    $pdf->SetAutoPageBreak(true, 24);
    $pdf->AddPage();

    $margen = 15;
    $ancho = 180;

    // ============================================================
    // ENCABEZADO: Lugar y fecha
    // ============================================================
    $pdf->Ln(8);
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->Cell(0, 5, pdu8('El Rosal, ' . $fecha_formateada), 0, 1, 'L');
    $pdf->Ln(6);

    // ============================================================
    // DESTINATARIO
    // ============================================================
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->Cell(0, 5, pdu8('Señor(es):'), 0, 1, 'L');
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell(0, 5, pdu8('Oficinas Nacionales I.C.A.'), 0, 1, 'L');
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->Cell(0, 5, pdu8('Aeropuerto El Dorado Bogotá'), 0, 1, 'L');
    $pdf->Cell(0, 5, pdu8('Bogotá'), 0, 1, 'L');
    $pdf->Ln(3);

    // Ref. al lado derecho
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell(0, 5, pdu8('Ref. Inspección Sanitaria I.C.A.'), 0, 1, 'R');
    $pdf->Ln(4);

    // ============================================================
    // CUERPO - CLIENTE
    // ============================================================
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell(0, 5, pdu8('Respetados Señores,'), 0, 1, 'L');
    $pdf->Ln(2);

    // ============================================================
    // SOLICITUD INSPECCIÓN SANITARIA
    // ============================================================
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->MultiCell(0, 5, pdu8('Atentamente, solicitamos inspección sanitaria de nuestros productos Queso Mozzarella 100% leche de Búfala, producido por Bufalabella S.A.S. el cual enviaremos con destino a:'), 0, 'J');
    $pdf->Ln(4);

    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell(35, 5, pdu8('Cliente ' ), 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->Cell(0, 5, pdu8( $cliente_clean), 0, 1, 'L');

    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell(35, 5, pdu8('Dirección Comercial' ), 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->Cell(60, 5,  $direccion_clean, 0, 1, 'L');
    
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell(35, 5, pdu8('FONO' ), 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->Cell(20, 5, pdu8( '2295058'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell(8, 5, pdu8('RUT' ), 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->Cell(10, 5, pdu8( '78.986.740-2'), 0, 1, 'L');

    $pdf->Ln(4);

    // ============================================================
    // LISTA DE DOCUMENTOS ACOMPAÑANTES
    // ============================================================
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->Cell(0, 5, pdu8('El despacho irá acompañado por:'), 0, 1, 'L');
    $pdf->Ln(2);

    $pdf->SetFont('Helvetica', '', 10);
    $pdf->Cell(40, 5, pdu8('1. Factura Comercial No. ' ), 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell(15, 5, pdu8('FEX - ' . $id_factura), 0, 1, 'L');
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->Cell(39, 5, pdu8('2. Lista de Empaque No. '), 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell(15, 5, pdu8( $planilla_no), 0, 1, 'L');
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->Cell(0, 5, pdu8('3. Fichas Técnicas'), 0, 1, 'L');
    $pdf->Cell(0, 5, pdu8('4. Certificado de Origen'), 0, 1, 'L');
    $pdf->Cell(0, 5, pdu8('5. Certificados de Calidad'), 0, 1, 'L');
    $pdf->Cell(0, 5, pdu8('6. CIS Expedido por la Entidad Correspondiente'), 0, 1, 'L');
    $pdf->Ln(4);

    $pdf->SetFont('Helvetica', '', 10);
    $pdf->MultiCell(0, 5, pdu8('Nos hacemos responsables de la carga y certificamos que el importador en destino no solicita más documentos.'), 0, 'J');
    $pdf->Ln(6);

    // ============================================================
    // CIERRE
    // ============================================================
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->Cell(0, 5, pdu8('Cordialmente,'), 0, 1, 'L');    
    $pdf->Ln(16);

    // Firma
    //$firmaPath = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/firma.jpg";
    //if (file_exists($firmaPath)) {
    //    $pdf->Image($firmaPath, 15, $pdf->GetY() - 10, 38);
    //}
    //$pdf->Ln(8);

    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell(0, 5, pdu8('JOHN JAIRO VERA RIAÑO'), 0, 1, 'L');
    $pdf->SetFont('Helvetica', '', 9);
    $pdf->Cell(0, 5, pdu8('C.C. 11.449.717 de Facatativá'), 0, 1, 'L');
    $pdf->Cell(0, 5, pdu8('Coordinador de Exportaciones'), 0, 1, 'L');
    $pdf->Ln(2);
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell(0, 5, pdu8('BUFALABELLA S.A.S'), 0, 1, 'L');
    $pdf->SetFont('Helvetica', '', 9);
    $pdf->Cell(0, 5, pdu8('Nit. 900.254.183-4'), 0, 1, 'L');

    $pdf->Output('I', 'Solicitud_ICA_Chile_' . $id_factura . '.pdf');
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
} catch (Error $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error PHP: " . $e->getMessage()]);
}
