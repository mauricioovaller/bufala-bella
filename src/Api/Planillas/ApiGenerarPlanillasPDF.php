<?php
require_once($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/fpdf/fpdf.php");
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Verificar si la petición es POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die("Método no permitido. Usa POST.");
}

// Obtener los datos enviados en formato JSON
$input = json_decode(file_get_contents("php://input"), true);

// Verificar parámetros
if (!isset($input['tipo_carta']) || !in_array($input['tipo_carta'], ['carta-aerolinea', 'carta-policia'])) {
    http_response_code(400);
    die("Tipo de carta no válido. Debe ser 'carta-aerolinea' o 'carta-policia'.");
}

if (!isset($input['id_planilla']) || empty($input['id_planilla'])) {
    http_response_code(400);
    die("ID de planilla no válido.");
}

$tipo_carta = $input['tipo_carta'];
$id_planilla = intval($input['id_planilla']);

// DEBUG: Log de la solicitud
error_log("🔍 SOLICITUD PDF - Tipo: $tipo_carta, Planilla ID: $id_planilla");

// CONSULTA PRINCIPAL CORREGIDA: DATOS DE LA PLANILLA
$sqlPlanilla = "SELECT
                pln.Id_Planilla,
                DATE_FORMAT(pln.Fecha, '%d de %M de %Y') AS fecha_formateada,
                pln.Facturas,
                pln.GuiaMaster,
                pln.GuiaHija,
                pln.TotalPiezas,
                pln.Precinto,
                pln.Vehiculo,
                pln.Placa,
                csg.Nombre AS ConsignatarioFinal,
                aer.NOMAEROLINEA AS Aerolinea,
                age.NOMAGENCIA AS AgenciaCarga,
                con.Nombre AS NombreConductor,
                con.NoDocumento AS CedulaConductor,
                con_ayu.Nombre AS NombreAyudante,
                con_ayu.NoDocumento AS CedulaAyudante
            FROM
                Planillas pln
            LEFT JOIN Consignatarios csg ON pln.Id_Consignatario = csg.Id_Consignatario
            LEFT JOIN Aerolineas aer ON pln.IdAerolinea = aer.IdAerolinea
            LEFT JOIN Agencias age ON pln.IdAgencia = age.IdAgencia
            LEFT JOIN Conductores con ON pln.Id_Conductor = con.Id_Conductor
            LEFT JOIN Conductores con_ayu ON pln.Id_Ayudante = con_ayu.Id_Conductor
            WHERE
                pln.Id_Planilla = ?";

error_log("🔍 SQL: " . $sqlPlanilla);
error_log("🔍 Buscando planilla ID: " . $id_planilla);

$stmtPlanilla = $enlace->prepare($sqlPlanilla);
if (!$stmtPlanilla) {
    error_log("❌ Error preparando consulta: " . $enlace->error);
    http_response_code(500);
    die("Error en la consulta: " . $enlace->error);
}

$stmtPlanilla->bind_param("i", $id_planilla);
$stmtPlanilla->execute();
$stmtPlanilla->store_result();

error_log("🔍 Filas encontradas: " . $stmtPlanilla->num_rows);

if ($stmtPlanilla->num_rows === 0) {
    error_log("❌ Planilla no encontrada: " . $id_planilla);
    http_response_code(404);
    die("Planilla no encontrada. ID: " . $id_planilla);
}

$stmtPlanilla->bind_result(
    $id_planilla,
    $fecha_formateada,
    $facturas,
    $guia_master,
    $guia_hija,
    $total_piezas,
    $precinto,
    $vehiculo,
    $placa,
    $consignatario_final,
    $aerolinea,
    $agencia_carga,
    $nombre_conductor,
    $cedula_conductor,
    $nombre_ayudante,
    $cedula_ayudante
);

$stmtPlanilla->fetch();
$stmtPlanilla->close();

// DEBUG: Log de datos obtenidos
error_log("✅ DATOS OBTENIDOS:");
error_log("  - ID: $id_planilla");
error_log("  - Fecha: $fecha_formateada");
error_log("  - Facturas: $facturas");
error_log("  - Consignatario: $consignatario_final");
error_log("  - Aerolínea: $aerolinea");
error_log("  - Conductor: $nombre_conductor");
error_log("  - Ayudante: " . ($nombre_ayudante ? $nombre_ayudante : 'No asignado'));

// Si el ayudante está vacío, establecer valores por defecto
if (empty($nombre_ayudante)) {
    $nombre_ayudante = 'NO ASIGNADO';
    $cedula_ayudante = 'N/A';
    error_log("🔧 Ayudante no asignado, usando valores por defecto");
}

// ======================
// GENERAR PDF - CARTA DE RESPONSABILIDAD
// ======================
class PDF extends FPDF
{
    function Header()
    {
        // Logo Bufalabella
        $logoPath = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalaFactura.jpg";
        if (file_exists($logoPath)) {
            $this->Image($logoPath, 15, 10, 40);
        }

        // Información de la empresa
        $this->SetFont('Helvetica', 'B', 10);
        $this->SetXY(90, 10);
        $this->Cell(60, 4, 'BUFALABELLA S.A.S', 0, 1, 'C');
        $this->SetFont('Helvetica', '', 9);
        $this->SetX(90);
        $this->Cell(60, 4, 'Nit. 900.254.183-4', 0, 1, 'C');
        
        $this->Ln(8);
    }

    function Footer()
    {
        $this->SetY(-35);
        
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(22, 4, 'Elaborado por:', 0, 0, 'R');
        $this->Cell(34, 4, 'John Jairo Vera Riaño', 0, 1, 'L');
        $this->Cell(22, 4, '', 0, 0, 'R');
        $this->Cell(34, 4, 'Coordinador de Exportaciones', 0, 1, 'L');

        $this->Ln(8);

        $this->SetFont('Helvetica', 'B', 7);
        $this->Cell(80, 4, utf8_decode('Address. Autopista Medellín Km 18 El Rosal, Cundinamarca-Colombia'), 0, 0, 'C');
        $this->Cell(53, 4, 'E-Mail. exportaciones@bufalabella.com', 0, 0, 'C');
        $this->Cell(65, 4, 'Phone. (60) 1 9172185/5466633', 0, 1, 'C');

        $this->SetFont('Helvetica', 'B', 7);
        $this->Cell(80, 4, utf8_decode('Calle 93 Bis No. 19-50 Of. 305 Bogotá, Colombia'), 0, 0, 'C');
        $this->Cell(53, 4, '', 0, 0, 'C');
        $this->Cell(65, 4, 'Movil. (57) 321 242 45 52', 0, 1, 'C');
    }
}

// Crear PDF
$pdf = new PDF('P', 'mm', 'Letter');
$pdf->SetMargins(15, 15, 15);
$pdf->AliasNbPages();
$pdf->AddPage();

// Ciudad y Fecha
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(0, 6, 'Bogotá, ' . $fecha_formateada, 0, 1, 'L');
$pdf->Ln(5);

// Destinatario
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(0, 6, 'Señores:', 0, 1, 'L');
if ($tipo_carta == 'carta-aerolinea') {
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell(0, 6, $aerolinea, 0, 1, 'L');
} else {
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell(0, 6, 'Dirección Antinarcóticos', 0, 1, 'L');
    $pdf->Cell(0, 6, 'Base Operativa Aeropuerto el Dorado Bogotá', 0, 1, 'L');
    $pdf->Cell(0, 6, 'Bogotá', 0, 1, 'L');
}

$pdf->Ln(5);

// Referencia
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(0, 6, 'Referencia: Carta de Responsabilidad', 0, 1, 'L');
$pdf->Ln(3);

// Cuerpo de la carta
$pdf->SetFont('Helvetica', '', 10);
$texto_intro = "Yo, John Jairo Vera Riaño, identificado con número de cédula No. 11.449.717 expedida en Facatativá en mi condición de Coordinador de Exportaciones de la empresa BUFALABELLA S.A.S. con Nit No. 900.254.183-4 y número teléfonico 5466633, certifico que el contenido de la presente carga se ajusta a:";
$pdf->MultiCell(0, 5, utf8_decode($texto_intro));
$pdf->Ln(3);

// Facturas y Guías
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(0, 6, 'Factura No. ' . $facturas . ' - con la GUIA MASTER: ' . $guia_master, 0, 1, 'L');
$pdf->Cell(0, 6, 'GUIA HIJA: ' . $guia_hija, 0, 1, 'L');
$pdf->Ln(3);

$pdf->Cell(0, 6, 'Correspondiente a nuestro despacho así:', 0, 1, 'L');
$pdf->Ln(3);

// Tabla de información
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(50, 6, 'CONSIGNATARIO FINAL', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 6, $consignatario_final, 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(50, 6, 'DESTINO', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 6, 'MIAMI FLORIDA/ESTADOS UNIDOS', 0, 1, 'L');

$pdf->Ln(3);

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(0, 6, 'DESCRIPCIÓN GENERAL DE LA MERCANCIA', 0, 1, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 5, 'QUESO MOZZARELLA 100% LECHE DE BUFALA P.A. 0406100000', 0, 1, 'L');
$pdf->Cell(0, 5, 'YOGURT NATURAL 100% LECHE DE BUFALA Y DE SABORES 0403200090', 0, 1, 'L');

$pdf->Ln(3);

// Información de transporte
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(50, 6, 'TOTAL DE PIEZAS', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 6, $total_piezas, 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(50, 6, 'SELLOS PRECINTOS', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 6, $precinto, 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(50, 6, 'AGENCIA DE CARGA', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 6, $agencia_carga, 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(50, 6, 'AEROLINEA', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 6, $aerolinea, 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(50, 6, 'EMPRESA TRANSPORTADORA', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 6, 'PARTICULAR', 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(50, 6, 'NOMBRE DEL CONDUCTOR', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 6, $nombre_conductor, 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(50, 6, 'CEDULA DE CIUDADANIA', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 6, $cedula_conductor, 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(50, 6, 'NOMBRE DEL AYUDANTE', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 6, $nombre_ayudante, 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(50, 6, 'CEDULA DE CIUDADANIA', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 6, $cedula_ayudante, 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(50, 6, 'NUMERO DE CELULAR O TELEFONO FIJO', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 6, '3212424552', 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(50, 6, 'TIPO VEHICULO', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 6, $vehiculo, 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(50, 6, 'PLACA', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 6, $placa, 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(50, 6, 'No PLANILLA DE CARGA', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 6, $id_planilla, 0, 1, 'L');

$pdf->Ln(8);

// Texto de responsabilidad
$texto_responsabilidad = "Nos hacemos responsables por el contenido de esta carga ante las autoridades colombianas, extranjeras y ante el transportador en caso que se encuentren sustancias o elementos narcóticos, explosivos ilícitos o prohibidos estipulados en las normas internacionales a excepción de aquellos que expresamente se han declarado como tal armas o partes de ellas, municiones, material de guerra o sus partes u otros elementos que no cumplan con las obligaciones legales establecidas para este tipo de carga, siempre que se conserve sus empaques, características y sellos originales con las que sea entregada al transportador. El embarque ha sido preparado en lugares con óptimas condiciones de seguridad y ha sido protegido de toda intervención ilícita durante su preparación, embalaje, almacenamiento y transportador aéreo hacia las instalaciones de la aerolínea y cumple con todos los requisitos exigidos por la ley y normas fitosanitarias.";

$pdf->SetFont('Helvetica', '', 10);
$pdf->MultiCell(0, 5, utf8_decode($texto_responsabilidad));
$pdf->Ln(15);

// Firma
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(0, 6, 'Atentamente,', 0, 1, 'L');
$pdf->Ln(10);

$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(0, 6, 'John Jairo Vera Riaño', 0, 1, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 5, 'C.C. 11.449.717 de Facatativá', 0, 1, 'L');
$pdf->Cell(0, 5, 'Coordinador de Exportaciones', 0, 1, 'L');

// Generar nombre del archivo
$nombre_archivo = 'CartaResponsabilidad_' . ($tipo_carta == 'carta-aerolinea' ? 'Aerolinea' : 'Policia') . '_' . $id_planilla . '.pdf';

// Limpiar buffer de salida y enviar headers
while (ob_get_level()) {
    ob_end_clean();
}

// Enviar headers para PDF
header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="' . $nombre_archivo . '"');
header('Cache-Control: private, max-age=0, must-revalidate');
header('Pragma: public');

error_log("✅ PDF generado exitosamente: " . $nombre_archivo);

// Enviar el PDF
$pdf->Output('I', $nombre_archivo);
exit();
?>