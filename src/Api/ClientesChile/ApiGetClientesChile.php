<?php
//src/Api/ClientesChile/ApiGetClientesChile.php
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

$sql = "SELECT Id_Cliente, Nombre, Direccion, Ciudad, Pais, Contacto, Email, Estado, Rut, Telefono
        FROM ClientesChile
        ORDER BY Nombre";

$stmt = $enlace->prepare($sql);
$stmt->execute();
$stmt->bind_result(
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

$clientes = [];
while ($stmt->fetch()) {
    $clientes[] = [
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
$stmt->close();

if (!empty($clientes)) {
    echo json_encode(["clientes" => $clientes]);
} else {
    echo json_encode(["error" => "No se encontraron clientes Chile"]);
}

$enlace->close();
?>
