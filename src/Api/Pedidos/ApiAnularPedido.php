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

$json = file_get_contents("php://input");
$data = json_decode($json, true);
$idPedido = intval($data["idPedido"] ?? 0);

if ($idPedido <= 0) {
    echo json_encode(["success" => false, "message" => "ID de pedido inválido"]);
    exit;
}

$sqlCheck = "SELECT Estado FROM EncabPedido WHERE Id_EncabPedido = ?";
$stmtCheck = $enlace->prepare($sqlCheck);
$stmtCheck->bind_param("i", $idPedido);
$stmtCheck->execute();
$stmtCheck->bind_result($estadoActual);
$stmtCheck->fetch();
$stmtCheck->close();

if (!$estadoActual) {
    echo json_encode(["success" => false, "message" => "Pedido no encontrado"]);
    exit;
}

if ($estadoActual === 'Anulado') {
    echo json_encode(["success" => false, "message" => "El pedido ya se encuentra anulado"]);
    exit;
}

$sql = "UPDATE EncabPedido SET Estado = 'Anulado' WHERE Id_EncabPedido = ?";
$stmt = $enlace->prepare($sql);
$stmt->bind_param("i", $idPedido);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode(["success" => true, "message" => "Pedido anulado correctamente"]);
} else {
    echo json_encode(["success" => false, "message" => "No se pudo anular el pedido"]);
}

$stmt->close();
$enlace->close();
