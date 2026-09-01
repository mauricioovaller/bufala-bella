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
$fechaDesde = $input['fechaDesde'] ?? '';
$fechaHasta = $input['fechaHasta'] ?? '';
$idCliente = $input['idCliente'] ?? 0;

try {
    $sql = "SELECT 
                enc.Id_EncabNotaCredito AS idNotaCredito,
                enc.Numero,
                enc.Fecha,
                enc.Motivo,
                enc.ValorTotalCOP,
                enc.Estado,
                enc.FechaRegistro,
                cli.Nombre AS NombreCliente,
                COUNT(det.Id_DetNotaCredito) AS totalItems,
                GROUP_CONCAT(DISTINCT COALESCE(enc2.PurchaseOrder, '') ORDER BY det.Item SEPARATOR ', ') AS PurchaseOrders,
                GROUP_CONCAT(DISTINCT COALESCE(clr.Region, '') ORDER BY det.Item SEPARATOR ', ') AS Regiones
            FROM EncabNotaCredito enc
            INNER JOIN Clientes cli ON enc.Id_Cliente = cli.Id_Cliente
            LEFT JOIN DetNotaCredito det ON enc.Id_EncabNotaCredito = det.Id_EncabNotaCredito
            LEFT JOIN EncabPedido enc2 ON det.Id_EncabPedido = enc2.Id_EncabPedido
            LEFT JOIN ClientesRegion clr ON enc2.Id_ClienteRegion = clr.Id_ClienteRegion
            WHERE 1=1";

    $params = [];
    $types = "";

    if ($fechaDesde && $fechaHasta) {
        $sql .= " AND enc.Fecha BETWEEN ? AND ?";
        $params[] = $fechaDesde;
        $params[] = $fechaHasta;
        $types .= "ss";
    }

    if ($idCliente) {
        $sql .= " AND enc.Id_Cliente = ?";
        $params[] = $idCliente;
        $types .= "i";
    }

    $sql .= " GROUP BY enc.Id_EncabNotaCredito, enc.Numero, enc.Fecha, enc.Motivo, enc.ValorTotalCOP, enc.Estado, enc.FechaRegistro, cli.Nombre
              ORDER BY enc.Fecha DESC, enc.Id_EncabNotaCredito DESC";

    $stmt = $enlace->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $stmt->bind_result($idNotaCredito, $numero, $fecha, $motivo, $valorTotalCOP, $estado, $fechaRegistro, $nombreCliente, $totalItems, $purchaseOrders, $regiones);

    $notas = [];
    while ($stmt->fetch()) {
        $notas[] = [
            'idNotaCredito' => $idNotaCredito,
            'Numero' => $numero,
            'Fecha' => $fecha,
            'Motivo' => $motivo ?? '',
            'ValorTotalCOP' => (float)$valorTotalCOP,
            'Estado' => $estado,
            'FechaRegistro' => $fechaRegistro,
            'NombreCliente' => $nombreCliente,
            'totalItems' => (int)$totalItems,
            'PurchaseOrders' => $purchaseOrders ?? '',
            'Regiones' => $regiones ?? ''
        ];
    }
    $stmt->close();

    echo json_encode(['success' => true, 'notas' => $notas, 'total' => count($notas)]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

$enlace->close();
?>
