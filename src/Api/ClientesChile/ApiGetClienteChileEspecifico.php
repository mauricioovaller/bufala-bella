<?php
//src/Api/ClientesChile/ApiGetClienteChileEspecifico.php
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

if (!isset($input['idCliente']) || empty($input['idCliente'])) {
    die(json_encode(["error" => "ID de cliente no válido."]));
}

$idCliente = intval($input['idCliente']);

// Obtener datos del cliente Chile
$sqlCliente = "SELECT Id_Cliente, Nombre, Direccion, Ciudad, Pais, Contacto, Email, Estado, Rut, Telefono
               FROM ClientesChile WHERE Id_Cliente = ?";
$stmtCliente = $enlace->prepare($sqlCliente);
$stmtCliente->bind_param("i", $idCliente);
$stmtCliente->execute();

$stmtCliente->bind_result(
    $Id_Cliente,
    $Nombre,
    $Direccion,
    $Ciudad,
    $Pais,
    $Contacto,
    $Email,
    $Estado,
    $Rut,
    $Telefono
);

$cliente = null;
if ($stmtCliente->fetch()) {
    $cliente = [
        'Id_Cliente' => $Id_Cliente,
        'Nombre' => $Nombre,
        'Direccion' => $Direccion,
        'Ciudad' => $Ciudad,
        'Pais' => $Pais,
        'Contacto' => $Contacto,
        'Email' => $Email,
        'Estado' => $Estado,
        'Rut' => $Rut,
        'Telefono' => $Telefono
    ];
}
$stmtCliente->close();

if (!$cliente) {
    echo json_encode(["error" => "Cliente Chile no encontrado"]);
    exit;
}

echo json_encode(["cliente" => $cliente]);

$enlace->close();
?>
