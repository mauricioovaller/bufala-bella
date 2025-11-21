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
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalabella.jpg", 15, 10, 40);

        // Encabezado del reporte - similar al ejemplo
        $this->SetFont('Helvetica', 'B', 12);
        $this->SetXY(60, 12);
        $this->Cell(80, 6, 'SIC SISTEMA INTEGRADO DE CALIDAD', 0, 1, 'C');
        $this->Cell(80, 6, 'SIC SISTEMA INTEGRADO DE CALIDAD', 0, 1, 'C');
        
        $this->SetFont('Helvetica', 'B', 14);
        $this->SetX(60);
        $this->Cell(80, 8, 'REPORTE DESPACHOS EXPORTACION', 0, 1, 'C');
        
        $this->SetFont('Helvetica', '', 9);
        $this->SetX(60);
        $this->Cell(80, 5, 'HACCP', 0, 0, 'C');
        $this->SetX(140);
        $this->Cell(40, 5, 'Pagina 1 de 1', 0, 1, 'R');
        
        $this->SetX(60);
        $this->Cell(80, 5, 'Codigo R-EXP-004', 0, 0, 'C');
        $this->SetX(140);
        $this->Cell(40, 5, 'Version 6', 0, 0, 'R');
        $this->SetX(170);
        $this->Cell(30, 5, 'Fecha 02/01/2023', 0, 1, 'R');

        $this->Ln(5);
    }

    function Footer()
    {
        $this->SetY(-15);
        $this->SetFont('Helvetica', 'I', 8);
        $this->Cell(0, 10, 'Pagina ' . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }
}

$pdf = new PDF('P', 'mm', 'Letter');
$pdf->SetMargins(15, 15, 15);
$pdf->AliasNbPages();
$pdf->AddPage();

// FECHA DE SALIDA
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(40, 6, 'Fecha Salida', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 10);
$pdf->Cell(50, 6, $fecha_salida, 0, 1, 'L');

$pdf->Ln(2);

// TABLA DE INFORMACIÓN DE TRANSPORTE
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(25, 6, 'Fax', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(30, 6, 'Fax No.', 0, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(25, 6, 'Guia', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(40, 6, $guia_master, 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(25, 6, 'Placa Vehiculo', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(30, 6, $placa, 0, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(25, 6, 'Tº Producto Terminado', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(40, 6, 'N/A', 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(25, 6, 'Hora Inicio Carque', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(30, 6, '', 0, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(25, 6, 'Hora Final Carque', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(30, 6, '', 0, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(15, 6, 'Destino', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(20, 6, 'USA', 0, 1, 'L');

$pdf->Ln(5);

// VERIFICACIÓN DE ETIQUETADO
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(90, 6, 'Verificacion de Etiquetado Externo Cajas', 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(60, 6, 'Fecha Vencimiento (impresa) / Total Cajas Enviadas:', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(20, 6, $total_cajas, 0, 0, 'R');
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(25, 6, 'Total Estibas:', 0, 0, 'R');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(15, 6, $cantidad_estibas, 0, 1, 'R');

$pdf->Ln(2);

// TABLA DE ITEMS
$pdf->SetFont('Helvetica', 'B', 7);
// Encabezado de la tabla
$pdf->Cell(10, 6, 'Items', 1, 0, 'C');
$pdf->Cell(50, 6, 'Producto', 1, 0, 'C');
$pdf->Cell(20, 6, 'Kilos Netos', 1, 0, 'C');
$pdf->Cell(20, 6, 'Kilos Brutos', 1, 0, 'C');
$pdf->Cell(20, 6, 'Unidades', 1, 0, 'C');
$pdf->Cell(15, 6, 'Cajas', 1, 1, 'C');

$pdf->SetFont('Helvetica', '', 7);
foreach ($detalles as $detalle) {
    $kilos_brutos = $detalle['kilogramos'] * 2.6;
    
    $pdf->Cell(10, 6, $detalle['item'], 1, 0, 'C');
    $pdf->Cell(50, 6, substr($detalle['producto'], 0, 35), 1, 0, 'L');
    $pdf->Cell(20, 6, number_format($detalle['kilogramos'], 2), 1, 0, 'R');
    $pdf->Cell(20, 6, number_format($kilos_brutos, 2), 1, 0, 'R');
    $pdf->Cell(20, 6, number_format($detalle['unidades'], 0), 1, 0, 'R');
    $pdf->Cell(15, 6, number_format($detalle['cajas'], 0), 1, 1, 'R');
}

// TOTALES
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(60, 6, 'TOTAL', 1, 0, 'R');
$pdf->Cell(20, 6, number_format($tot_kgm_netos, 2), 1, 0, 'R');
$pdf->Cell(20, 6, number_format($tot_kgm_brutos, 2), 1, 0, 'R');
$pdf->Cell(20, 6, number_format($total_unidades, 0), 1, 0, 'R');
$pdf->Cell(15, 6, number_format($total_cajas, 0), 1, 1, 'R');

$pdf->Ln(8);

// PERSONAL INVOLUCRADO
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(40, 6, 'PERSONAL INVOLUCRADO (Cto. Frio y/o Carque)', 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(25, 6, 'Firma:', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(50, 6, $conductor, 0, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(20, 6, 'Firma:', 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(25, 6, 'Escolta:', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(50, 6, $ayudante, 0, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(20, 6, 'Firma:', 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(35, 6, 'Hora Salida Planta', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(30, 6, '', 0, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(35, 6, 'Hora Llegada Aeropuerto:', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(30, 6, '', 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(25, 6, 'Precinto No.', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(30, 6, $precinto, 0, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(25, 6, 'PMC No.', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(30, 6, '', 0, 1, 'L');

$pdf->Ln(5);

// OBSERVACIONES
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(25, 6, 'Observaciones:', 0, 1, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->MultiCell(0, 5, 'Una vez realizada la operacion, se hace su cierre correspondiente, garantizando el selle del vehiculo a la salida de la compania con precinto de seguridad.');

$pdf->Output('I', 'Reporte_Despacho_' . $numero_factura . '.pdf');