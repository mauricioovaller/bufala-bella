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

$input = json_decode(file_get_contents("php://input"), true);
$idNotaCredito = $input['idNotaCredito'] ?? 0;

if (!$idNotaCredito) {
    echo json_encode(["success" => false, "message" => "ID de nota crédito requerido"]);
    exit;
}

try {
    $stmt = $enlace->prepare("UPDATE EncabNotaCredito SET Estado = 'Anulado' WHERE Id_EncabNotaCredito = ?");
    $stmt->bind_param("i", $idNotaCredito);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(["success" => true, "message" => "Nota crédito anulada correctamente"]);
    } else {
        echo json_encode(["success" => false, "message" => "No se encontró la nota crédito o ya estaba anulada"]);
    }
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>
