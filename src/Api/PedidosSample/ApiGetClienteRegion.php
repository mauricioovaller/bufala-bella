<?php
header("Content-Type: application/json");

// Solo POST permitido
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

// Conexión a la base de datos
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

// Leer JSON
$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Datos no válidos"]);
    exit;
}

// Funciones de sanitización
function limpiar_texto($txt)
{
    return htmlspecialchars(trim($txt), ENT_QUOTES, "UTF-8");
}
function validar_entero($valor)
{
    return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : null;
}
function validar_flotante($valor)
{
    return filter_var($valor, FILTER_VALIDATE_FLOAT) !== false ? floatval($valor) : null;
}

// Extraer datos

$idCliente = validar_entero($data["clienteId"] ?? null);

// Validaciones obligatorias
if (!$idCliente) {
    echo json_encode(["success" => false, "message" => "Faltan datos obligatorios"]);
    exit;
}

try {
    $enlace->begin_transaction();

    // Insertar encabezado
    $sql = "SELECT Id_ClienteRegion, Id_Cliente, Region, Direccion, Id_Bodega 
              FROM ClientesRegion 
              WHERE Id_Cliente = ? ";
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("i", $idCliente);
    $stmt->execute();
    $stmt->bind_result(
        $idClienteRegion,
        $idCliente,
        $region,
        $direccion,
        $idBodega,
    );

    $regiones = [];
    while ($stmt->fetch()) {
        $regiones[] = [
            "idClienteRegion" => $idClienteRegion,
            "idCliente" => $idCliente,
            "region" => $region,
            "direccion" => $direccion,
            "idBodega" => $idBodega,
        ];
    }
    $stmt->close();

    
    $enlace->commit();

    echo json_encode(["success" => true, "regiones" => $regiones]);
} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
