<?php
// src/Api/PedidosChile/ApiGuardarPedidoChile.php
// Guarda un nuevo pedido Chile (encabezado + detalle) en transacción
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión"]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Datos no válidos"]);
    exit;
}

// Funciones de sanitización
function limpiar($txt)
{
    return trim((string)$txt);
}
function val_int($v)
{
    return filter_var($v, FILTER_VALIDATE_INT)   !== false ? intval($v)   : null;
}
function val_float($v)
{
    return filter_var($v, FILTER_VALIDATE_FLOAT) !== false ? floatval($v) : null;
}
function val_date($v)
{
    return (!empty($v) && $v !== '0000-00-00') ? limpiar($v) : null;
}

// ── Encabezado ────────────────────────────────────────────────────────────
$enc = $data["encabezado"] ?? [];

$idClienteChile       = val_int($enc["clienteId"]           ?? null);
$numeroOrden          = limpiar($enc["numeroOrden"]          ?? "");
$fechaRecepcionOrden  = limpiar($enc["fechaRecepcionOrden"]  ?? "");
$fechaSolicitudEntrega = limpiar($enc["fechaSolicitudEntrega"] ?? "");
$fechaFinalEntrega    = limpiar($enc["fechaFinalEntrega"]    ?? "");
$cantidadEstibas      = val_float($enc["cantidadEstibas"]    ?? 0) ?? 0;
$guiaAerea            = limpiar($enc["guiaAerea"]            ?? "");
$idAgencia            = val_int($enc["idAgencia"]            ?? 0) ?? 0;
$idAerolinea          = val_int($enc["idAerolinea"]          ?? 0) ?? 0;
$descuentoComercial   = val_float($enc["descuentoComercial"] ?? 0) ?? 0;
$observaciones        = limpiar($enc["observaciones"]        ?? "");
$facturaNo            = limpiar($enc["facturaNo"]            ?? "");

$det = $data["detalle"] ?? [];

// Validaciones obligatorias
if (!$idClienteChile || !$fechaRecepcionOrden || empty($det)) {
    echo json_encode(["success" => false, "message" => "Faltan datos obligatorios: cliente, fecha y al menos un producto"]);
    exit;
}

try {
    $enlace->begin_transaction();

    // ── INSERT EncabPedidoChile ───────────────────────────────────────────
    // Tipos: i s s s s d s i i d s s
    // Id_ClienteChile, NumeroOrden, FechaRec, FechaSol, FechaFin,
    // CantEstibas, GuiaAerea, IdAgencia, IdAerolinea, Descuento, Obs, FacturaNo
    $sqlEnc = "INSERT INTO EncabPedidoChile
               (Id_ClienteChile, NumeroOrden, FechaRecepcionOrden, FechaSolicitudEntrega,
                FechaFinalEntrega, CantidadEstibas, GuiaAerea, IdAgencia, IdAerolinea,
                DescuentoComercial, Observaciones, FacturaNo)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmtEnc = $enlace->prepare($sqlEnc);
    $stmtEnc->bind_param(
        "issssdsiidss",
        $idClienteChile,
        $numeroOrden,
        $fechaRecepcionOrden,
        $fechaSolicitudEntrega,
        $fechaFinalEntrega,
        $cantidadEstibas,
        $guiaAerea,
        $idAgencia,
        $idAerolinea,
        $descuentoComercial,
        $observaciones,
        $facturaNo
    );
    $stmtEnc->execute();

    if ($stmtEnc->affected_rows <= 0) {
        throw new Exception("Error al insertar el encabezado");
    }

    $idEncabPedidoChile = $enlace->insert_id;
    $stmtEnc->close();

    // ── INSERT DetPedidoChile ─────────────────────────────────────────────
    // Tipos: i i s s s s s s d d i d d d
    $sqlDet = "INSERT INTO DetPedidoChile
               (Id_EncabPedidoChile, Id_ProductoChile, Descripcion, CodigoCliente, CodigoSiesa,
                Lote, FechaElaboracion, FechaVencimiento,
                PesoNetoGr, CantidadCajas, EnvaseInternoxCaja,
                PesoEscurridoKg, FactorPesoBruto, ValorXKilo)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmtDet = $enlace->prepare($sqlDet);

    foreach ($det as $item) {
        $idProd   = val_int($item["productoId"]         ?? null);
        $desc     = limpiar($item["descripcion"]         ?? "");
        $codCli   = limpiar($item["codigoCliente"]       ?? "");
        $codSiesa = limpiar($item["codigoSiesa"]         ?? "");
        $lote     = limpiar($item["lote"]                ?? "");
        $fechaElab = val_date($item["fechaElaboracion"]   ?? "");
        $fechaVenc = val_date($item["fechaVencimiento"]   ?? "");
        $pesoNetoGr = val_float($item["pesoNetoGr"]     ?? 0) ?? 0;
        $cantCajas  = val_float($item["cantidadCajas"]  ?? 0) ?? 0;
        $envase     = val_int($item["envaseInternoxCaja"] ?? 0) ?? 0;
        $pesoEsc    = val_float($item["pesoEscurridoKg"] ?? 0) ?? 0;
        $factor     = val_float($item["factorPesoBruto"] ?? 0) ?? 0;
        $valorKilo  = val_float($item["valorxKilo"]      ?? 0) ?? 0;

        if (!$idProd || !$cantCajas) {
            throw new Exception("Datos de detalle inválidos: producto y cantidad son obligatorios");
        }

        $stmtDet->bind_param(
            "iissssssddiddd",
            $idEncabPedidoChile,
            $idProd,
            $desc,
            $codCli,
            $codSiesa,
            $lote,
            $fechaElab,
            $fechaVenc,
            $pesoNetoGr,
            $cantCajas,
            $envase,
            $pesoEsc,
            $factor,
            $valorKilo
        );
        $stmtDet->execute();

        if ($stmtDet->affected_rows <= 0) {
            throw new Exception("Error al insertar línea de detalle");
        }
    }

    $stmtDet->close();
    $enlace->commit();

    echo json_encode([
        "success"  => true,
        "idPedido" => $idEncabPedidoChile,
        "numero"   => "CHI-" . str_pad($idEncabPedidoChile, 6, "0", STR_PAD_LEFT),
    ]);
} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
