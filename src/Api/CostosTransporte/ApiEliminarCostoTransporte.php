<?php
// ApiEliminarCostoTransporte.php
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

$idCosto = $data["id"] ?? 0;

// Validaciones básicas
if (!is_numeric($idCosto) || $idCosto <= 0) {
    echo json_encode(["success" => false, "message" => "ID de costo no válido"]);
    exit;
}

// Verificar que el registro exista
$sqlCheck = "SELECT Fecha, ValorFlete FROM CostosTransporteDiario WHERE Id_CostoTransporte = ?";
$stmtCheck = $enlace->prepare($sqlCheck);
$stmtCheck->bind_param("i", $idCosto);
$stmtCheck->execute();
$stmtCheck->bind_result($fecha, $valorFlete);
$stmtCheck->fetch();
$stmtCheck->close();

if (!$fecha) {
    echo json_encode(["success" => false, "message" => "Registro de costo no encontrado"]);
    exit;
}

// Eliminar registro
$sql = "DELETE FROM CostosTransporteDiario WHERE Id_CostoTransporte = ?";
$stmt = $enlace->prepare($sql);
$stmt->bind_param("i", $idCosto);

if ($stmt->execute()) {
    $affectedRows = $stmt->affected_rows;
    if ($affectedRows > 0) {
        echo json_encode([
            "success" => true, 
            "message" => "Costo de transporte eliminado exitosamente",
            "deletedId" => $idCosto,
            "fecha" => $fecha,
            "valorFlete" => $valorFlete
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "No se pudo eliminar el registro"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Error al eliminar: " . $stmt->error]);
}

$stmt->close();
$enlace->close();
?>