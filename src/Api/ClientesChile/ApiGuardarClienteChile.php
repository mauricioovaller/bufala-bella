<?php
//src/Api/ClientesChile/ApiGuardarClienteChile.php
header("Content-Type: application/json");
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Datos no válidos"]);
    exit;
}

function limpiar_texto($texto) {
    // Se guarda el texto tal cual (sin codificar entidades HTML).
    // La seguridad contra inyección SQL la dan los prepared statements.
    return trim((string)$texto);
}

$nombre = limpiar_texto($data["nombre"] ?? "");
$direccion = limpiar_texto($data["direccion"] ?? "");
$ciudad = limpiar_texto($data["ciudad"] ?? "");
$pais = limpiar_texto($data["pais"] ?? "Chile");
$contacto = limpiar_texto($data["contacto"] ?? "");
$email = limpiar_texto($data["email"] ?? "");
$estado = limpiar_texto($data["estado"] ?? "Activo");
$rut = limpiar_texto($data["rut"] ?? "");
$telefono = limpiar_texto($data["telefono"] ?? "");

if (!$nombre) {
    echo json_encode(["success" => false, "message" => "El nombre del cliente es obligatorio"]);
    exit;
}

try {
    $sqlCliente = "INSERT INTO ClientesChile (Nombre, Direccion, Ciudad, Pais, Contacto, Email, Estado, Rut, Telefono)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmtCliente = $enlace->prepare($sqlCliente);
    $stmtCliente->bind_param("sssssssss", $nombre, $direccion, $ciudad, $pais, $contacto, $email, $estado, $rut, $telefono);
    $stmtCliente->execute();

    $idCliente = $stmtCliente->insert_id;
    $stmtCliente->close();

    echo json_encode(["success" => true, "message" => "Cliente Chile guardado exitosamente", "idCliente" => $idCliente]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>
