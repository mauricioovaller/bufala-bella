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

// Verificar parámetros
if (!isset($input['fechaDesde']) || !isset($input['fechaHasta']) || !isset($input['tipoFecha'])) {
    die(json_encode(["error" => "Fechas y campo de fecha son requeridos."]));
}

$fechaInicio = $input['fechaDesde'];
$fechaFin = $input['fechaHasta'];
$campoFecha = $input['tipoFecha'];

// Establecer idioma para días de la semana en español
$enlace->query("SET lc_time_names = 'es_ES'");

// CONSULTA UNIFICADA - COMBINA DATOS DE TABLAS NORMALES Y SAMPLE
$sql = "SELECT
    DATE_FORMAT(enc.FechaSalida, '%W, %e de %M de %Y') AS FechaCompleta,
    DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaCorta,
    SUM(det.Cantidad) AS CantidadCajas,
    ROUND(SUM(det.Cantidad * emb.Cantidad * prd.PesoGr / 1000), 2) AS PesoNeto,
    '19:00:00' AS HoraCargue,  -- Hora por defecto
    'Normal' AS TipoDato  -- Identificador para datos normales
FROM EncabPedido enc
INNER JOIN DetPedido det ON enc.Id_EncabPedido = det.Id_EncabPedido   
INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
WHERE enc.{$campoFecha} BETWEEN ? AND ?
GROUP BY enc.{$campoFecha}

UNION ALL

SELECT
    DATE_FORMAT(enc.FechaSalida, '%W, %e de %M de %Y') AS FechaCompleta,
    DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaCorta,
    SUM(det.Cantidad) AS CantidadCajas,
    ROUND(SUM(det.Cantidad * emb.Cantidad * prd.PesoGr / 1000), 2) AS PesoNeto,
    '19:00:00' AS HoraCargue,  -- Hora por defecto
    'Sample' AS TipoDato  -- Identificador para datos sample
FROM EncabPedidoSample enc
INNER JOIN DetPedidoSample det ON enc.Id_EncabPedido = det.Id_EncabPedido   
INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
WHERE enc.{$campoFecha} BETWEEN ? AND ?
GROUP BY enc.{$campoFecha}

-- Agrupar por fecha para consolidar ambos tipos de datos
ORDER BY FechaCorta ASC;";

$stmt = $enlace->prepare($sql);
$stmt->bind_param("ssss", $fechaInicio, $fechaFin, $fechaInicio, $fechaFin);
$stmt->execute();

// Bind de resultados
$stmt->bind_result(
    $fechaCompleta,
    $fechaCorta,
    $cantidadCajas,
    $pesoNeto,
    $horaCargue,
    $tipoDato
);

// Obtener todos los datos y consolidar por fecha
$datosConsolidados = [];
$totalCajas = 0;
$totalPesoNeto = 0;

while ($stmt->fetch()) {
        
    // 👇 CORRECCIÓN: Usar FechaCorta como clave única para evitar problemas de formato
    $claveUnica = $fechaCorta;

    // Si ya existe esta fecha, sumamos los valores
    if (isset($datosConsolidados[$claveUnica])) {
        $datosConsolidados[$claveUnica]['CantidadCajas'] += $cantidadCajas;
        $datosConsolidados[$claveUnica]['PesoNeto'] += $pesoNeto;
    } else {
        // Si no existe, creamos el registro
        $datosConsolidados[$claveUnica] = [
            'FechaCompleta' => $fechaCompleta,
            'FechaCorta' => $fechaCorta,
            'CantidadCajas' => $cantidadCajas,
            'PesoNeto' => $pesoNeto,
            'HoraCargue' => $horaCargue
        ];
    }
    
    $totalCajas += $cantidadCajas;
    $totalPesoNeto += $pesoNeto;
}


$stmt->close();

// Convertir el array asociativo a indexado para facilitar el uso
$datosTransporte = array_values($datosConsolidados);

// ======================
// CLASE PDF PARA REPORTE DE TRANSPORTE
// ======================
class PDFTransporte extends FPDF
{
    private $totalCajas = 0;
    private $totalPesoNeto = 0;

    function Header()
    {
        // Logo
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalabella.jpg", 15, 15, 30);
        
        // Título principal
        $this->SetFont('Arial', 'B', 16);
        $this->Cell(0, 10, utf8_decode('TRANSPORTE POR DÍA'), 0, 1, 'C');
        
        // Información del rango de fechas
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

    function agregarEncabezadoColumnas()
    {
        $this->SetFont('Arial', 'B', 10);
        $this->SetFillColor(180, 180, 180);
        
        $this->Cell(80, 8, utf8_decode('FECHA'), 1, 0, 'C', true);
        $this->Cell(40, 8, utf8_decode('CANTIDAD CAJAS'), 1, 0, 'C', true);
        $this->Cell(40, 8, utf8_decode('PESO NETO (KG)'), 1, 0, 'C', true);
        $this->Cell(40, 8, utf8_decode('HORA EST. CARGUE'), 1, 1, 'C', true);
    }

    function agregarFila($fecha, $cajas, $pesoNeto, $horaCargue)
    {
        // DEBUG: Ver qué fila se está agregando
        error_log("PDF TRANSPORTE - Agregando: $fecha - $cajas cajas - $pesoNeto kg");
        
        // Verificar si necesita nueva página
        if ($this->GetY() > 250) {
            $this->AddPage();
            $this->agregarEncabezadoColumnas();
        }

        $this->SetFont('Arial', '', 9);
        
        $this->Cell(80, 7, utf8_decode($fecha), 1);
        $this->Cell(40, 7, number_format($cajas, 0), 1, 0, 'R');
        $this->Cell(40, 7, number_format($pesoNeto, 2), 1, 0, 'R');
        $this->Cell(40, 7, $horaCargue, 1, 1, 'C');

        // Acumular totales
        $this->totalCajas += $cajas;
        $this->totalPesoNeto += $pesoNeto;
    }

    function agregarTotales()
    {
        $this->SetFont('Arial', 'B', 10);
        $this->SetFillColor(220, 220, 220);
        
        $this->Cell(80, 8, 'TOTALES:', 1, 0, 'R', true);
        $this->Cell(40, 8, number_format($this->totalCajas, 0), 1, 0, 'R', true);
        $this->Cell(40, 8, number_format($this->totalPesoNeto, 2), 1, 0, 'R', true);
        $this->Cell(40, 8, '', 1, 1, 'C', true);
    }
}

// ======================
// GENERAR PDF
// ======================
$pdf = new PDFTransporte('P', 'mm', 'Letter');
$pdf->SetMargins(15, 15, 15);
$pdf->AliasNbPages();
$pdf->AddPage();

// DEBUG: Antes de generar PDF
error_log("=== GENERANDO PDF TRANSPORTE ===");
error_log("Total filas a procesar: " . count($datosTransporte));

// Agregar encabezado de columnas
$pdf->agregarEncabezadoColumnas();

// Agregar filas con los datos consolidados
foreach ($datosTransporte as $dato) {
    $pdf->agregarFila(
        $dato['FechaCompleta'],
        $dato['CantidadCajas'],
        $dato['PesoNeto'],
        $dato['HoraCargue']
    );
}

// Agregar totales al final
$pdf->agregarTotales();

// Si no hay datos
if (empty($datosTransporte)) {
    $pdf->SetFont('Arial', 'B', 12);
    $pdf->Cell(0, 10, utf8_decode('No se encontraron datos para el período seleccionado.'), 0, 1, 'C');
}

// Generar PDF
$nombreArchivo = 'Transporte_Consolidado_' . date('Y-m-d_His') . '.pdf'; // 👈 Nuevo nombre para evitar cache
$pdf->Output('I', $nombreArchivo);