<?php
require_once($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/fpdf/fpdf.php");
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");
error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["error" => "Método no permitido. Usa POST."]));
}

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['id_factura']) || empty($input['id_factura'])) {
    die(json_encode(["error" => "ID de factura no válido."]));
}

$id_factura = intval($input['id_factura']);

// CONSULTA 1: ENCABEZADO DE FACTURA Y DATOS DE PLANILLA (Chile)
$sqlEncabezado = "SELECT
    enc.Id_EncabInvoice AS id_factura,
    CONCAT('FEX-', enc.Id_EncabInvoice) AS numero_factura,
    DATE_FORMAT(enc.Fecha, '%d/%m/%Y') AS fecha_factura,
    cli.Nombre AS Consignatario,
    '' AS DUNS,
    cli.Direccion,
    cli.Telefono,
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
    pl.Placa,
    pl.Precinto,
    pl.TermografoNo,
    cond.Nombre AS Conductor,
    ayud.Nombre AS Ayudante,
    DATE_FORMAT(pl.Fecha, '%d de %M de %Y') AS fecha_salida
FROM EncabInvoiceChile enc
INNER JOIN DetInvoiceChile det ON enc.Id_EncabInvoice = det.Id_EncabInvoice
INNER JOIN ClientesChile cli ON enc.Id_Cliente = cli.Id_Cliente
INNER JOIN Aerolineas aer ON enc.IdAerolinea = aer.IdAerolinea
INNER JOIN Agencias age ON enc.IdAgencia = age.IdAgencia
LEFT JOIN PlanillasChile pl ON enc.Id_Planilla = pl.Id_Planilla
LEFT JOIN Conductores cond ON pl.Id_Conductor = cond.Id_Conductor
LEFT JOIN Conductores ayud ON pl.Id_Ayudante = ayud.Id_Conductor
WHERE enc.Id_EncabInvoice = ?
GROUP BY enc.Id_EncabInvoice";

$stmtEncabezado = $enlace->prepare($sqlEncabezado);
$stmtEncabezado->bind_param("i", $id_factura);
$stmtEncabezado->execute();
$stmtEncabezado->bind_result($id_factura, $numero_factura, $fecha_factura, $consignatario, $duns, $direccion, $telefono, $payment_term, $guia_master, $guia_hija, $aerolinea, $agencia, $termino_negociacion, $cantidad_estibas, $tot_kgm_netos, $tot_kgm_brutos, $total_valor, $placa, $precinto, $termografo_no, $conductor, $ayudante, $fecha_salida);

if (!$stmtEncabezado->fetch()) {
    die(json_encode(["error" => "Factura no encontrada."]));
}
$stmtEncabezado->close();

// CONSULTA 2: DETALLE DE FACTURA
$sqlDetalle = "SELECT
    det.Item,
    det.Codigo_Siesa,
    det.Codigo_FDA,
    det.Kilogramos,
    emb.Cantidad AS Embalaje,
    det.CantidadEmbalaje AS Unidades,
    det.Cajas,
    det.DescripFactura AS Producto,
    prod.DescripProducto AS DescripProducto,
    det.ValKilogramo AS Valor_Kilo,
    ROUND(det.Kilogramos * det.ValKilogramo, 2) AS Valor_Total,
    COALESCE((SELECT PlanVallejo FROM ProductosChile WHERE Codigo_Siesa = det.Codigo_Siesa LIMIT 1), 0) AS PlanVallejo
FROM DetInvoiceChile det
INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
INNER JOIN ProductosChile prod ON det.Codigo_Siesa = prod.Codigo_Siesa
WHERE det.Id_EncabInvoice = ?
ORDER BY det.Item";

$stmtDetalle = $enlace->prepare($sqlDetalle);
$stmtDetalle->bind_param("i", $id_factura);
$stmtDetalle->execute();
$stmtDetalle->bind_result($item, $codigo_siesa, $codigo_fda, $kilogramos, $embalaje, $unidades, $cajas, $producto, $descrip_producto, $valor_kilo, $valor_total, $plan_vallejo);

$detalles = [];
$total_cajas = 0;
$total_unidades = 0;
while ($stmtDetalle->fetch()) {
    $detalles[] = ['item'=>$item,'codigo_siesa'=>$codigo_siesa,'codigo_fda'=>$codigo_fda,'kilogramos'=>$kilogramos,'embalaje'=>$embalaje,'unidades'=>$unidades,'cajas'=>$cajas,'producto'=>$producto,'descrip_producto'=>$descrip_producto,'valor_kilo'=>$valor_kilo,'valor_total'=>$valor_total,'plan_vallejo'=>$plan_vallejo];
    $total_cajas += $cajas;
    $total_unidades += $unidades;
}
$stmtDetalle->close();

class PDF_Chile extends FPDF
{
    function Header()
    {
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalabella.jpg", 12, 25, 30);
        $this->SetFont('Helvetica', 'B', 9);
        $this->SetXY(10, 15);
        $this->Cell(35, 5, '', 'LTR', 0, 'C');
        $this->Cell(120, 5, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', 'SIC SISTEMA INTEGRADO DE CALIDAD'), 'LTR', 0, 'C');
        $this->Cell(40, 5, 'HACCP', 1, 1, 'C');
        $this->Cell(35, 5, '', 'LR', 0, 'C');
        $this->Cell(120, 5, '', 'LR', 0, 'C');
        $this->Cell(20, 5, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', 'Página'), 'LTR', 0, 'C');
        $this->Cell(20, 5, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', 'Código'), 'LTR', 1, 'C');
        $this->Cell(35, 5, '', 'LR', 0, 'C');
        $this->Cell(120, 5, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', 'REPORTE DESPACHOS EXPORTACIÓN'), 'LR', 0, 'C');
        $this->Cell(20, 5, '1 de 1', 'LBR', 0, 'C');
        $this->Cell(20, 5, 'R-EXP-004', 'LBR', 1, 'C');
        $this->Cell(35, 5, '', 'LR', 0, 'C');
        $this->Cell(120, 5, '', 'LR', 0, 'C');
        $this->Cell(20, 5, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', 'Versión'), 'LTR', 0, 'C');
        $this->Cell(20, 5, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', 'Fecha'), 'LTR', 1, 'C');
        $this->Cell(35, 5, '', 'LBR', 0, 'C');
        $this->Cell(120, 5, '', 'LBR', 0, 'C');
        $this->Cell(20, 5, '6', 'LBR', 0, 'C');
        $this->Cell(20, 5, '02/01/2023', 'LBR', 1, 'C');
        $this->Ln(3);
    }
    function Footer()
    {
        $this->SetY(-45);
        $this->SetFont('Helvetica', '', 9);
        $this->MultiCell(195, 5, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', 'Una vez realizada la operacion, se hace su cierre correspondiente, garantizando el selle del vehiculo a la salida de la compania con precinto de seguridad.'), 'LTR', 'L');
        $this->Cell(195, 12, '', 'LR', 1, 'L');
        $this->Cell(90, 5, 'Firma', 'L', 0, 'R');
        $this->Cell(105, 5, '', 'BR', 1, 'R');
        $this->Cell(195, 5, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', 'Coordinador de Exportaciones               '), 'LBR', 1, 'R');
        $firmaPath = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/firma.jpg";
        if (file_exists($firmaPath)) $this->Image($firmaPath, 145, $this->GetY() - 27, 44);
        $this->SetFont('Helvetica', 'I', 8);
        $this->Cell(0, 10, 'Pagina ' . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }
}

$pdf = new PDF_Chile('P', 'mm', 'Letter');
$pdf->SetMargins(10, 15, 10);
$pdf->AliasNbPages();
$pdf->AddPage();

$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(35, 5, 'Fecha Salida', 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(55, 5, $fecha_salida, 1, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(35, 5, 'Factura No.', 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(30, 5, $numero_factura, 1, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(20, 5, 'Guia', 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(20, 5, $guia_master, 1, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(35, 5, 'Placa Vehiculo', 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(55, 5, $placa, 1, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(35, 5, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', 'Tº Producto Terminado'), 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(30, 5, '', 1, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(20, 5, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', '# Termógrafo'), 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(20, 5, $termografo_no ?: 'N/A', 1, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(35, 5, 'Hora Inicio Cargue', 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(55, 5, '', 1, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(35, 5, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', 'Hora Final cargue'), 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(30, 5, '', 1, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(20, 5, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', 'Destino'), 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(20, 5, 'CHILE', 1, 1, 'L');

$pdf->SetFont('Helvetica', 'BU', 10);
$pdf->Cell(195, 6, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', 'Verificacion de Etiquetado Externo Cajas'), 0, 1, 'C');

$pdf->SetFont('Helvetica', '', 10);
$pdf->Cell(120, 6, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', 'Fecha Vencimiento (impresa)  /Total Cajas Enviadas:'), 'LTB', 0, 'C');
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(20, 6, round($total_cajas,2), 'TRB', 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(25, 6, 'Total Estibas:', 'LTB', 0, 'R');
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(30, 6, $cantidad_estibas, 'RTB', 1, 'C');

$pdf->SetFont('Helvetica', 'B', 7);
$pdf->Cell(10, 5, 'Items', 1, 0, 'C');
$pdf->Cell(130, 5, 'Producto', 1, 0, 'C');
$pdf->Cell(15, 5, 'Kilos Netos', 1, 0, 'C');
$pdf->Cell(15, 5, 'Kilos Brutos', 1, 0, 'C');
$pdf->Cell(15, 5, 'Unidades', 1, 0, 'C');
$pdf->Cell(10, 5, 'Cajas', 1, 1, 'C');

$pdf->SetFont('Helvetica', '', 7);
foreach ($detalles as $d) {
    $kb = $d['kilogramos'] * 2.6;
    $pdf->Cell(10, 5, $d['item'], 1, 0, 'C');
    $pdf->Cell(130, 5, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $d['producto']. ' - ' . $d['descrip_producto']), 1, 0, 'L');
    $pdf->Cell(15, 5, number_format($d['kilogramos'], 2), 1, 0, 'R');
    $pdf->Cell(15, 5, number_format($kb, 2), 1, 0, 'R');
    $pdf->Cell(15, 5, number_format($d['unidades'], 0), 1, 0, 'R');
    $pdf->Cell(10, 5, number_format($d['cajas'], 0), 1, 1, 'R');
}

$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(140, 6, 'Totales', 1, 0, 'R');
$pdf->Cell(15, 6, number_format($tot_kgm_netos, 2), 1, 0, 'R');
$pdf->Cell(15, 6, number_format($tot_kgm_brutos, 2), 1, 0, 'R');
$pdf->Cell(15, 6, number_format($total_unidades, 0), 1, 0, 'R');
$pdf->Cell(10, 6, number_format($total_cajas, 0), 1, 1, 'R');

$pdf->SetFont('Helvetica', 'BU', 9);
$pdf->Cell(195, 5, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', 'PERSONAL INVOLUCRADO (Cto. Frio y/o Carque)'), 0, 1, 'C');

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
$pdf->Cell(52, 5, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', 'Hora Llegada Aeropuerto:'), 1, 0, 'L');
$pdf->Cell(53, 5, '', 1, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(35, 5, 'Precinto No.', 1, 0, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(55, 5, $precinto, 1, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(105, 5, 'PNC No.', 1, 1, 'L');
$pdf->Cell(195, 7, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', 'Observaciones:'), 1, 1, 'L');

$pdf->Output('I', 'Reporte_Despacho_Chile_' . $id_factura . '.pdf');
?>
