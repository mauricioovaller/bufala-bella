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

if (!$idComentario) {
    echo json_encode(["success" => false, "message" => "ID de comentario requerido"]);
    exit;
}

try {
    $sql = "SELECT
                c.Id_Comentario,
                c.Id_Cliente,
                c.Id_ClienteRegion,
                c.ComentarioPrimario,
                c.ComentarioSecundario,
                cli.Nombre AS NombreCliente,
                cr.Region AS NombreRegion
            FROM Comentarios c
            INNER JOIN Clientes cli ON c.Id_Cliente = cli.Id_Cliente
            LEFT JOIN ClientesRegion cr ON c.Id_ClienteRegion = cr.Id_ClienteRegion
            WHERE c.Id_Comentario = ?";

    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("i", $idComentario);
    $stmt->execute();
    $stmt->bind_result($idComentarioR, $idCliente, $idClienteRegion, $comentarioPrimario, $comentarioSecundario, $nombreCliente, $nombreRegion);

    $comentario = null;
    if ($stmt->fetch()) {
        $comentario = [
            'Id_Comentario' => $idComentarioR,
            'Id_Cliente' => $idCliente,
            'Id_ClienteRegion' => $idClienteRegion,
            'ComentarioPrimario' => $comentarioPrimario ?? '',
            'ComentarioSecundario' => $comentarioSecundario ?? '',
            'NombreCliente' => $nombreCliente,
            'NombreRegion' => $nombreRegion ?? ''
        ];
    }
    $stmt->close();

    if ($comentario) {
        echo json_encode(['success' => true, 'comentario' => $comentario]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Comentario no encontrado']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

$enlace->close();
?>