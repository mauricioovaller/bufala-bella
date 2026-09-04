<?php
require_once($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/fpdf/fpdf.php");
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
require_once __DIR__ . '/consolidacion_reportes_helper.php';

$enlace->set_charset("utf8mb4");
date_default_timezone_set('America/Bogota');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["error" => "Método no permitido. Usa POST."]));
}

$input = json_decode(file_get_contents("php://input"), true);
if (!isset($input['fechaDesde']) || !isset($input['fechaHasta']) || !isset($input['tipoFecha'])) {
    die(json_encode(["error" => "Fechas y campo de fecha son requeridos."]));
}

$fechaInicio = $input['fechaDesde'];
$fechaFin = $input['fechaHasta'];
$campoFechaBD = consolidacion_mapear_campo_fecha($input['tipoFecha']);
$enlace->query("SET lc_time_names = 'es_ES'");

$datosLocal = consolidacion_obtener_transporte_local($enlace, $fechaInicio, $fechaFin, $campoFechaBD);
$datosChile = consolidacion_obtener_transporte_chile($enlace, $fechaInicio, $fechaFin, $campoFechaBD);

class PDFTransporteConsolidado extends FPDF
{
    private $totalCajas = 0;
    private $totalPesoNeto = 0;
    private $totalPesoBruto = 0;
    private $totalEstibas = 0;
    private $totalEstibasPagas = 0;
    private $totalCostoTransporte = 0;
    private $globalCajas = 0;
    private $globalPesoNeto = 0;
    private $globalPesoBruto = 0;
    private $globalEstibas = 0;
    private $globalEstibasPagas = 0;
    private $globalCostoTransporte = 0;

    function Header()
    {
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalabella.jpg", 10, 10, 10);
        $this->SetFont('Arial', 'B', 16);
        $this->Cell(0, 10, utf8_decode('TRANSPORTE POR DIA - CONSOLIDADO'), 0, 1, 'C');
        $this->SetFont('Arial', 'B', 10);
        $this->Cell(0, 6, utf8_decode('DETALLE POR GUIA MASTER / HIJA'), 0, 1, 'C');
        $this->SetFont('Arial', 'I', 10);
        global $fechaInicio, $fechaFin;
        $this->Cell(0, 6, utf8_decode('Período: ' . $fechaInicio . ' a ' . $fechaFin), 0, 1, 'C');
        $this->Ln(5);
    }

    function Footer()
    {
        $this->SetY(-15);
        $this->SetFont('Arial', 'I', 8);
        $this->Cell(0, 10, utf8_decode('Página ') . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }

    function agregarEncabezadoSeccion($titulo)
    {
        $this->totalCajas = 0;
        $this->totalPesoNeto = 0;
        $this->totalPesoBruto = 0;
        $this->totalEstibas = 0;
        $this->totalEstibasPagas = 0;
        $this->totalCostoTransporte = 0;
        if ($this->GetY() > 230) {
            $this->AddPage();
        }
        $this->Ln(6);
        $this->SetFont('Arial', 'B', 13);
        $this->SetFillColor(59, 130, 246);
        $this->SetTextColor(255, 255, 255);
        $this->Cell(0, 9, utf8_decode($titulo), 1, 1, 'C', true);
        $this->SetTextColor(0, 0, 0);
        $this->Ln(3);
        $this->agregarEncabezadoColumnas();
    }

    function agregarEncabezadoColumnas()
    {
        $this->SetFont('Arial', 'B', 6.5);
        $this->SetFillColor(180, 180, 180);
        $startX = $this->GetX();
        $startY = $this->GetY();
        $this->Cell(40, 8, utf8_decode('FECHA'), 1, 0, 'C', true);
        $this->SetXY($startX + 40, $startY);
        $this->MultiCell(17, 4, utf8_decode('CANTIDAD' . "\n" . 'CAJAS'), 1, 'C', true);
        $this->SetXY($startX + 57, $startY);
        $this->MultiCell(20, 4, utf8_decode('PESO NETO' . "\n" . '(KG)'), 1, 'C', true);
        $this->SetXY($startX + 77, $startY);
        $this->MultiCell(22, 4, utf8_decode('PESO BRUTO' . "\n" . '(KG)'), 1, 'C', true);
        $this->SetXY($startX + 99, $startY);
        $this->MultiCell(22, 4, utf8_decode('GUIA' . "\n" . 'MASTER'), 1, 'C', true);
        $this->SetXY($startX + 121, $startY);
        $this->MultiCell(22, 4, utf8_decode('GUIA' . "\n" . 'HIJA'), 1, 'C', true);
        $this->SetXY($startX + 143, $startY);
        $this->Cell(14, 8, utf8_decode('PALLETS'), 1, 0, 'C', true);
        $this->SetXY($startX + 157, $startY);
        $this->MultiCell(14, 4, utf8_decode('PALLETS' . "\n" . 'PAGAS'), 1, 'C', true);
        $this->SetXY($startX + 171, $startY);
        $this->MultiCell(18, 4, utf8_decode('COSTO' . "\n" . 'TRANSPORTE'), 1, 'C', true);
        $this->SetXY($startX + 189, $startY);
        $this->Cell(22, 8, utf8_decode('FACTURAS'), 1, 0, 'C', true);
        $this->SetXY($startX + 211, $startY);
        $this->Cell(18, 8, utf8_decode('PRECINTO'), 1, 1, 'C', true);
    }

    function agregarFila($dato)
    {
        if ($this->GetY() > 250) {
            $this->AddPage();
            $this->agregarEncabezadoColumnas();
        }
        $this->SetFont('Arial', '', 7);
        $this->Cell(40, 7, utf8_decode($dato['FechaCompleta']), 1);
        $this->Cell(17, 7, number_format($dato['CantidadCajas'], 0), 1, 0, 'R');
        $this->Cell(20, 7, number_format($dato['PesoNeto'], 2), 1, 0, 'R');
        $this->Cell(22, 7, number_format($dato['PesoBruto'], 2), 1, 0, 'R');
        $this->Cell(22, 7, utf8_decode($dato['GuiaMaster']), 1, 0, 'C');
        $this->Cell(22, 7, utf8_decode($dato['GuiaHija']), 1, 0, 'C');
        $this->Cell(14, 7, number_format((float)$dato['CantidadEstibas'], 0), 1, 0, 'R');
        $this->Cell(14, 7, number_format((float)$dato['CantidadEstibasPagas'], 0), 1, 0, 'R');
        $this->Cell(18, 7, number_format((float)$dato['CostoTransporte'], 0), 1, 0, 'R');
        $this->Cell(22, 7, utf8_decode($dato['Facturas']), 1, 0, 'C');
        $this->Cell(18, 7, utf8_decode($dato['Precintos']), 1, 1, 'C');
        $this->totalCajas += $dato['CantidadCajas'];
        $this->totalPesoNeto += $dato['PesoNeto'];
        $this->totalPesoBruto += $dato['PesoBruto'];
        $this->totalEstibas += (float)$dato['CantidadEstibas'];
        $this->totalEstibasPagas += (float)$dato['CantidadEstibasPagas'];
        $this->totalCostoTransporte += (float)$dato['CostoTransporte'];
        $this->globalCajas += $dato['CantidadCajas'];
        $this->globalPesoNeto += $dato['PesoNeto'];
        $this->globalPesoBruto += $dato['PesoBruto'];
        $this->globalEstibas += (float)$dato['CantidadEstibas'];
        $this->globalEstibasPagas += (float)$dato['CantidadEstibasPagas'];
        $this->globalCostoTransporte += (float)$dato['CostoTransporte'];
    }

    function agregarTotales()
    {
        $this->SetFont('Arial', 'B', 7);
        $this->SetFillColor(220, 220, 220);
        $this->Cell(40, 8, 'TOTALES:', 1, 0, 'R', true);
        $this->Cell(17, 8, number_format($this->totalCajas, 0), 1, 0, 'R', true);
        $this->Cell(20, 8, number_format($this->totalPesoNeto, 2), 1, 0, 'R', true);
        $this->Cell(22, 8, number_format($this->totalPesoBruto, 2), 1, 0, 'R', true);
        $this->Cell(22, 8, '', 1, 0, 'R', true);
        $this->Cell(22, 8, '', 1, 0, 'R', true);
        $this->Cell(14, 8, number_format($this->totalEstibas, 0), 1, 0, 'R', true);
        $this->Cell(14, 8, number_format($this->totalEstibasPagas, 0), 1, 0, 'R', true);
        $this->Cell(18, 8, number_format($this->totalCostoTransporte, 0), 1, 0, 'R', true);
        $this->Cell(22, 8, '', 1, 0, 'R', true);
        $this->Cell(18, 8, '', 1, 1, 'R', true);
    }

    function agregarTotalesConsolidado()
    {
        $this->Ln(3);
        $this->SetFont('Arial', 'B', 7);
        $this->SetFillColor(191, 219, 254);
        $this->Cell(40, 8, utf8_decode('TOTAL CONSOLIDADO:'), 1, 0, 'R', true);
        $this->Cell(17, 8, number_format($this->globalCajas, 0), 1, 0, 'R', true);
        $this->Cell(20, 8, number_format($this->globalPesoNeto, 2), 1, 0, 'R', true);
        $this->Cell(22, 8, number_format($this->globalPesoBruto, 2), 1, 0, 'R', true);
        $this->Cell(22, 8, '', 1, 0, 'R', true);
        $this->Cell(22, 8, '', 1, 0, 'R', true);
        $this->Cell(14, 8, number_format($this->globalEstibas, 0), 1, 0, 'R', true);
        $this->Cell(14, 8, number_format($this->globalEstibasPagas, 0), 1, 0, 'R', true);
        $this->Cell(18, 8, number_format($this->globalCostoTransporte, 0), 1, 0, 'R', true);
        $this->Cell(22, 8, '', 1, 0, 'R', true);
        $this->Cell(18, 8, '', 1, 1, 'R', true);
    }
}

$pdf = new PDFTransporteConsolidado('L', 'mm', 'Letter');
$pdf->SetMargins(15, 15, 15);
$pdf->AliasNbPages();
$pdf->AddPage();

if (!empty($datosLocal)) {
    $pdf->agregarEncabezadoSeccion('PEDIDOS LOCALES (NORMALES + SAMPLES)');
    foreach ($datosLocal as $dato) {
        $pdf->agregarFila($dato);
    }
    $pdf->agregarTotales();
}

if (!empty($datosChile)) {
    if ($pdf->GetY() > 220) {
        $pdf->AddPage();
    }
    $pdf->agregarEncabezadoSeccion('PEDIDOS CHILE');
    foreach ($datosChile as $dato) {
        $pdf->agregarFila($dato);
    }
    $pdf->agregarTotales();
}

if (!empty($datosLocal) || !empty($datosChile)) {
    $pdf->agregarTotalesConsolidado();
}

if (empty($datosLocal) && empty($datosChile)) {
    $pdf->SetFont('Arial', 'B', 12);
    $pdf->Cell(0, 10, utf8_decode('No se encontraron datos para el período seleccionado.'), 0, 1, 'C');
}

$nombreArchivo = 'Transporte_Consolidado_' . date('Y-m-d_His') . '.pdf';
$pdf->Output('I', $nombreArchivo);
