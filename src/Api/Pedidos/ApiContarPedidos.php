<?php
// /DatenBankenApp/DiBufala/Api/Pedidos/ApiContarPedidos.php
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Datos no válidos"]);
    exit;
}

$fechaDesde = $data["fechaDesde"] ?? "";
$fechaHasta = $data["fechaHasta"] ?? "";
$bodegaId = $data["bodegaId"] ?? "";

if (empty($fechaDesde) || empty($fechaHasta)) {
    echo json_encode(["success" => false, "message" => "Fechas requeridas"]);
    exit;
}

try {
    $sql = "SELECT COUNT(*) as total 
            FROM EncabPedido ep
            WHERE ep.FechaSalida BETWEEN ? AND ?";
    
    $params = [$fechaDesde, $fechaHasta];
    $types = "ss";
    
    if (!empty($bodegaId)) {
        $sql .= " AND ep.Id_Bodega = ?";
        $params[] = $bodegaId;
        $types .= "i";
    }

    $stmt = $enlace->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $stmt->bind_result($total);
    $stmt->fetch();
    $stmt->close();

    echo json_encode([
        "success" => true,
        "total" => $total,
        "filtros" => [
            "fechaDesde" => $fechaDesde,
            "fechaHasta" => $fechaHasta,
            "bodegaId" => $bodegaId
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>