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
$idComentario = intval($input['idComentario'] ?? 0);
$idCliente = intval($input['idCliente'] ?? 0);
$idClienteRegion = intval($input['idClienteRegion'] ?? 0);
$comentarioPrimario = trim($input['comentarioPrimario'] ?? '');
$comentarioSecundario = trim($input['comentarioSecundario'] ?? '');

if (!$idComentario) {
    echo json_encode(["success" => false, "message" => "ID de comentario requerido."]);
    exit;
}
if (!$idCliente) {
    echo json_encode(["success" => false, "message" => "El cliente es obligatorio."]);
    exit;
}
if (!$idClienteRegion) {
    echo json_encode(["success" => false, "message" => "La región es obligatoria."]);
    exit;
}

try {
    // Verificar que el comentario existe
    $stmtCheck = $enlace->prepare("SELECT Id_Comentario FROM Comentarios WHERE Id_Comentario = ?");
    $stmtCheck->bind_param("i", $idComentario);
    $stmtCheck->execute();
    $stmtCheck->bind_result($idExistente);
    if (!$stmtCheck->fetch()) {
        $stmtCheck->close();
        echo json_encode(["success" => false, "message" => "El comentario no existe."]);
        exit;
    }
    $stmtCheck->close();

    $enlace->begin_transaction();

    $stmt = $enlace->prepare("UPDATE Comentarios SET Id_Cliente = ?, Id_ClienteRegion = ?, ComentarioPrimario = ?, ComentarioSecundario = ? WHERE Id_Comentario = ?");
    $stmt->bind_param("iissi", $idCliente, $idClienteRegion, $comentarioPrimario, $comentarioSecundario, $idComentario);
    $stmt->execute();
    $stmt->close();

    $enlace->commit();

    echo json_encode(["success" => true, "message" => "Comentario actualizado correctamente."]);

} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(["success" => false, "message" => "Error al actualizar: " . $e->getMessage()]);
}

$enlace->close();
?>