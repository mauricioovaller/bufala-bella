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

// Verificar si se recibió el ID de factura correctamente
if (!isset($input['id_factura']) || empty($input['id_factura'])) {
    die(json_encode(["error" => "ID de factura no válido."]));
}

$id_factura = intval($input['id_factura']);

// 🔴 CONSULTA 1: ENCABEZADO DE FACTURA Y DATOS DE PLANILLA
$sqlEncabezado = "SELECT
                    enc.Id_EncabInvoice AS id_factura,
                    CONCAT('FEX-', enc.Id_EncabInvoice) AS numero_factura,
                    DATE_FORMAT(enc.Fecha, '%d/%m/%Y') AS fecha_factura,
                    csg.Nombre AS Consignatario,
                    csg.DUNS,
                    csg.Direccion,
                    csg.Telefono,
                    '30 Days' AS Payment_Term,
                    enc.GuiaMaster,
                    enc.GuiaHija,
                    aer.NOMAEROLINEA AS Aerolinea,
                    age.NOMAGENCIA AS Agencia,
                    'FCA AEROPUERTO' AS Termino_Negociacion,
                    enc.CantidadEstibas,
                    ROUND(SUM(det.Kilogramos), 2) AS tot_kgm_netos,
                    ROUND(SUM(det.Kilogramos) * 2.6, 2) AS tot_kgm_brutos,
                    ROUND(SUM(det.Kilogramos * det.ValKilogramo), 2) AS total_valor,
                    -- DATOS DE PLANILLA
                    pl.Placa,
                    pl.Precinto,
                    cond.Nombre AS Conductor,
                    ayud.Nombre AS Ayudante,
                    DATE_FORMAT(pl.Fecha, '%d de %M de %Y') AS fecha_salida
                FROM
                    EncabInvoice enc
                INNER JOIN DetInvoice det ON enc.Id_EncabInvoice = det.Id_EncabInvoice
                INNER JOIN Consignatarios csg ON enc.Id_Consignatario = csg.Id_Consignatario
                INNER JOIN Aerolineas aer ON enc.IdAerolinea = aer.IdAerolinea
                INNER JOIN Agencias age ON enc.IdAgencia = age.IdAgencia
                LEFT JOIN Planillas pl ON enc.Id_Planilla = pl.Id_Planilla
                LEFT JOIN Conductores cond ON pl.Id_Conductor = cond.Id_Conductor
                LEFT JOIN Ayudantes ayud ON pl.Id_Ayudante = ayud.Id_Ayudante
                WHERE
                    enc.Id_EncabInvoice = ?
                GROUP BY 
                    enc.Id_EncabInvoice, enc.Fecha, csg.Nombre, csg.DUNS, csg.Direccion, csg.Telefono,
                    enc.GuiaMaster, enc.GuiaHija, aer.NOMAEROLINEA, age.NOMAGENCIA, enc.CantidadEstibas,
                    pl.Placa, pl.Precinto, cond.Nombre, ayud.Nombre, pl.Fecha";

$stmtEncabezado = $enlace->prepare($sqlEncabezado);
$stmtEncabezado->bind_param("i", $id_factura);
$stmtEncabezado->execute();
$stmtEncabezado->bind_result(
    $id_factura,
    $numero_factura,
    $fecha_factura,
    $consignatario,
    $duns,
    $direccion,
    $telefono,
    $payment_term,
    $guia_master,
    $guia_hija,
    $aerolinea,
    $agencia,
    $termino_negociacion,
    $cantidad_estibas,
    $tot_kgm_netos,
    $tot_kgm_brutos,
    $total_valor,
    $placa,
    $precinto,
    $conductor,
    $ayudante,
    $fecha_salida
);

if (!$stmtEncabezado->fetch()) {
    die(json_encode(["error" => "Factura no encontrada."]));
}
$stmtEncabezado->close();

// 🔴 CONSULTA 2: DETALLE DE FACTURA (PARA LA TABLA DE PRODUCTOS)
$sqlDetalle = "SELECT
                det.Item,
                det.Codigo_Siesa,
                det.Codigo_FDA,
                det.Kilogramos,
                emb.Cantidad AS Embalaje,
                det.CantidadEmbalaje AS Unidades,
                det.Cajas,
                det.DescripFactura AS Producto,
                det.ValKilogramo AS Valor_Kilo,
                ROUND(det.Kilogramos * det.ValKilogramo, 2) AS Valor_Total,
                prd.PlanVallejo 
            FROM
                DetInvoice det
            INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
            INNER JOIN Productos prd ON det.Codigo_Siesa = prd.Codigo_Siesa
            WHERE
                det.Id_EncabInvoice = ?
            ORDER BY det.Item";

$stmtDetalle = $enlace->prepare($sqlDetalle);
$stmtDetalle->bind_param("i", $id_factura);
$stmtDetalle->execute();
$stmtDetalle->bind_result(
    $item,
    $codigo_siesa,
    $codigo_fda,
    $kilogramos,
    $embalaje,
    $unidades,
    $cajas,
    $producto,
    $valor_kilo,
    $valor_total,
    $plan_vallejo
);

$detalles = [];
$total_cajas = 0;
$total_unidades = 0;
while ($stmtDetalle->fetch()) {
    $detalles[] = [
        'item' => $item,
        'codigo_siesa' => $codigo_siesa,
        'codigo_fda' => $codigo_fda,
        'kilogramos' => $kilogramos,
        'embalaje' => $embalaje,
        'unidades' => $unidades,
        'cajas' => $cajas,
        'producto' => $producto,
        'valor_kilo' => $valor_kilo,
        'valor_total' => $valor_total,
        'plan_vallejo' => $plan_vallejo,
    ];
    $total_cajas += $cajas;
    $total_unidades += $unidades;
}
$stmtDetalle->close();

// ======================
// GENERAR PDF - REPORTE DE DESPACHO
// ======================
class PDF extends FPDF
{
    function Header()
    {
        // Logo Bufalabella
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalabella.jpg", 12, 25, 30);

        // Encabezado del reporte - similar al ejemplo
        $this->SetFont('Helvetica', 'B', 9);
        $this->SetXY(10, 15);
        $this->Cell(35, 5, '', 'LTR', 0, 'C');
        $this->Cell(120, 5, 'SIC SISTEMA INTEGRADO DE CALIDAD', 'LTR', 0, 'C');
        $this->Cell(40, 5, 'HACCP', 1, 1, 'C');

        $this->Cell(35, 5, '', 'LR', 0, 'C');
        $this->Cell(120, 5, '', 'LR', 0, 'C');
        $this->Cell(20, 5, utf8_decode('Página'), 'LTR', 0, 'C');
        $this->Cell(20, 5, utf8_decode('Código'), 'LTR', 1, 'C');

        $this->Cell(35, 5, '', 'LR', 0, 'C');
        $this->Cell(120, 5, utf8_decode('REPORTE DESPACHOS EXPORTACIÓN'), 'LR', 0, 'C');
        $this->Cell(20, 5, utf8_decode('1 de 1'), 'LBR', 0, 'C');
        $this->Cell(20, 5, utf8_decode('R-EXP-004'), 'LBR', 1, 'C');

        $this->Cell(35, 5, '', 'LR', 0, 'C');
        $this->Cell(120, 5, utf8_decode(''), 'LR', 0, 'C');
        $this->Cell(20, 5, utf8_decode('Versión'), 'LTR', 0, 'C');
        $this->Cell(20, 5, utf8_decode('Fecha'), 'LTR', 1, 'C');

        $this->Cell(35, 5, '', 'LBR', 0, 'C');
        $this->Cell(120, 5, utf8_decode(''), 'LBR', 0, 'C');
        $this->Cell(20, 5, utf8_decode('6'), 'LBR', 0, 'C');
        $this->Cell(20, 5, utf8_decode('02/01/2023'), 'LBR', 1, 'C');

        $this->Ln(3);
    }

    function Footer()
    {
        $this->SetY(-45);
        $this->SetFont('Helvetica', '', 9);
        $this->MultiCell(195, 5, utf8_decode('Una vez realizada la operacion, se hace su cierre correspondiente, garantizando el selle del vehiculo a la salida de la compania con precinto de seguridad.'), 'LTR', 'L');
        $this->Cell(195, 12, '', 'LR', 1, 'L');
        $this->Cell(90, 5, 'Firma', 'L', 0, 'R');
        $this->Cell(105, 5, '', 'BR', 1, 'R');
        $this->Cell(195, 5, 'Coordinador de Exportaciones               ', 'LBR', 1, 'R');

        // Agregar imagen de firma
        $firmaPath = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/firma.jpg";
        if (file_exists($firmaPath)) {
            $this->Image($firmaPath, 145, $this->GetY() - 27, 44);
        }

        $this->SetFont('Helvetica', 'I', 8);
        $this->Cell(0, 10, 'Pagina ' . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }
}

$pdf = new PDF('P', 'mm', 'Letter');
$pdf->SetMargins(10, 15, 10);
$pdf->AliasNbPages();
$pdf->AddPage();

// FECHA DE SALIDA
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(35, 5, 'Fecha Salida', 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(55, 5,  $fecha_salida, 1, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(35, 5, 'Factura No.', 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(30, 5,  $numero_factura, 1, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(20, 5, 'Guia', 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(20, 5,  $guia_master, 1, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(35, 5, 'Placa Vehiculo', 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(55, 5,  $placa, 1, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(35, 5, utf8_decode('Tº Producto Terminado'), 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(30, 5,  '', 1, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(20, 5, utf8_decode('# Termógrafo'), 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(20, 5,  'N/A', 1, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(35, 5, 'Hora Inicio Cargue', 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(55, 5,  '', 1, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(35, 5, utf8_decode('Hora Final cargue'), 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(30, 5,  '', 1, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(20, 5, utf8_decode('Destino'), 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(20, 5,  'USA', 1, 1, 'L');

$pdf->SetFont('Helvetica', 'BU', 10);
$pdf->Cell(195, 6, 'Verificacion de Etiquetado Externo Cajas', 0, 1, 'C');

$pdf->SetFont('Helvetica', '', 10);
$pdf->Cell(120, 6, 'Fecha Vencimiento (impresa)  /Total Cajas Enviadas:', 'LTB', 0, 'C');
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(20, 6, round($total_cajas,2), 'TRB', 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(25, 6, 'Total Estibas:', 'LTB', 0, 'R');
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(30, 6, $cantidad_estibas, 'RTB', 1, 'C');

// TABLA DE ITEMS
$pdf->SetFont('Helvetica', 'B', 7);
// Encabezado de la tabla
$pdf->Cell(10, 5, 'Items', 1, 0, 'C');
$pdf->Cell(130, 5, 'Producto', 1, 0, 'C');
$pdf->Cell(15, 5, 'Kilos Netos', 1, 0, 'C');
$pdf->Cell(15, 5, 'Kilos Brutos', 1, 0, 'C');
$pdf->Cell(15, 5, 'Unidades', 1, 0, 'C');
$pdf->Cell(10, 5, 'Cajas', 1, 1, 'C');

$pdf->SetFont('Helvetica', '', 7);
foreach ($detalles as $detalle) {
    $kilos_brutos = $detalle['kilogramos'] * 2.6;

    $pdf->Cell(10, 5, $detalle['item'], 1, 0, 'C');
    $pdf->Cell(130, 5, utf8_decode($detalle['producto']), 1, 0, 'L');
    $pdf->Cell(15, 5, number_format($detalle['kilogramos'], 2), 1, 0, 'R');
    $pdf->Cell(15, 5, number_format($kilos_brutos, 2), 1, 0, 'R');
    $pdf->Cell(15, 5, number_format($detalle['unidades'], 0), 1, 0, 'R');
    $pdf->Cell(10, 5, number_format($detalle['cajas'], 0), 1, 1, 'R');
}

// TOTALES
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(140, 6, 'Totales', 1, 0, 'R');
$pdf->Cell(15, 6, number_format($tot_kgm_netos, 2), 1, 0, 'R');
$pdf->Cell(15, 6, number_format($tot_kgm_brutos, 2), 1, 0, 'R');
$pdf->Cell(15, 6, number_format($total_unidades, 0), 1, 0, 'R');
$pdf->Cell(10, 6, number_format($total_cajas, 0), 1, 1, 'R');

$pdf->SetFont('Helvetica', 'BU', 9);
$pdf->Cell(195, 5, 'PERSONAL INVOLUCRADO (Cto. Frio y/o Carque)', 0, 1, 'C');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(20, 5, 'Firmas:', 'LT', 0, 'L');
$pdf->Cell(120, 5, '', 'TB', 0, 'L');
$pdf->Cell(20, 5, '', 'T', 0, 'L');
$pdf->Cell(35, 5, '', 'TRB', 1, 'L');

$pdf->Cell(20, 5, '', 'L', 0, 'L');
$pdf->Cell(120, 5, '', 'TB', 0, 'L');
$pdf->Cell(20, 5, '', 0, 0, 'L');
$pdf->Cell(35, 5, '', 'TRB', 1, 'L');

$pdf->Cell(20, 5, '', 'L', 0, 'L');
$pdf->Cell(120, 5, '', 'TB', 0, 'L');
$pdf->Cell(20, 5, '', 0, 0, 'L');
$pdf->Cell(35, 5, '', 'TRB', 1, 'L');

$pdf->Cell(195, 3, '', 'LBR', 1, 'L');

$pdf->Ln(3);

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(35, 5, 'Conductor:', 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(55, 5, $conductor, 1, 0, 'L');
$pdf->Cell(105, 5, 'Firma:', 1, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(35, 5, 'Escolta:', 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(55, 5, $ayudante, 1, 0, 'L');
$pdf->Cell(105, 5, 'Firma:', 1, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(35, 5, 'Hora Salida Planta:', 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(55, 5, '', 1, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(52, 5, 'Hora Llegada Aeropuerto:', 1, 0, 'L');
$pdf->Cell(53, 5, '', 1, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(35, 5, 'Precinto No.', 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(55, 5, $precinto, 1, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(105, 5, 'PNC No.', 1, 1, 'L');
$pdf->Cell(195, 7, 'Observaciones:', 1, 1, 'L');
$pdf->Ln(3);

$pdf->Output('I', 'Reporte_Despacho_' . $numero_factura . '.pdf');
