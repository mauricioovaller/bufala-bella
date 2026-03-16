<?php
header("Content-Type: application/json");
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

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

function limpiar_texto($texto) {
    return htmlspecialchars(trim($texto), ENT_QUOTES, "UTF-8");
}

$idConductor = intval($data["idConductor"] ?? 0);
$nombre = limpiar_texto($data["nombre"] ?? "");
$documento = limpiar_texto($data["noDocumento"] ?? "");
$telefono = limpiar_texto($data["telefono"] ?? "");
$tipoVehiculo = limpiar_texto($data["tipoVehiculo"] ?? "");
$placa = limpiar_texto($data["placa"] ?? "");

if (!$idConductor || !$nombre || !$documento || !$telefono || !$tipoVehiculo || !$placa) {
    echo json_encode(["success" => false, "message" => "Datos incompletos"]);
    exit;
}

// Validar duplicados excluyendo el actual
$sqlCheck = "SELECT Id_Conductor FROM Conductores WHERE (NoDocumento = ? OR Nombre = ?) AND Id_Conductor != ?";
$stmtCheck = $enlace->prepare($sqlCheck);
$stmtCheck->bind_param("ssi", $documento, $nombre, $idConductor);
$stmtCheck->execute();
$stmtCheck->store_result();

if ($stmtCheck->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Ya existe otro conductor con el mismo documento o nombre."]);
    $stmtCheck->close();
    $enlace->close();
    exit;
}
$stmtCheck->close();

// Actualizar
$sql = "UPDATE Conductores SET Nombre = ?, NoDocumento = ?, Telefono = ?, TipoVehiculo = ?, Placa = ? WHERE Id_Conductor = ?";
$stmt = $enlace->prepare($sql);
$stmt->bind_param("sssssi", $nombre, $documento, $telefono, $tipoVehiculo, $placa, $idConductor);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Conductor actualizado exitosamente"]);
} else {
    echo json_encode(["success" => false, "message" => "Error al actualizar: " . $stmt->error]);
}

$stmt->close();
$enlace->close();
?>