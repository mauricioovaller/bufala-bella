<?php
// ApiGuardarCostoAereo.php
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

function limpiar_texto($texto)
{
    return htmlspecialchars(trim($texto), ENT_QUOTES, "UTF-8");
}

$fecha = $data["Fecha"] ?? "";
$guiaMaster = limpiar_texto(trim($data["GuiaMaster"] ?? ""));
$tipoPedido = $data["TipoPedido"] ?? "normal";
$valorFleteUSD = $data["ValorFleteUSD"] ?? 0;
$trm = $data["TRM"] ?? 0;
$pesoCobrado = $data["PesoCobrado"] ?? 0;
$observaciones = limpiar_texto($data["Observaciones"] ?? "");
$usuarioRegistro = limpiar_texto($data["UsuarioRegistro"] ?? "Sistema");

// Validaciones basicas
if (!$fecha || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
    echo json_encode(["success" => false, "message" => "La fecha es obligatoria y debe tener formato YYYY-MM-DD"]);
    exit;
}

if (!$guiaMaster) {
    echo json_encode(["success" => false, "message" => "El número de Guía Master es obligatorio"]);
    exit;
}

if (!in_array($tipoPedido, ['normal', 'chile'], true)) {
    $tipoPedido = 'normal';
}

if (!is_numeric($valorFleteUSD) || $valorFleteUSD <= 0) {
    echo json_encode(["success" => false, "message" => "El valor del flete USD debe ser un número mayor a 0"]);
    exit;
}

if (!is_numeric($trm) || $trm <= 0) {
    echo json_encode(["success" => false, "message" => "La TRM debe ser un número mayor a 0"]);
    exit;
}

if (!is_numeric($pesoCobrado) || $pesoCobrado <= 0) {
    echo json_encode(["success" => false, "message" => "El peso cobrado debe ser un número mayor a 0"]);
    exit;
}

// Validar que la Fecha + GuiaMaster existan en la tabla de facturas del tipo
$tablaFacturas = $tipoPedido === 'chile' ? 'EncabInvoiceChile' : 'EncabInvoice';
$sqlCheckGM = "SELECT COUNT(*) FROM {$tablaFacturas} WHERE Fecha = ? AND GuiaMaster = ?";
$stmtCheckGM = $enlace->prepare($sqlCheckGM);
$stmtCheckGM->bind_param("ss", $fecha, $guiaMaster);
$stmtCheckGM->execute();
$stmtCheckGM->bind_result($countGM);
$stmtCheckGM->fetch();
$stmtCheckGM->close();

if ($countGM == 0) {
    echo json_encode(["success" => false, "message" => "No existe una factura con Fecha $fecha y Guía Master '$guiaMaster' en EncabInvoice"]);
    exit;
}

// Validar que no exista ya un registro para esta Fecha + GuiaMaster + Tipo
$sqlCheckDuplicado = "SELECT Id_CostoTransporteAereo FROM CostosTransporteAereo WHERE Fecha = ? AND GuiaMaster = ? AND TipoPedido = ?";
$stmtCheckDuplicado = $enlace->prepare($sqlCheckDuplicado);
$stmtCheckDuplicado->bind_param("sss", $fecha, $guiaMaster, $tipoPedido);
$stmtCheckDuplicado->execute();
$stmtCheckDuplicado->store_result();

if ($stmtCheckDuplicado->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Ya existe un registro de costo aéreo para la fecha $fecha con Guía Master '$guiaMaster'"]);
    $stmtCheckDuplicado->close();
    exit;
}
$stmtCheckDuplicado->close();

// Insertar registro
$sql = "INSERT INTO CostosTransporteAereo (Fecha, GuiaMaster, TipoPedido, ValorFleteUSD, TRM, PesoCobrado, Observaciones, UsuarioRegistro)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
$stmt = $enlace->prepare($sql);
$stmt->bind_param("sssdddss", $fecha, $guiaMaster, $tipoPedido, $valorFleteUSD, $trm, $pesoCobrado, $observaciones, $usuarioRegistro);

if ($stmt->execute()) {
    $id = $stmt->insert_id;
    echo json_encode([
        "success" => true,
        "message" => "Costo de transporte aéreo guardado exitosamente",
        "id" => $id
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Error al guardar: " . $stmt->error]);
}

$stmt->close();
$enlace->close();
?>
