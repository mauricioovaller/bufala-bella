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

// Establecer configuración de fecha/hora en MySQL
$enlace->query("SET lc_time_names = 'es_ES'");

// CONSULTA UNIFICADA - COMBINA DATOS DE TABLAS NORMALES Y SAMPLE
$sql = "SELECT
    DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaSalida,
    DATE_FORMAT(enc.FechaSalida, '%W') AS DiaSemana,
    prd.Codigo_Siesa,
    CONCAT(prd.DescripProducto, ' ', emb.Descripcion) AS Descripcion,
    SUM(det.Cantidad) AS Cajas,
    SUM(det.Cantidad * emb.Cantidad) AS TotalTM,
    ROUND(SUM(det.Cantidad * emb.Cantidad * prd.PesoGr / 1000), 2) AS KgNet,
    ROUND(SUM(enc.CantidadEstibas * (det.Cantidad / total_pedido.TotalCajasPedido)), 2) AS CantidadEstibas,
    'Normal' AS TipoDato
FROM EncabPedido enc
INNER JOIN DetPedido det ON enc.Id_EncabPedido = det.Id_EncabPedido   
INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
INNER JOIN (
    SELECT 
        Id_EncabPedido,
        SUM(Cantidad) AS TotalCajasPedido
    FROM DetPedido
    GROUP BY Id_EncabPedido
) total_pedido ON enc.Id_EncabPedido = total_pedido.Id_EncabPedido
WHERE enc.{$campoFecha} BETWEEN ? AND ?
GROUP BY enc.FechaSalida, prd.Codigo_Siesa, det.Id_Embalaje

UNION ALL

SELECT
    DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaSalida,
    DATE_FORMAT(enc.FechaSalida, '%W') AS DiaSemana,
    prd.Codigo_Siesa,
    CONCAT(prd.DescripProducto, ' ', emb.Descripcion) AS Descripcion,
    SUM(det.Cantidad) AS Cajas,
    SUM(det.Cantidad * emb.Cantidad) AS TotalTM,
    ROUND(SUM(det.Cantidad * emb.Cantidad * prd.PesoGr / 1000), 2) AS KgNet,
    ROUND(SUM(enc.CantidadEstibas * (det.Cantidad / total_pedido.TotalCajasPedido)), 2) AS CantidadEstibas,
    'Sample' AS TipoDato
FROM EncabPedidoSample enc
INNER JOIN DetPedidoSample det ON enc.Id_EncabPedido = det.Id_EncabPedido   
INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
INNER JOIN (
    SELECT 
        Id_EncabPedido,
        SUM(Cantidad) AS TotalCajasPedido
    FROM DetPedidoSample
    GROUP BY Id_EncabPedido
) total_pedido ON enc.Id_EncabPedido = total_pedido.Id_EncabPedido
WHERE enc.{$campoFecha} BETWEEN ? AND ?
GROUP BY enc.FechaSalida, prd.Codigo_Siesa, det.Id_Embalaje

ORDER BY 1, Codigo_Siesa";

$stmt = $enlace->prepare($sql);
$stmt->bind_param("ssss", $fechaInicio, $fechaFin, $fechaInicio, $fechaFin);
$stmt->execute();

// Bind de resultados
$stmt->bind_result(
    $fechaSalida,
    $diaSemana,
    $codigoSiesa,
    $descripcion,
    $cajas,
    $totalTM,
    $kgNet,
    $cantidadEstibas,
    $tipoDato
);

// Organizar datos por fecha y consolidar productos idénticos
$datosPorFecha = [];

while ($stmt->fetch()) {    
    
    if (!isset($datosPorFecha[$fechaSalida])) {
        $datosPorFecha[$fechaSalida] = [
            'dia_semana' => $diaSemana,
            'productos' => []
        ];
    }

    // 👇 CORRECCIÓN: Incluir la fecha en la clave única para evitar duplicados entre fechas
    $claveProducto = $fechaSalida . '|' . $codigoSiesa . '|' . $descripcion;
    
    // Si ya existe este producto en esta fecha, sumar los valores
    if (isset($datosPorFecha[$fechaSalida]['productos'][$claveProducto])) {
        $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['Cajas'] += $cajas;
        $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['TotalTM'] += $totalTM;
        $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['KgNet'] += $kgNet;
        $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['CantidadEstibas'] += $cantidadEstibas;
    } else {
        // Si no existe, crear nuevo registro
        $datosPorFecha[$fechaSalida]['productos'][$claveProducto] = [
            'Codigo_Siesa' => $codigoSiesa,
            'Descripcion' => $descripcion,
            'Cajas' => $cajas,
            'TotalTM' => $totalTM,
            'KgNet' => $kgNet,
            'CantidadEstibas' => $cantidadEstibas
        ];
    }
}



$stmt->close();

// 👇 CORRECCIÓN: Eliminar la referencia (&) que causaba la duplicación
foreach ($datosPorFecha as $fecha => $datosFecha) {
    $datosPorFecha[$fecha]['productos'] = array_values($datosFecha['productos']);
}

// ======================
// CLASE PDF PARA EL NUEVO REPORTE
// ======================
class PDFDespachos extends FPDF
{
    private $currentFecha = '';
    private $totalesFecha = [
        'total_cajas' => 0,
        'total_tm' => 0,
        'total_kgnet' => 0,
        'total_estibas' => 0
    ];

    function Header()
    {
        // Logo
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalabella.jpg", 15, 15, 30);

        // Título principal
        $this->SetFont('Arial', 'B', 16);
        $this->Cell(0, 10, utf8_decode('DESPACHOS POR DÍA'), 0, 1, 'C');

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

    function iniciarNuevaFecha($fecha, $diaSemana)
    {
        // Si no es la primera fecha, agregar espacio
        if ($this->currentFecha !== '') {
            $this->Ln(10);
        }

        // Verificar si necesita nueva página (dejar espacio para tabla + totales)
        if ($this->GetY() > 200) {
            $this->AddPage();
        }

        $this->currentFecha = $fecha;

        // Reiniciar totales
        $this->totalesFecha = [
            'total_cajas' => 0,
            'total_tm' => 0,
            'total_kgnet' => 0,
            'total_estibas' => 0
        ];

        // Encabezado de fecha
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

        // Todas las celdas usando la función auxiliar
        $this->agregarCeldaDosLineas(17, $altura, 'CÓDIGO', 'SIESA');
        $this->Cell(79, $altura, utf8_decode('DESCRIPCIÓN'), 1, 0, 'C', true);
        $this->agregarCeldaDosLineas(35, $altura, 'UNDS', 'TERMOFORMADOS');
        $this->Cell(15, $altura, utf8_decode('CAJAS'), 1, 0, 'C', true);
        $this->Cell(20, $altura, utf8_decode('KG NETOS'), 1, 0, 'C', true);
        $this->agregarCeldaDosLineas(20, $altura, 'TOTAL', "PALLET'S");

        // Salto de línea
        $this->Ln($altura);
    }

    // Función auxiliar para celdas con dos líneas
    function agregarCeldaDosLineas($ancho, $altura, $linea1, $linea2)
    {
        $x = $this->GetX();
        $y = $this->GetY();

        // Dibujar el borde de la celda con relleno
        $this->Rect($x, $y, $ancho, $altura, 'DF');

        // Escribir el texto en dos líneas
        $this->SetXY($x, $y + 2);
        $this->Cell($ancho, 4, utf8_decode($linea1), 0, 2, 'C');
        $this->Cell($ancho, 4, utf8_decode($linea2), 0, 0, 'C');

        // Reposicionar para continuar
        $this->SetXY($x + $ancho, $y);
    }

    function agregarProducto($producto)
    {
        
        // Verificar si necesita nueva página
        if ($this->GetY() > 250) {
            $this->AddPage();
            // Volver a poner encabezado de columnas después de salto de página
            $this->agregarEncabezadoColumnas();
        }

        // Si es el primer producto de la fecha, agregar encabezado de columnas
        if ($this->totalesFecha['total_cajas'] == 0) {
            $this->agregarEncabezadoColumnas();
        }

        $this->SetFont('Arial', '', 8);

        $this->Cell(17, 6, utf8_decode($producto['Codigo_Siesa']), 1);
        $this->Cell(79, 6, utf8_decode($producto['Descripcion']), 1);
        $this->Cell(35, 6, number_format($producto['TotalTM'], 0), 1, 0, 'R');
        $this->Cell(15, 6, number_format($producto['Cajas'], 0), 1, 0, 'R');
        $this->Cell(20, 6, number_format($producto['KgNet'], 2), 1, 0, 'R');
        $this->Cell(20, 6, number_format($producto['CantidadEstibas'], 2), 1, 1, 'R');

        // Acumular totales
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
        $this->Cell(35, 8, number_format($this->totalesFecha['total_tm'], 0), 1, 0, 'R', true);
        $this->Cell(15, 8, number_format($this->totalesFecha['total_cajas'], 0), 1, 0, 'R', true);
        $this->Cell(20, 8, number_format($this->totalesFecha['total_kgnet'], 2), 1, 0, 'R', true);
        $this->Cell(20, 8, number_format($this->totalesFecha['total_estibas'], 2), 1, 1, 'R', true);

        $this->Ln(5);
    }
}

// ======================
// GENERAR PDF
// ======================
$pdf = new PDFDespachos('P', 'mm', 'Letter');
$pdf->SetMargins(15, 15, 15);
$pdf->AliasNbPages();
$pdf->AddPage();

// DEBUG: Antes de generar PDF
error_log("=== GENERANDO PDF ===");
foreach ($datosPorFecha as $fecha => $datos) {
    error_log("Fecha en PDF: $fecha - " . count($datos['productos']) . " productos");
}

// Procesar datos por fecha
foreach ($datosPorFecha as $fecha => $datosFecha) {
    error_log("Procesando fecha en PDF: $fecha");
    $pdf->iniciarNuevaFecha($fecha, $datosFecha['dia_semana']);

    // Agregar productos de esta fecha
    foreach ($datosFecha['productos'] as $producto) {
        $pdf->agregarProducto($producto);
    }

    // Agregar totales de la fecha
    $pdf->agregarTotalesFecha();
}

// Si no hay datos
if (empty($datosPorFecha)) {
    $pdf->SetFont('Arial', 'B', 12);
    $pdf->Cell(0, 10, utf8_decode('No se encontraron datos para el período seleccionado.'), 0, 1, 'C');
}

// Generar PDF
$nombreArchivo = 'Despachos_Consolidado_' . date('Y-m-d_His') . '.pdf'; // 👈 Nuevo nombre para evitar cache
$pdf->Output('I', $nombreArchivo);