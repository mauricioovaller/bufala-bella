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

$nombre = limpiar_texto($data["nombre"] ?? "");
$documento = limpiar_texto($data["noDocumento"] ?? "");
$telefono = limpiar_texto($data["telefono"] ?? "");
$tipoVehiculo = limpiar_texto($data["tipoVehiculo"] ?? "");
$placa = limpiar_texto($data["placa"] ?? "");

if (!$nombre || !$documento || !$telefono || !$tipoVehiculo || !$placa) {
    echo json_encode(["success" => false, "message" => "Todos los campos son obligatorios"]);
    exit;
}

// Validar duplicados (documento o nombre)
$sqlCheck = "SELECT Id_Conductor FROM Conductores WHERE NoDocumento = ? OR Nombre = ?";
$stmtCheck = $enlace->prepare($sqlCheck);
$stmtCheck->bind_param("ss", $documento, $nombre);
$stmtCheck->execute();
$stmtCheck->store_result();

if ($stmtCheck->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Ya existe un conductor con el mismo documento o nombre."]);
    $stmtCheck->close();
    $enlace->close();
    exit;
}
$stmtCheck->close();

// Insertar
$sql = "INSERT INTO Conductores (Nombre, NoDocumento, Telefono, TipoVehiculo, Placa) VALUES (?, ?, ?, ?, ?)";
$stmt = $enlace->prepare($sql);
$stmt->bind_param("sssss", $nombre, $documento, $telefono, $tipoVehiculo, $placa);

if ($stmt->execute()) {
    $id = $stmt->insert_id;
    echo json_encode(["success" => true, "message" => "Conductor guardado exitosamente", "idConductor" => $id]);
} else {
    echo json_encode(["success" => false, "message" => "Error al guardar: " . $stmt->error]);
}

$stmt->close();
$enlace->close();
?>