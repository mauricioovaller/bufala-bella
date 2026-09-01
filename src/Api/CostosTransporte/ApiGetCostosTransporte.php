<?php
// ApiGetCostosTransporte.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "error" => "Método no permitido. Usa POST."]);
    http_response_code(405);
    exit;
}

// Obtener datos JSON
$input = json_decode(file_get_contents("php://input"), true);

$fechaDesde = $input['fechaDesde'] ?? null;
$fechaHasta = $input['fechaHasta'] ?? null;
$tipoPedido = $input['tipoPedido'] ?? 'normal';

// Validar fechas
if (!$fechaDesde || !$fechaHasta) {
    echo json_encode(["success" => false, "error" => "Debe proporcionar fechaDesde y fechaHasta"]);
    exit;
}

// Validar tipo de pedido (compatible hacia atras: default 'normal')
if (!in_array($tipoPedido, ['normal', 'chile'], true)) {
    $tipoPedido = 'normal';
}

try {
    // Consulta para obtener costos con cálculo de costo por kg
    $sql = "SELECT 
                ctd.Id_CostoTransporte,
                ctd.Fecha,
                ctd.CantidadCamiones,
                ctd.ValorFlete,
                ctd.TipoPedido,
                ctd.Observaciones,
                ctd.FechaRegistro,
                ctd.UsuarioRegistro,
                COALESCE(
                    CASE WHEN ctd.TipoPedido = 'chile' THEN (
                        SELECT SUM(di.Kilogramos)
                        FROM EncabInvoiceChile ei
                        INNER JOIN DetInvoiceChile di ON ei.Id_EncabInvoice = di.Id_EncabInvoice
                        WHERE ei.Fecha = ctd.Fecha
                    ) ELSE (
                        SELECT SUM(di.Kilogramos)
                        FROM EncabInvoice ei
                        INNER JOIN DetInvoice di ON ei.Id_EncabInvoice = di.Id_EncabInvoice
                        WHERE ei.Fecha = ctd.Fecha
                    ) END,
                    0
                ) AS TotalKgFacturado,
                CASE
                    WHEN ctd.TipoPedido = 'chile' AND (
                        SELECT SUM(di.Kilogramos)
                        FROM EncabInvoiceChile ei
                        INNER JOIN DetInvoiceChile di ON ei.Id_EncabInvoice = di.Id_EncabInvoice
                        WHERE ei.Fecha = ctd.Fecha
                    ) > 0 THEN ROUND(ctd.ValorFlete / (
                        SELECT SUM(di.Kilogramos)
                        FROM EncabInvoiceChile ei
                        INNER JOIN DetInvoiceChile di ON ei.Id_EncabInvoice = di.Id_EncabInvoice
                        WHERE ei.Fecha = ctd.Fecha
                    ), 2)
                    WHEN ctd.TipoPedido <> 'chile' AND (
                        SELECT SUM(di.Kilogramos)
                        FROM EncabInvoice ei
                        INNER JOIN DetInvoice di ON ei.Id_EncabInvoice = di.Id_EncabInvoice
                        WHERE ei.Fecha = ctd.Fecha
                    ) > 0 THEN ROUND(ctd.ValorFlete / (
                        SELECT SUM(di.Kilogramos)
                        FROM EncabInvoice ei
                        INNER JOIN DetInvoice di ON ei.Id_EncabInvoice = di.Id_EncabInvoice
                        WHERE ei.Fecha = ctd.Fecha
                    ), 2)
                    ELSE 0
                END AS CostoPorKg
            FROM CostosTransporteDiario ctd
            WHERE ctd.Fecha BETWEEN ? AND ?
              AND ctd.TipoPedido = ?
            ORDER BY ctd.Fecha DESC";

    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("sss", $fechaDesde, $fechaHasta, $tipoPedido);
    $stmt->execute();
    
    $stmt->bind_result(
        $idCostoTransporte,
        $fecha,
        $cantidadCamiones,
        $valorFlete,
        $tipoPedidoRow,
        $observaciones,
        $fechaRegistro,
        $usuarioRegistro,
        $totalKgFacturado,
        $costoPorKg
    );
    
    $costos = [];
    while ($stmt->fetch()) {
        $costos[] = [
            'id' => $idCostoTransporte,
            'Fecha' => $fecha,
            'CantidadCamiones' => $cantidadCamiones,
            'ValorFlete' => (float)$valorFlete,
            'TipoPedido' => $tipoPedidoRow,
            'Observaciones' => $observaciones,
            'FechaRegistro' => $fechaRegistro,
            'UsuarioRegistro' => $usuarioRegistro,
            'TotalKgFacturado' => (float)$totalKgFacturado,
            'CostoPorKg' => (float)$costoPorKg
        ];
    }
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'costos' => $costos,
        'total' => count($costos)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener costos de transporte: ' . $e->getMessage()
    ]);
}

$enlace->close();
?>
