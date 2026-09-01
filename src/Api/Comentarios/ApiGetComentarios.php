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
$idCliente = isset($input['idCliente']) ? intval($input['idCliente']) : 0;

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
            LEFT JOIN ClientesRegion cr ON c.Id_ClienteRegion = cr.Id_ClienteRegion";

    $params = [];
    $types = "";

    if ($idCliente > 0) {
        $sql .= " WHERE c.Id_Cliente = ?";
        $params[] = $idCliente;
        $types .= "i";
    }

    $sql .= " ORDER BY cli.Nombre, cr.Region";

    $stmt = $enlace->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $stmt->bind_result($idComentario, $idClienteR, $idClienteRegion, $comentarioPrimario, $comentarioSecundario, $nombreCliente, $nombreRegion);

    $comentarios = [];
    while ($stmt->fetch()) {
        $comentarios[] = [
            'Id_Comentario' => $idComentario,
            'Id_Cliente' => $idClienteR,
            'Id_ClienteRegion' => $idClienteRegion,
            'ComentarioPrimario' => $comentarioPrimario ?? '',
            'ComentarioSecundario' => $comentarioSecundario ?? '',
            'NombreCliente' => $nombreCliente,
            'NombreRegion' => $nombreRegion ?? ''
        ];
    }
    $stmt->close();

    echo json_encode(['success' => true, 'comentarios' => $comentarios, 'total' => count($comentarios)]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

$enlace->close();
?>