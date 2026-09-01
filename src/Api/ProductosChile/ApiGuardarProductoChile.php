<?php
//src/Api/ProductosChile/ApiGuardarProductoChile.php
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
    // Aceptar coma o punto como separador decimal (ej: "18,2305" -> 18.2305)
    if (is_string($valor)) {
        $valor = str_replace(',', '.', $valor);
    }
    return filter_var($valor, FILTER_VALIDATE_FLOAT) !== false ? floatval($valor) : 0;
}

$descripProducto = limpiar_texto($data["descripProducto"] ?? "");
$descripFactura = limpiar_texto($data["descripFactura"] ?? "");
$codigoSiesa = limpiar_texto($data["codigoSiesa"] ?? "");
$codigoFDA = limpiar_texto($data["codigoFDA"] ?? "");
$codigoCUST = limpiar_texto($data["codigoCUST"] ?? "");
$pesoGr = validar_flotante($data["pesoGr"] ?? 0);
$pesoNetoUndGr = validar_flotante($data["pesoNetoUndGr"] ?? 0);
$factorPesoBruto = validar_flotante($data["factorPesoBruto"] ?? 0);
$precioVenta = validar_flotante($data["precioVenta"] ?? 0);
$planVallejo = validar_entero($data["planVallejo"] ?? 0);
$codigoCIP = limpiar_texto($data["codigoCIP"] ?? "");
$descripPlanVallejo = limpiar_texto($data["descripPlanVallejo"] ?? "");
$fobValor = validar_flotante($data["fobValor"] ?? 0);
$vanValor = validar_flotante($data["vanValor"] ?? 0);
$diasVencimiento = validar_entero($data["diasVencimiento"] ?? 0);
$activo = validar_entero($data["activo"] ?? 1);

if (!$descripProducto || !$descripFactura || !$codigoSiesa) {
    echo json_encode(["success" => false, "message" => "Todos los campos obligatorios deben estar diligenciados"]);
    exit;
}

try {
    $sql = "INSERT INTO ProductosChile
            (DescripProducto, DescripFactura, Codigo_Siesa, Codigo_FDA, Codigo_CUST, PesoGr, PesoNetoUndGr, FactorPesoBruto, PrecioVenta, PlanVallejo, CodigoCIP, DescripPlanVallejo, FOB_Valor, VAN_Valor, DiasVencimiento, Activo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("sssssddddissddii",
        $descripProducto, $descripFactura, $codigoSiesa, $codigoFDA, $codigoCUST,
        $pesoGr, $pesoNetoUndGr, $factorPesoBruto, $precioVenta,
        $planVallejo, $codigoCIP, $descripPlanVallejo, $fobValor, $vanValor,
        $diasVencimiento, $activo
    );
    $stmt->execute();

    $idProducto = $stmt->insert_id;
    $stmt->close();

    echo json_encode(["success" => true, "message" => "Producto Chile guardado exitosamente", "idProducto" => $idProducto]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>
