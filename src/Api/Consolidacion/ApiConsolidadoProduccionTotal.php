<?php
require_once($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/fpdf/fpdf.php");
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
require_once __DIR__ . '/consolidacion_reportes_helper.php';

$enlace->set_charset("utf8mb4");
date_default_timezone_set('America/Bogota');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["error" => "MÃ©todo no permitido. Usa POST."]));
}

$input = json_decode(file_get_contents("php://input"), true);
if (!isset($input['fechaDesde']) || !isset($input['fechaHasta']) || !isset($input['tipoFecha'])) {
    die(json_encode(["error" => "Fechas y campo de fecha son requeridos."]));
}

$fechaInicio = $input['fechaDesde'];
$fechaFin = $input['fechaHasta'];
$campoFechaBD = consolidacion_mapear_campo_fecha($input['tipoFecha']);
$enlace->query("SET lc_time_names = 'es_ES'");

$datosLocal = consolidacion_obtener_produccion_local($enlace, $fechaInicio, $fechaFin, $campoFechaBD);
$datosChile = consolidacion_obtener_produccion_chile($enlace, $fechaInicio, $fechaFin, $campoFechaBD);

class PDFProduccionConsolidado extends FPDF
{
    private $currentFecha = '';
    private $totalesFecha = ['total_cajas' => 0, 'total_tm' => 0, 'total_kgnet' => 0, 'total_estibas' => 0];

    function Header()
    {
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalabella.jpg", 15, 15, 30);
        $this->SetFont('Arial', 'B', 16);
        $this->Cell(0, 10, utf8_decode('PRODUCCION POR DIA - CONSOLIDADO'), 0, 1, 'C');
        $this->SetFont('Arial', 'I', 10);
        global $fechaInicio, $fechaFin;
        $this->Cell(0, 6, utf8_decode('PerÃ­odo: ' . $fechaInicio . ' a ' . $fechaFin), 0, 1, 'C');
        $this->Ln(5);
    }

    function Footer()
    {
        $this->SetY(-15);
        $this->SetFont('Arial', 'I', 8);
        $this->Cell(0, 10, utf8_decode('PÃ¡gina ') . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }

    function agregarEncabezadoSeccion($titulo)
    {
        $this->currentFecha = '';
        $this->totalesFecha = ['total_cajas' => 0, 'total_tm' => 0, 'total_kgnet' => 0, 'total_estibas' => 0];
        if ($this->GetY() > 220) {
            $this->AddPage();
        }
        $this->Ln(6);
        $this->SetFont('Arial', 'B', 13);
        $this->SetFillColor(59, 130, 246);
        $this->SetTextColor(255, 255, 255);
        $this->Cell(0, 9, utf8_decode($titulo), 1, 1, 'C', true);
        $this->SetTextColor(0, 0, 0);
        $this->Ln(3);
    }

    function iniciarNuevaFecha($fecha, $diaSemana)
    {
        if ($this->currentFecha !== '') {
            $this->Ln(10);
        }
        if ($this->GetY() > 200) {
            $this->AddPage();
        }
        $this->currentFecha = $fecha;
        $this->totalesFecha = ['total_cajas' => 0, 'total_tm' => 0, 'total_kgnet' => 0, 'total_estibas' => 0];
        $this->SetFont('Arial', 'B', 12);
        $this->SetFillColor(200, 200, 200);
        $this->Cell(0, 8, utf8_decode("Fecha: $fecha - $diaSemana"), 1, 1, 'C', true);
        $this->Ln(2);
    }

    function agregarEncabezadoColumnas()
    {
        $this->SetFont('Arial', 'B', 9);
        $this->SetFillColor(180, 180, 180);
        $altura = 12;
        $this->agregarCeldaDosLineas(17, $altura, 'CODIGO', 'SIESA');
        $this->Cell(79, $altura, utf8_decode('DESCRIPCIÃ“N'), 1, 0, 'C', true);
        $this->agregarCeldaDosLineas(33, $altura, 'UNDS', 'TERMOFORMADOS');
        $this->Cell(13, $altura, utf8_decode('CAJAS'), 1, 0, 'C', true);
        $this->agregarCeldaDosLineas(24, $altura, 'KG', 'ESCURRIDOS');
        $this->agregarCeldaDosLineas(20, $altura, 'TOTAL', "PALLET'S");
        $this->Ln($altura);
    }

    function agregarCeldaDosLineas($ancho, $altura, $linea1, $linea2)
    {
        $x = $this->GetX();
        $y = $this->GetY();
        $this->Rect($x, $y, $ancho, $altura, 'DF');
        $this->SetXY($x, $y + 2);
        $this->Cell($ancho, 4, utf8_decode($linea1), 0, 2, 'C');
        $this->Cell($ancho, 4, utf8_decode($linea2), 0, 0, 'C');
        $this->SetXY($x + $ancho, $y);
    }

    function agregarProducto($producto)
    {
        if ($this->GetY() > 250) {
            $this->AddPage();
            $this->agregarEncabezadoColumnas();
        }
        if ($this->totalesFecha['total_cajas'] == 0) {
            $this->agregarEncabezadoColumnas();
        }
        $this->SetFont('Arial', '', 8);
        $this->Cell(17, 6, utf8_decode($producto['Codigo_Siesa']), 1);
        $this->Cell(79, 6, utf8_decode($producto['Descripcion']), 1);
        $this->Cell(33, 6, number_format($producto['TotalTM'], 0), 1, 0, 'R');
        $this->Cell(13, 6, number_format($producto['Cajas'], 0), 1, 0, 'R');
        $this->Cell(24, 6, number_format($producto['KgNet'], 2), 1, 0, 'R');
        $this->Cell(20, 6, number_format($producto['CantidadEstibas'], 2), 1, 1, 'R');
        $this->totalesFecha['total_cajas'] += $producto['Cajas'];
        $this->totalesFecha['total_tm'] += $producto['TotalTM'];
        $this->totalesFecha['total_kgnet'] += $producto['KgNet'];
        $this->totalesFecha['total_estibas'] += $producto['CantidadEstibas'];
    }

    function agregarTotalesFecha()
    {
        $this->SetFont('Arial', 'B', 9);
        $this->SetFillColor(220, 220, 220);
        $this->Cell(96, 8, 'TOTALES:', 1, 0, 'R', true);
        $this->Cell(33, 8, number_format($this->totalesFecha['total_tm'], 0), 1, 0, 'R', true);
        $this->Cell(13, 8, number_format($this->totalesFecha['total_cajas'], 0), 1, 0, 'R', true);
        $this->Cell(24, 8, number_format($this->totalesFecha['total_kgnet'], 2), 1, 0, 'R', true);
        $this->Cell(20, 8, number_format($this->totalesFecha['total_estibas'], 2), 1, 1, 'R', true);
        $this->Ln(5);
    }
}

$pdf = new PDFProduccionConsolidado('P', 'mm', 'Letter');
$pdf->SetMargins(15, 15, 15);
$pdf->AliasNbPages();
$pdf->AddPage();

if (!empty($datosLocal)) {
    $pdf->agregarEncabezadoSeccion('PEDIDOS LOCALES (NORMALES + SAMPLES)');
    foreach ($datosLocal as $fecha => $datosFecha) {
        $pdf->iniciarNuevaFecha($fecha, $datosFecha['dia_semana']);
        foreach ($datosFecha['productos'] as $producto) {
            $pdf->agregarProducto($producto);
        }
        $pdf->agregarTotalesFecha();
    }
}

if (!empty($datosChile)) {
    if ($pdf->GetY() > 180) {
        $pdf->AddPage();
    }
    $pdf->agregarEncabezadoSeccion('PEDIDOS CHILE');
    foreach ($datosChile as $fecha => $datosFecha) {
        $pdf->iniciarNuevaFecha($fecha, $datosFecha['dia_semana']);
        foreach ($datosFecha['productos'] as $producto) {
            $pdf->agregarProducto($producto);
        }
        $pdf->agregarTotalesFecha();
    }
}

if (empty($datosLocal) && empty($datosChile)) {
    $pdf->SetFont('Arial', 'B', 12);
    $pdf->Cell(0, 10, utf8_decode('No se encontraron datos para el perÃ­odo seleccionado.'), 0, 1, 'C');
}

$nombreArchivo = 'Produccion_Consolidado_' . date('Y-m-d_His') . '.pdf';
$pdf->Output('I', $nombreArchivo);
