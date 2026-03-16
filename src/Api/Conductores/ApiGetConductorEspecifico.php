<?php
// ApiGetConductorEspecifico.php
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
if (!isset($input['idConductor']) || empty($input['idConductor'])) {
    die(json_encode(["error" => "ID de conductor no válido."]));
}

$idConductor = intval($input['idConductor']);

$sql = "SELECT Id_Conductor, Nombre, NoDocumento, Telefono, TipoVehiculo, Placa FROM Conductores WHERE Id_Conductor = ?";
$stmt = $enlace->prepare($sql);
$stmt->bind_param("i", $idConductor);
$stmt->execute();

$stmt->bind_result($Id_Conductor, $Nombre, $NoDocumento, $Telefono, $TipoVehiculo, $Placa);

if ($stmt->fetch()) {
    $conductor = [
        'Id_Conductor' => $Id_Conductor,
        'Nombre' => $Nombre,
        'NoDocumento' => $NoDocumento,
        'Telefono' => $Telefono,
        'TipoVehiculo' => $TipoVehiculo,
        'Placa' => $Placa
    ];
    echo json_encode(['conductor' => $conductor]);
} else {
    echo json_encode(["error" => "Conductor no encontrado"]);
}
$stmt->close();
$enlace->close();
