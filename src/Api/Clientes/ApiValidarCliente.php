<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["error" => "Método no permitido"]);
    http_response_code(405);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

$tipo = trim($input['tipo']);
$idCliente = intval($input['idCliente']);
$nombre = trim($input['nombre']);

if ($tipo === "nuevo") {
    $sql = "SELECT Nombre FROM Clientes WHERE Nombre = ?";
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("s", $nombre);
} else {
    $sql = "SELECT Nombre FROM Clientes WHERE Nombre = ? AND Id_Cliente <> ?";
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("si", $nombre, $idCliente);
}

$stmt->execute();
$stmt->bind_result($nombreEncontrado);
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "Ya existe un cliente con ese nombre"
    ]);
} else {
    echo json_encode([
        "success" => true,
        "message" => "Cliente válido"
    ]);
}

$stmt->close();
$enlace->close();
?>