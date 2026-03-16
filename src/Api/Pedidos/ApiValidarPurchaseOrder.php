<?php
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

// Leer JSON
$json = file_get_contents("php://input");
$data = json_decode($json, true);
$purchaseOrder = trim($data["purchaseOrder"] ?? "");
$pedidoIdActual = intval($data["pedidoIdActual"] ?? 0);

if (empty($purchaseOrder)) {
    echo json_encode(["success" => true, "existe" => false, "message" => "Purchase Order vacío"]);
    exit;
}

// Consulta para verificar si la Purchase Order ya existe
$sql = "SELECT ep.Id_EncabPedido, ep.FechaOrden, c.Nombre as Cliente 
        FROM EncabPedido ep
        INNER JOIN Clientes c ON ep.Id_Cliente = c.Id_Cliente
        WHERE ep.PurchaseOrder = ? AND ep.Id_EncabPedido != ?";

$stmt = $enlace->prepare($sql);
$stmt->bind_param("si", $purchaseOrder, $pedidoIdActual);
$stmt->execute();
$stmt->bind_result($idPedido, $fechaOrden, $cliente);

$pedidoExistente = null;
if ($stmt->fetch()) {
    $pedidoExistente = [
        "idPedido" => $idPedido,
        "fechaOrden" => $fechaOrden,
        "cliente" => $cliente
    ];
}
$stmt->close();
$enlace->close();

if ($pedidoExistente) {
    echo json_encode([
        "success" => true,
        "existe" => true,
        "mensaje" => "La Purchase Order {$purchaseOrder} ya está registrada en el Pedido No. {$pedidoExistente['idPedido']} con fecha {$pedidoExistente['fechaOrden']} para el cliente {$pedidoExistente['cliente']}",
        "pedidoExistente" => $pedidoExistente
    ]);
} else {
    echo json_encode([
        "success" => true,
        "existe" => false,
        "mensaje" => "Purchase Order disponible"
    ]);
}
?>