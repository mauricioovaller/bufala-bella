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
$idProducto = intval($input['idProducto']);
$codigoSiesa = trim($input['codigoSiesa']);

if ($tipo === "nuevo") {
    $sql = "SELECT Codigo_Siesa FROM Productos WHERE Codigo_Siesa = ?";
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("s", $codigoSiesa);
} else {
    $sql = "SELECT Codigo_Siesa FROM Productos WHERE Codigo_Siesa = ? AND Id_Producto <> ?";
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("si", $codigoSiesa, $idProducto);
}

$stmt->execute();
$stmt->bind_result($codigoEncontrado);
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "Ya existe un producto con ese código Siesa"
    ]);
} else {
    echo json_encode([
        "success" => true,
        "message" => "Producto válido"
    ]);
}

$stmt->close();
$enlace->close();
?>