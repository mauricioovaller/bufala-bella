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

// Obtener clientes con sus regiones usando bind_result
$sql = "SELECT 
            c.Id_Cliente,
            c.Nombre,
            c.DiasFechaSalida,
            c.DiasFechaEnroute,
            c.DiasFechaDelivery,
            c.DiasFechaIngreso,
            GROUP_CONCAT(CONCAT(cr.Region, ' (', cr.Direccion, ')') SEPARATOR '; ') as Regiones
        FROM Clientes c
        LEFT JOIN ClientesRegion cr ON c.Id_Cliente = cr.Id_Cliente
        GROUP BY c.Id_Cliente
        ORDER BY c.Nombre";

$stmt = $enlace->prepare($sql);
$stmt->execute();

// Vincular resultados
$stmt->bind_result(
    $Id_Cliente,
    $Nombre,
    $DiasFechaSalida,
    $DiasFechaEnroute,
    $DiasFechaDelivery,
    $DiasFechaIngreso,
    $Regiones
);

$clientes = [];
while ($stmt->fetch()) {
    $clientes[] = [
        'Id_Cliente' => $Id_Cliente,
        'Nombre' => $Nombre,
        'DiasFechaSalida' => $DiasFechaSalida,
        'DiasFechaEnroute' => $DiasFechaEnroute,
        'DiasFechaDelivery' => $DiasFechaDelivery,
        'DiasFechaIngreso' => $DiasFechaIngreso,
        'Regiones' => $Regiones
    ];
}
$stmt->close();

if (!empty($clientes)) {
    echo json_encode($clientes);
} else {
    echo json_encode(["error" => "No se encontraron clientes"]);
}

$enlace->close();
?>