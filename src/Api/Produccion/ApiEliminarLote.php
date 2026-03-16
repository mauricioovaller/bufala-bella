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

$idLote = isset($data['idLote']) ? intval($data['idLote']) : 0;

if (!$idLote) {
    echo json_encode(["success" => false, "message" => "ID de lote no válido"]);
    exit;
}

$sql = "UPDATE Lotes SET Activo = 0 WHERE Id_Lote = ?";
$stmt = $enlace->prepare($sql);
$stmt->bind_param("i", $idLote);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Lote desactivado correctamente"]);
} else {
    echo json_encode(["success" => false, "message" => "Error al desactivar lote: " . $stmt->error]);
}

$stmt->close();
$enlace->close();
?>