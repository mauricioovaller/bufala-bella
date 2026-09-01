<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$idCliente = $input['idCliente'] ?? 0;
$fechaDesde = $input['fechaDesde'] ?? '';
$fechaHasta = $input['fechaHasta'] ?? '';

if (!$idCliente) {
    echo json_encode(["success" => false, "message" => "Cliente requerido"]);
    exit;
}

try {
    $sql = "SELECT 
                enc.Id_EncabPedido AS idPedido,
                enc.PurchaseOrder,
                enc.FechaOrden,
                enc.FechaSalida,
                enc.FechaIngreso,
                enc.Observaciones,
                enc.FacturaNo,
                COUNT(det.Id_DetPedido) AS totalProductos,
                SUM(det.Cantidad) AS totalCajas,
                ROUND(SUM(det.PesoNeto), 2) AS totalPesoNeto,
                ROUND(SUM(det.PesoNeto * det.PrecioUnitario), 0) AS totalValor
            FROM EncabPedido enc
            INNER JOIN DetPedido det ON enc.Id_EncabPedido = det.Id_EncabPedido
            WHERE enc.Id_Cliente = ? AND enc.Estado = 'Activo'";

    $params = [$idCliente];
    $types = "i";

    if ($fechaDesde && $fechaHasta) {
        $sql .= " AND enc.FechaSalida BETWEEN ? AND ?";
        $params[] = $fechaDesde;
        $params[] = $fechaHasta;
        $types .= "ss";
    }

    $sql .= " GROUP BY enc.Id_EncabPedido, enc.PurchaseOrder, enc.FechaOrden, enc.FechaSalida, enc.FechaIngreso, enc.Observaciones, enc.FacturaNo
              ORDER BY enc.FechaSalida DESC, enc.Id_EncabPedido DESC";

    $stmt = $enlace->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $stmt->bind_result($idPedido, $purchaseOrder, $fechaOrden, $fechaSalida, $fechaIngreso, $observaciones, $facturaNo, $totalProductos, $totalCajas, $totalPesoNeto, $totalValor);

    $pedidos = [];
    while ($stmt->fetch()) {
        $pedidos[] = [
            'idPedido' => $idPedido,
            'PurchaseOrder' => $purchaseOrder ?? '',
            'FacturaNo' => $facturaNo ?? '',
            'FechaOrden' => $fechaOrden,
            'FechaSalida' => $fechaSalida,
            'FechaIngreso' => $fechaIngreso,
            'Observaciones' => $observaciones ?? '',
            'totalProductos' => (int)$totalProductos,
            'totalCajas' => (float)$totalCajas,
            'totalPesoNeto' => (float)$totalPesoNeto,
            'totalValor' => (float)$totalValor
        ];
    }
    $stmt->close();

    echo json_encode(['success' => true, 'pedidos' => $pedidos, 'total' => count($pedidos)]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

$enlace->close();
?>
