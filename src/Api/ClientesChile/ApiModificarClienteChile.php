<?php
//src/Api/ClientesChile/ApiModificarClienteChile.php
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

function validar_entero($valor) {
    return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : 0;
}

$idCliente = validar_entero($data["idCliente"] ?? 0);
$nombre = limpiar_texto($data["nombre"] ?? "");
$direccion = limpiar_texto($data["direccion"] ?? "");
$ciudad = limpiar_texto($data["ciudad"] ?? "");
$pais = limpiar_texto($data["pais"] ?? "Chile");
$contacto = limpiar_texto($data["contacto"] ?? "");
$email = limpiar_texto($data["email"] ?? "");
$estado = limpiar_texto($data["estado"] ?? "Activo");
$rut = limpiar_texto($data["rut"] ?? "");
$telefono = limpiar_texto($data["telefono"] ?? "");

if (!$idCliente || !$nombre) {
    echo json_encode(["success" => false, "message" => "Datos incompletos"]);
    exit;
}

try {
    $sqlCliente = "UPDATE ClientesChile SET
                    Nombre = ?, Direccion = ?, Ciudad = ?, Pais = ?, Contacto = ?,
                    Email = ?, Estado = ?, Rut = ?, Telefono = ?
                   WHERE Id_Cliente = ?";
    $stmtCliente = $enlace->prepare($sqlCliente);
    $stmtCliente->bind_param("sssssssssi", $nombre, $direccion, $ciudad, $pais, $contacto, $email, $estado, $rut, $telefono, $idCliente);
    $stmtCliente->execute();
    $stmtCliente->close();

    echo json_encode(["success" => true, "message" => "Cliente Chile actualizado exitosamente"]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>
