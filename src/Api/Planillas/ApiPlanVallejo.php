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

// 🔴 CONSULTA 1: ENCABEZADO DE FACTURA Y DATOS PARA PLAN VALLEJO
$sqlEncabezado = "SELECT
                    enc.Id_EncabInvoice AS id_factura,
                    CONCAT('FEX-', enc.Id_EncabInvoice) AS numero_factura,
                    enc.CantidadEstibas,
                    ROUND(SUM(det.Kilogramos), 2) AS tot_kgm_netos_factura,
                    -- DATOS DE PLANILLA PARA PLACA
                    pl.Placa
                FROM
                    EncabInvoice enc
                INNER JOIN DetInvoice det ON enc.Id_EncabInvoice = det.Id_EncabInvoice
                LEFT JOIN Planillas pl ON enc.Id_Planilla = pl.Id_Planilla
                WHERE
                    enc.Id_EncabInvoice = ?
                GROUP BY 
                    enc.Id_EncabInvoice, enc.CantidadEstibas, pl.Placa";

$stmtEncabezado = $enlace->prepare($sqlEncabezado);
$stmtEncabezado->bind_param("i", $id_factura);
$stmtEncabezado->execute();
$stmtEncabezado->bind_result(
    $id_factura,
    $numero_factura,
    $cantidad_estibas,
    $tot_kgm_netos_factura,
    $placa
);

if (!$stmtEncabezado->fetch()) {
    die(json_encode(["error" => "Factura no encontrada."]));
}
$stmtEncabezado->close();

// 🔴 CONSULTA 2: DETALLE DE PRODUCTOS CON PLAN VALLEJO
$sqlDetalle = "SELECT
                det.Item,
                prd.CodigoCIP,
                CONCAT('JUEGO BASE Y TAPA ', prd.DescripPlanVallejo) AS Producto,
                det.CantidadEmbalaje AS Unidades,
                det.Kilogramos,
                det.Cajas
            FROM
                DetInvoice det
            INNER JOIN Productos prd ON det.Codigo_Siesa = prd.Codigo_Siesa
            WHERE
                det.Id_EncabInvoice = ?
                AND prd.PlanVallejo <> 0
            ORDER BY det.Item";

$stmtDetalle = $enlace->prepare($sqlDetalle);
$stmtDetalle->bind_param("i", $id_factura);
$stmtDetalle->execute();
$stmtDetalle->bind_result(
    $item,
    $codigo_cip,
    $producto,
    $unidades,
    $kilogramos,
    $cajas
);

$detalles = [];
$total_unidades_plan_vallejo = 0;
$total_kilos_plan_vallejo = 0;
while ($stmtDetalle->fetch()) {
    $detalles[] = [
        'item' => $item,
        'codigo_cip' => $codigo_cip,
        'producto' => $producto,
        'unidades' => $unidades,
        'kilogramos' => $kilogramos,
        'cajas' => $cajas,
    ];
    $total_unidades_plan_vallejo += $unidades;
    $total_kilos_plan_vallejo += $kilogramos;
}
$stmtDetalle->close();

// CÁLCULOS
$kilos_netos_sin_plan_vallejo = $tot_kgm_netos_factura - $total_kilos_plan_vallejo;
$kilos_brutos_sin_plan_vallejo = $kilos_netos_sin_plan_vallejo * 2.4;
$piezas_bt = $cantidad_estibas - 1;

// ======================
// GENERAR PDF - PLAN VALLEJO
// ======================
class PDF extends FPDF
{
    function Header()
    {
        // Logo Bufalabella
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalabella.jpg", 15, 10, 70);

        // Información de la empresa
        $this->SetFont('Helvetica', 'B', 14);
        $this->SetXY(0, 40);
        $this->Cell(190, 4, 'CUADRO INSUMO PRODUCTO', 0, 1, 'C');       

        $this->Ln(10);
    }

    function Footer()
    {
        $this->SetY(-15);
        $this->SetFont('Helvetica', 'I', 8);
        $this->Cell(0, 10, 'Pagina ' . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }
}

$pdf = new PDF('P', 'mm', 'Letter');
$pdf->SetMargins(10, 15, 10);
$pdf->AliasNbPages();
$pdf->AddPage();



// INFORMACIÓN DE FACTURA
$pdf->SetFont('Helvetica', 'B', 12);
$pdf->Cell(40, 6, 'FACTURA No. ' , 0, 0, 'L');
$pdf->Cell(100, 6,  $numero_factura, 0, 1, 'L');
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(40, 6, 'CODIGO MP: ', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 10);
$pdf->Cell(100, 6, 'MP3488', 0, 1, 'L');
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(40, 6, 'MP IMPORTADA: ', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 10);
$pdf->Cell(100, 6, utf8_decode('MATERIAL DE EMPAQUE PARA EXPORTACIÓN DE QUESO MOZZARELLA'), 0, 1, 'L');
$pdf->Cell(40, 6, '', 0, 0, 'L');
$pdf->Cell(100, 6, 'MOZZARELA BUFFALO BURRATA - CILIEGINE INFUSION - RICOTTA', 0, 1, 'L');
$pdf->Cell(40, 6, '', 0, 0, 'L');
$pdf->Cell(100, 6, 'MOZZARELA BUFFALO ORGANIC ( CILIEGINE - BOCCONCINI - OVOLINE)', 0, 1, 'L');

$pdf->Ln(2);

$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(40, 6, 'UNIDAD COMERCIAL:', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 10);
$pdf->Cell(100, 6, 'BASE Y TAPA', 0, 1, 'L');
$pdf->Ln(5);

// TABLA DE PRODUCTOS
$pdf->SetFont('Helvetica', 'B', 8);
// Encabezado de la tabla
$pdf->Cell(20, 8, 'CIP#', 1, 0, 'C');
$pdf->Cell(100, 8, 'PRODUCTO', 1, 0, 'C');
$pdf->Cell(20, 8, 'UNIDAD', 1, 0, 'C');
$pdf->Cell(25, 8, 'KILOS NETOS', 1, 0, 'C');
$pdf->Cell(30, 8, 'LINEA EN FACTURA', 1, 1, 'C');

$pdf->SetFont('Helvetica', '', 8);
foreach ($detalles as $detalle) {
    $pdf->Cell(20, 6, $detalle['codigo_cip'], 1, 0, 'C');
    $pdf->Cell(100, 6, utf8_decode($detalle['producto']), 1, 0, 'L');
    $pdf->Cell(20, 6, number_format($detalle['unidades'], 0), 1, 0, 'R');
    $pdf->Cell(25, 6, number_format($detalle['kilogramos'], 2), 1, 0, 'R');
    $pdf->Cell(30, 6, $detalle['item'], 1, 1, 'C');
}

// TOTALES
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(120, 6, 'TOTAL', 1, 0, 'R');
$pdf->Cell(20, 6, number_format($total_unidades_plan_vallejo, 0), 1, 0, 'R');
$pdf->Cell(25, 6, number_format($total_kilos_plan_vallejo, 2), 1, 0, 'R');
$pdf->Cell(30, 6, '', 1, 1, 'C');

$pdf->Ln(8);

// INFORMACIÓN ADICIONAL
$pdf->SetTextColor(255, 0, 0);  // Rojo (R, G, B)
$pdf->SetFont('Helvetica', 'BU', 10);
$pdf->Cell(195, 6, 'POR FAVOR ELABORAR DOCUMENTO APARTE SIN PLAN VALLEJO', 'LTR', 1, 'C');

$pdf->SetTextColor(0, 0, 0);  // Negro
$pdf->SetFont('Helvetica', '', 10);
$pdf->Cell(20, 6, number_format($kilos_netos_sin_plan_vallejo, 2) , 'LB', 0, 'R');
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(100, 6, 'KILOS NETOS' , 'B', 0, 'L');
$pdf->Cell(20, 6, number_format($kilos_brutos_sin_plan_vallejo, 2) , 'B', 0, 'R');
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(55, 6, 'KILOS BRUTOS' , 'RB', 1, 'L');

$pdf->SetTextColor(255, 0, 0);  // Rojo (R, G, B)
$pdf->SetFont('Helvetica', 'BU', 10);
$pdf->Cell(140, 6, 'PARA EL DOCUMENTO DE SIN PLAN VALLEJO COLOCAR PIEZAS (BT) ' , 'LB', 0, 'R');
$pdf->SetTextColor(0, 0, 0);  // Negro
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(55, 6,  $piezas_bt, 'RB', 1, 'C');

$pdf->Ln(5);

$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(195, 6, 'PLACA VEHICULO', 'LTR', 1, 'L');
$pdf->Cell(195, 6, $placa ?: 'NO ASIGNADA', 'LRB', 1, 'L');

$pdf->Output('I', 'Plan_Vallejo_' . $numero_factura . '.pdf');
?>