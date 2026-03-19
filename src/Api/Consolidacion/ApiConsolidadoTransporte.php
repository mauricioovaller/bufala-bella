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
    ROUND(SUM(det.PesoNeto), 2) AS PesoNeto,
    ROUND(SUM(det.PesoNeto * 2.6), 2) AS PesoBruto,
    enc.GuiaMaster,
    enc.GuiaHija,
    MAX(est.TotalEstibas) AS CantidadEstibas,
    '07:00:00' AS HoraCargue,  -- Hora por defecto
    'Normal' AS TipoDato,  -- Identificador para datos normales
    COALESCE((SELECT GROUP_CONCAT(DISTINCT Id_EncabInvoice ORDER BY Id_EncabInvoice SEPARATOR '-') FROM EncabInvoice WHERE DATE(enc.FechaSalida) = Fecha AND TipoPedido = 'normal'), '') AS Facturas,
    COALESCE((SELECT GROUP_CONCAT(DISTINCT pl.Precinto ORDER BY pl.Precinto SEPARATOR '-') FROM EncabInvoice ei LEFT JOIN Planillas pl ON ei.Id_Planilla = pl.Id_Planilla WHERE DATE(enc.FechaSalida) = ei.Fecha AND ei.TipoPedido = 'normal'), '') AS Precintos
FROM EncabPedido enc
INNER JOIN DetPedido det ON enc.Id_EncabPedido = det.Id_EncabPedido   
INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
INNER JOIN (
    SELECT 
        {$campoFecha},
        SUM(CantidadEstibas) AS TotalEstibas
    FROM EncabPedido
    WHERE {$campoFecha} BETWEEN ? AND ?
      AND Estado = 'Activo'
    GROUP BY {$campoFecha}
) est ON est.{$campoFecha} = enc.{$campoFecha}
WHERE enc.{$campoFecha} BETWEEN ? AND ? AND enc.Estado = 'Activo'
GROUP BY enc.{$campoFecha}

UNION ALL

SELECT
    DATE_FORMAT(enc.FechaSalida, '%W, %e de %M de %Y') AS FechaCompleta,
    DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaCorta,
    SUM(det.Cantidad) AS CantidadCajas,
    ROUND(SUM(det.PesoNeto), 2) AS PesoNeto,
    ROUND(SUM(det.PesoNeto * 2.6), 2) AS PesoBruto,
    enc.GuiaMaster,
    enc.GuiaHija,
    MAX(est.TotalEstibas) AS CantidadEstibas,
    '07:00:00' AS HoraCargue,  -- Hora por defecto
    'Sample' AS TipoDato,  -- Identificador para datos sample
    COALESCE((SELECT GROUP_CONCAT(DISTINCT Id_EncabInvoice ORDER BY Id_EncabInvoice SEPARATOR '-') FROM EncabInvoice WHERE DATE(enc.FechaSalida) = Fecha AND TipoPedido = 'sample'), '') AS Facturas,
    COALESCE((SELECT GROUP_CONCAT(DISTINCT pl.Precinto ORDER BY pl.Precinto SEPARATOR '-') FROM EncabInvoice ei LEFT JOIN Planillas pl ON ei.Id_Planilla = pl.Id_Planilla WHERE DATE(enc.FechaSalida) = ei.Fecha AND ei.TipoPedido = 'sample'), '') AS Precintos
FROM EncabPedidoSample enc
INNER JOIN DetPedidoSample det ON enc.Id_EncabPedido = det.Id_EncabPedido   
INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
INNER JOIN (
    SELECT 
        {$campoFecha},
        SUM(CantidadEstibas) AS TotalEstibas
    FROM EncabPedidoSample
    WHERE {$campoFecha} BETWEEN ? AND ?
      AND Estado = 'Activo'
    GROUP BY {$campoFecha}
) est ON est.{$campoFecha} = enc.{$campoFecha}
WHERE enc.{$campoFecha} BETWEEN ? AND ? AND enc.Estado = 'Activo'
GROUP BY enc.{$campoFecha}

-- Agrupar por fecha para consolidar ambos tipos de datos
ORDER BY FechaCorta ASC;";

$stmt = $enlace->prepare($sql);
$stmt->bind_param("ssssssss", $fechaInicio, $fechaFin, $fechaInicio, $fechaFin, $fechaInicio, $fechaFin, $fechaInicio, $fechaFin);
$stmt->execute();

// Bind de resultados
$stmt->bind_result(
    $fechaCompleta,
    $fechaCorta,
    $cantidadCajas,
    $pesoNeto,
    $pesoBruto,
    $guiaMaster,
    $guiaHija,
    $cantidadEstibas,
    $horaCargue,
    $tipoDato,
    $facturas,
    $precintos
);

// Obtener todos los datos y consolidar por fecha
$datosConsolidados = [];
$totalCajas = 0;
$totalPesoNeto = 0;
$totalPesoBruto = 0;
$totalEstibas = 0;

while ($stmt->fetch()) {
    $claveUnica = $fechaCorta;

    if (isset($datosConsolidados[$claveUnica])) {
        // Sumar todos los valores
        $datosConsolidados[$claveUnica]['CantidadCajas'] += $cantidadCajas;
        $datosConsolidados[$claveUnica]['PesoNeto'] += $pesoNeto;
        $datosConsolidados[$claveUnica]['PesoBruto'] += $pesoBruto;
        $datosConsolidados[$claveUnica]['CantidadEstibas'] += $cantidadEstibas;

        // Para Guías: mantener la del registro "Normal" o concatenar
        if ($tipoDato === 'Normal') {
            $datosConsolidados[$claveUnica]['GuiaMaster'] = $guiaMaster;
            $datosConsolidados[$claveUnica]['GuiaHija'] = $guiaHija;
        }

        // Combinar Facturas y Precintos
        if (!empty($facturas)) {
            $existingFacturas = $datosConsolidados[$claveUnica]['Facturas'] ?? '';
            if (!empty($existingFacturas)) {
                // Combinar y eliminar duplicados
                $combined = array_unique(array_merge(
                    explode('-', $existingFacturas),
                    explode('-', $facturas)
                ));
                $datosConsolidados[$claveUnica]['Facturas'] = implode('-', array_filter($combined));
            } else {
                $datosConsolidados[$claveUnica]['Facturas'] = $facturas;
            }
        }

        if (!empty($precintos)) {
            $existingPrecintos = $datosConsolidados[$claveUnica]['Precintos'] ?? '';
            if (!empty($existingPrecintos)) {
                $combined = array_unique(array_merge(
                    explode('-', $existingPrecintos),
                    explode('-', $precintos)
                ));
                $datosConsolidados[$claveUnica]['Precintos'] = implode('-', array_filter($combined));
            } else {
                $datosConsolidados[$claveUnica]['Precintos'] = $precintos;
            }
        }
    } else {
        $datosConsolidados[$claveUnica] = [
            'FechaCompleta' => $fechaCompleta,
            'FechaCorta' => $fechaCorta,
            'CantidadCajas' => $cantidadCajas,
            'PesoNeto' => $pesoNeto,
            'PesoBruto' => $pesoBruto,
            'GuiaMaster' => $guiaMaster,
            'GuiaHija' => $guiaHija,
            'CantidadEstibas' => $cantidadEstibas,
            'HoraCargue' => $horaCargue,
            'Facturas' => $facturas,
            'Precintos' => $precintos
        ];
    }

    // Totales globales
    $totalCajas += $cantidadCajas;
    $totalPesoNeto += $pesoNeto;
    $totalPesoBruto += $pesoBruto;
    $totalEstibas += $cantidadEstibas;
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
    private $totalPesoBruto = 0;
    private $totalEstibas = 0;

    function Header()
    {
        // Logo
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalabella.jpg", 10, 10, 10);

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
        $this->SetFont('Arial', 'B', 8);
        $this->SetFillColor(180, 180, 180);

        // Guardar posición inicial
        $startX = $this->GetX();
        $startY = $this->GetY();

        // FECHA (ancho: 35)
        $this->Cell(40, 8, utf8_decode('FECHA'), 1, 0, 'C', true);

        // CANTIDAD CAJAS (ancho: 15)
        $this->SetXY($startX + 40, $startY);
        $this->MultiCell(17, 4, utf8_decode('CANTIDAD' . "\n" . 'CAJAS'), 1, 'C', true);

        // PESO NETO (KG) (ancho: 18)
        $this->SetXY($startX + 40 + 17, $startY);
        $this->MultiCell(20, 4, utf8_decode('PESO NETO' . "\n" . '(KG)'), 1, 'C', true);

        // PESO BRUTO (KG) (ancho: 20)
        $this->SetXY($startX + 40 + 17 + 20, $startY);
        $this->MultiCell(22, 4, utf8_decode('PESO BRUTO' . "\n" . '(KG)'), 1, 'C', true);

        // GUIA MASTER (ancho: 18)
        $this->SetXY($startX + 40 + 17 + 20 + 22, $startY);
        $this->Cell(22, 8, utf8_decode('GUIA' . "\n" . 'MASTER'), 1, 0, 'C', true);

        // GUIA HIJA (ancho: 18)
        $this->SetXY($startX + 40 + 17 + 20 + 22 + 22, $startY);
        $this->Cell(22, 8, utf8_decode('GUIA' . "\n" . 'HIJA'), 1, 0, 'C', true);

        // PALLETS (ancho: 12)
        $this->SetXY($startX + 40 + 17 + 20 + 22 + 22 +22, $startY);
        $this->Cell(14, 8, utf8_decode('PALLETS'), 1, 0, 'C', true);

        // FACTURAS (ancho: 22)
        $this->SetXY($startX + 40 + 17 + 20 + 22 + 22 + 22 + 14, $startY);
        $this->Cell(22, 8, utf8_decode('FACTURAS'), 1, 0, 'C', true);

        // PRECINTO (ancho: 18)
        $this->SetXY($startX + 40 + 17 + 20 + 22 + 22 + 22 + 14 + 22, $startY);
        $this->Cell(18, 8, utf8_decode('PRECINTO'), 1, 1, 'C', true);
    }

    function agregarFila($fecha, $cajas, $pesoNeto, $pesoBruto, $guiaMaster, $guiaHija, $cantidadEstibas, $facturas, $precintos)
    {
        // DEBUG: Ver qué fila se está agregando
        error_log("PDF TRANSPORTE - Agregando: $fecha - $cajas cajas - $pesoNeto kg");

        // Verificar si necesita nueva página
        if ($this->GetY() > 250) {
            $this->AddPage();
            $this->agregarEncabezadoColumnas();
        }

        $this->SetFont('Arial', '', 6.5);
        $this->Cell(40, 7, utf8_decode($fecha), 1);
        $this->SetFont('Arial', '', 8);
        $this->Cell(17, 7, number_format($cajas, 0), 1, 0, 'R');
        $this->Cell(20, 7, number_format($pesoNeto, 2), 1, 0, 'R');
        $this->Cell(22, 7, number_format($pesoBruto, 2), 1, 0, 'R');
        $this->Cell(22, 7, utf8_decode($guiaMaster), 1, 0, 'C');
        $this->Cell(22, 7, utf8_decode($guiaHija), 1, 0, 'C');
        $this->Cell(14, 7, number_format((float)$cantidadEstibas, 0), 1, 0, 'R');
        $this->Cell(22, 7, utf8_decode($facturas), 1, 0, 'C');
        $this->Cell(18, 7, utf8_decode($precintos), 1, 1, 'C');

        // Acumular totales
        $this->totalCajas += $cajas;
        $this->totalPesoNeto += $pesoNeto;
        $this->totalPesoBruto += $pesoBruto;
        $this->totalEstibas += (float)$cantidadEstibas;
    }

    function agregarTotales()
    {
        $this->SetFont('Arial', 'B', 10);
        $this->SetFillColor(220, 220, 220);

        $this->Cell(40, 8, 'TOTALES:', 1, 0, 'R', true);
        $this->Cell(17, 8, number_format($this->totalCajas, 0), 1, 0, 'R', true);
        $this->Cell(20, 8, number_format($this->totalPesoNeto, 2), 1, 0, 'R', true);
        $this->Cell(22, 8, number_format($this->totalPesoBruto, 2), 1, 0, 'R', true);
        $this->Cell(22, 8, '', 1, 0, 'R', true);
        $this->Cell(22, 8, '', 1, 0, 'R', true);
        $this->Cell(14, 8, number_format($this->totalEstibas, 0), 1, 0, 'R', true);
        $this->Cell(22, 8, '', 1, 0, 'R', true);
        $this->Cell(18, 8, '', 1, 1, 'R', true);
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
        $dato['PesoBruto'],
        $dato['GuiaMaster'],
        $dato['GuiaHija'],
        $dato['CantidadEstibas'],
        $dato['Facturas'],
        $dato['Precintos']
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
