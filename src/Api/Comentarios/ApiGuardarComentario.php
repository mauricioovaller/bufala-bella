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
$idCliente = intval($input['idCliente'] ?? 0);
$idClienteRegion = intval($input['idClienteRegion'] ?? 0);
$comentarioPrimario = trim($input['comentarioPrimario'] ?? '');
$comentarioSecundario = trim($input['comentarioSecundario'] ?? '');

// Validación previa (sin transacción, sin consumir IDs)
if (!$idCliente) {
    echo json_encode(["success" => false, "message" => "El cliente es obligatorio."]);
    exit;
}
if (!$idClienteRegion) {
    echo json_encode(["success" => false, "message" => "La región es obligatoria."]);
    exit;
}
if (!$comentarioPrimario && !$comentarioSecundario) {
    echo json_encode(["success" => false, "message" => "Debe escribir al menos un comentario."]);
    exit;
}

try {
    // Validar que no exista duplicado (Cliente + Region)
    $stmtCheck = $enlace->prepare("SELECT Id_Comentario FROM Comentarios WHERE Id_Cliente = ? AND Id_ClienteRegion = ?");
    $stmtCheck->bind_param("ii", $idCliente, $idClienteRegion);
    $stmtCheck->execute();
    $stmtCheck->bind_result($idExistente);
    if ($stmtCheck->fetch()) {
        $stmtCheck->close();
        echo json_encode([
            "success" => false,
            "message" => "Ya existe un comentario para este cliente y región. Búsquelo en la lista y use Editar para modificarlo."
        ]);
        exit;
    }
    $stmtCheck->close();

    $enlace->begin_transaction();

    $stmt = $enlace->prepare("INSERT INTO Comentarios (Id_Cliente, Id_ClienteRegion, ComentarioPrimario, ComentarioSecundario) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("iiss", $idCliente, $idClienteRegion, $comentarioPrimario, $comentarioSecundario);
    $stmt->execute();
    $nuevoId = $stmt->insert_id;
    $stmt->close();

    $enlace->commit();

    echo json_encode([
        "success" => true,
        "message" => "Comentario guardado correctamente.",
        "idComentario" => $nuevoId
    ]);

} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(["success" => false, "message" => "Error al guardar: " . $e->getMessage()]);
}

$enlace->close();
?>