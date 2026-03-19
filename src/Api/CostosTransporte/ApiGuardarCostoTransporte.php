<?php
// ApiGuardarCostoTransporte.php
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

// Función para limpiar texto
function limpiar_texto($texto) {
    return htmlspecialchars(trim($texto), ENT_QUOTES, "UTF-8");
}

$fecha = $data["Fecha"] ?? "";
$cantidadCamiones = $data["CantidadCamiones"] ?? 1;
$valorFlete = $data["ValorFlete"] ?? 0;
$observaciones = limpiar_texto($data["Observaciones"] ?? "");
$usuarioRegistro = limpiar_texto($data["UsuarioRegistro"] ?? "Sistema");

// Validaciones básicas
if (!$fecha) {
    echo json_encode(["success" => false, "message" => "La fecha es obligatoria"]);
    exit;
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
    echo json_encode(["success" => false, "message" => "Formato de fecha inválido. Use YYYY-MM-DD"]);
    exit;
}

if (!is_numeric($cantidadCamiones) || $cantidadCamiones <= 0) {
    echo json_encode(["success" => false, "message" => "La cantidad de camiones debe ser un número mayor a 0"]);
    exit;
}

if (!is_numeric($valorFlete) || $valorFlete <= 0) {
    echo json_encode(["success" => false, "message" => "El valor del flete debe ser un número mayor a 0"]);
    exit;
}

// Validar que la fecha exista en EncabInvoice (tiene facturas)
$sqlCheckFecha = "SELECT COUNT(*) FROM EncabInvoice WHERE Fecha = ?";
$stmtCheckFecha = $enlace->prepare($sqlCheckFecha);
$stmtCheckFecha->bind_param("s", $fecha);
$stmtCheckFecha->execute();
$stmtCheckFecha->bind_result($countFacturas);
$stmtCheckFecha->fetch();
$stmtCheckFecha->close();

if ($countFacturas == 0) {
    echo json_encode(["success" => false, "message" => "No existen facturas para la fecha $fecha. La fecha debe tener al menos una factura registrada."]);
    exit;
}

// Validar que no exista ya un registro para esta fecha (un único costo por fecha)
$sqlCheckDuplicado = "SELECT Id_CostoTransporte FROM CostosTransporteDiario WHERE Fecha = ?";
$stmtCheckDuplicado = $enlace->prepare($sqlCheckDuplicado);
$stmtCheckDuplicado->bind_param("s", $fecha);
$stmtCheckDuplicado->execute();
$stmtCheckDuplicado->store_result();

if ($stmtCheckDuplicado->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Ya existe un registro de costo de transporte para la fecha $fecha"]);
    $stmtCheckDuplicado->close();
    exit;
}
$stmtCheckDuplicado->close();

// Insertar registro
$sql = "INSERT INTO CostosTransporteDiario (Fecha, CantidadCamiones, ValorFlete, Observaciones, UsuarioRegistro) 
        VALUES (?, ?, ?, ?, ?)";
$stmt = $enlace->prepare($sql);
$stmt->bind_param("sddss", $fecha, $cantidadCamiones, $valorFlete, $observaciones, $usuarioRegistro);

if ($stmt->execute()) {
    $id = $stmt->insert_id;
    echo json_encode([
        "success" => true, 
        "message" => "Costo de transporte guardado exitosamente", 
        "idCostoTransporte" => $id
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Error al guardar: " . $stmt->error]);
}

$stmt->close();
$enlace->close();
?>