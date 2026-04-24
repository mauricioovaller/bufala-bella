<?php
// ApiGetPermisosAcciones.php
// Retorna las acciones permitidas de un usuario para un módulo específico.
// Si el usuario no tiene registros en PermisosAcciones → array vacío (acceso completo).

header("Content-Type: application/json");
session_start();

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

if (!isset($_SESSION['idUsuario'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "No autenticado"]);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

$modulo = isset($data["modulo"]) ? trim($data["modulo"]) : "";

if (empty($modulo)) {
    echo json_encode(["success" => false, "message" => "El campo 'modulo' es requerido"]);
    exit;
}

$idUsuario = intval($_SESSION['idUsuario']);

$sql = "SELECT Accion FROM PermisosAcciones WHERE IdUsuario = ? AND Modulo = ?";
$stmt = $enlace->prepare($sql);

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Error preparando consulta"]);
    exit;
}

$stmt->bind_param("is", $idUsuario, $modulo);
$stmt->execute();
$stmt->bind_result($accion);

$acciones = [];
while ($stmt->fetch()) {
    $acciones[] = $accion;
}

$stmt->close();
$enlace->close();

echo json_encode([
    "success" => true,
    "modulo"  => $modulo,
    "acciones" => $acciones  // [] = sin restricciones (acceso completo)
]);
