<?php
// ApiGetConductores.php
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

$sql = "SELECT Id_Conductor, Nombre, NoDocumento, Telefono, TipoVehiculo, Placa FROM Conductores ORDER BY Nombre";
$stmt = $enlace->prepare($sql);
$stmt->execute();

$stmt->bind_result($Id_Conductor, $Nombre, $NoDocumento, $Telefono, $TipoVehiculo, $Placa);

$conductores = [];
while ($stmt->fetch()) {
    $conductores[] = [
        'Id_Conductor' => $Id_Conductor,
        'Nombre' => $Nombre,
        'NoDocumento' => $NoDocumento,
        'Telefono' => $Telefono,
        'TipoVehiculo' => $TipoVehiculo,
        'Placa' => $Placa
    ];
}
$stmt->close();

if (!empty($conductores)) {
    echo json_encode(['conductores' => $conductores]);
} else {
    echo json_encode(['conductores' => []]); // array vacío en lugar de error
}

$enlace->close();
