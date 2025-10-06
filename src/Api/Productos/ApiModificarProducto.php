<?php
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
    return htmlspecialchars(trim($texto), ENT_QUOTES, "UTF-8");
}

function validar_entero($valor) {
    return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : 0;
}

function validar_flotante($valor) {
    return filter_var($valor, FILTER_VALIDATE_FLOAT) !== false ? floatval($valor) : 0;
}

$idProducto = validar_entero($data["idProducto"] ?? 0);
$descripProducto = limpiar_texto($data["descripProducto"] ?? "");
$descripFactura = limpiar_texto($data["descripFactura"] ?? "");
$codigoSiesa = limpiar_texto($data["codigoSiesa"] ?? "");
$codigoFDA = limpiar_texto($data["codigoFDA"] ?? "");
$pesoGr = validar_flotante($data["pesoGr"] ?? 0);
$factorPesoBruto = validar_flotante($data["factorPesoBruto"] ?? 0);
$activo = validar_entero($data["activo"] ?? 1);

// Validar campos obligatorios
if (!$idProducto || !$descripProducto || !$descripFactura || !$codigoSiesa) {
    echo json_encode(["success" => false, "message" => "Todos los campos son obligatorios"]);
    exit;
}

try {
    // Actualizar producto
    $sql = "UPDATE Productos SET 
            DescripProducto = ?, 
            DescripFactura = ?, 
            Codigo_Siesa = ?, 
            Codigo_FDA = ?, 
            PesoGr = ?, 
            FactorPesoBruto = ?, 
            Activo = ? 
            WHERE Id_Producto = ?";
    
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("ssssddii", $descripProducto, $descripFactura, $codigoSiesa, $codigoFDA, $pesoGr, $factorPesoBruto, $activo, $idProducto);
    $stmt->execute();
    $stmt->close();

    echo json_encode(["success" => true, "message" => "Producto actualizado exitosamente"]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>