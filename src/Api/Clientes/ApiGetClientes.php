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

// 👇 NUEVO: Obtener todas las bodegas
$sqlBodegas = "SELECT Id_Bodega, Descripcion FROM Bodegas ORDER BY Descripcion";
$stmtBodegas = $enlace->prepare($sqlBodegas);
$stmtBodegas->execute();
$stmtBodegas->bind_result($Id_Bodega, $Descripcion);

$bodegas = [];
while ($stmtBodegas->fetch()) {
    $bodegas[] = [
        'Id_Bodega' => $Id_Bodega,
        'Descripcion' => $Descripcion
    ];
}
$stmtBodegas->close();

// 👇 Obtener clientes con sus regiones (existente)
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

// 👇 Devolver ambos arrays en la respuesta
$response = [
    'clientes' => $clientes,
    'bodegas' => $bodegas
];

if (!empty($clientes) || !empty($bodegas)) {
    echo json_encode($response);
} else {
    echo json_encode(["error" => "No se encontraron datos"]);
}

$enlace->close();
