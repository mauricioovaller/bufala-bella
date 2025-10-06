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

if (!isset($input['idCliente']) || empty($input['idCliente'])) {
    die(json_encode(["error" => "ID de cliente no válido."]));
}

$idCliente = intval($input['idCliente']);

// Obtener datos del cliente
$sqlCliente = "SELECT * FROM Clientes WHERE Id_Cliente = ?";
$stmtCliente = $enlace->prepare($sqlCliente);
$stmtCliente->bind_param("i", $idCliente);
$stmtCliente->execute();

// Vincular resultados para el cliente
$stmtCliente->bind_result(
    $Id_Cliente, 
    $Nombre, 
    $DiasFechaSalida, 
    $DiasFechaEnroute, 
    $DiasFechaDelivery, 
    $DiasFechaIngreso
);

$cliente = null;
if ($stmtCliente->fetch()) {
    $cliente = [
        'Id_Cliente' => $Id_Cliente,
        'Nombre' => $Nombre,
        'DiasFechaSalida' => $DiasFechaSalida,
        'DiasFechaEnroute' => $DiasFechaEnroute,
        'DiasFechaDelivery' => $DiasFechaDelivery,
        'DiasFechaIngreso' => $DiasFechaIngreso
    ];
}
$stmtCliente->close();

if (!$cliente) {
    echo json_encode(["error" => "Cliente no encontrado"]);
    exit;
}

// Obtener regiones del cliente
$sqlRegiones = "SELECT * FROM ClientesRegion WHERE Id_Cliente = ?";
$stmtRegiones = $enlace->prepare($sqlRegiones);
$stmtRegiones->bind_param("i", $idCliente);
$stmtRegiones->execute();

// Vincular resultados para las regiones
$stmtRegiones->bind_result(
    $Id_ClienteRegion,
    $Id_Cliente,
    $Region,
    $Direccion,
    $Frecuencia
);

$regiones = [];
while ($stmtRegiones->fetch()) {
    $regiones[] = [
        'Id_ClienteRegion' => $Id_ClienteRegion,
        'Id_Cliente' => $Id_Cliente,
        'Region' => $Region,
        'Direccion' => $Direccion,
        'Frecuencia' => $Frecuencia
    ];
}
$stmtRegiones->close();

echo json_encode([
    "cliente" => $cliente,
    "regiones" => $regiones
]);

$enlace->close();
?>