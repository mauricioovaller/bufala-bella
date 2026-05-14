<?php
// src/Api/PedidosChile/ApiActualizarPedidoChile.php
// Actualiza un pedido Chile existente: header + borra detalle viejo + inserta nuevo detalle
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Datos no válidos"]);
    exit;
}

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

$enc = $data["encabezado"] ?? [];
$det = $data["detalle"]    ?? [];

$idPedido             = val_int($enc["idPedido"]             ?? null);
$idClienteChile       = val_int($enc["clienteId"]            ?? null);
$numeroOrden          = limpiar($enc["numeroOrden"]           ?? "");
$fechaRecepcionOrden  = limpiar($enc["fechaRecepcionOrden"]   ?? "");
$fechaSolicitudEntrega = limpiar($enc["fechaSolicitudEntrega"] ?? "");
$fechaFinalEntrega    = limpiar($enc["fechaFinalEntrega"]     ?? "");
$cantidadEstibas      = val_float($enc["cantidadEstibas"]     ?? 0) ?? 0;
$guiaAerea            = limpiar($enc["guiaAerea"]             ?? "");
$idAgencia            = val_int($enc["idAgencia"]             ?? 0) ?? 0;
$idAerolinea          = val_int($enc["idAerolinea"]           ?? 0) ?? 0;
$descuentoComercial   = val_float($enc["descuentoComercial"]  ?? 0) ?? 0;
$observaciones        = limpiar($enc["observaciones"]         ?? "");
$facturaNo            = limpiar($enc["facturaNo"]             ?? "");

if (!$idPedido || !$idClienteChile || !$fechaRecepcionOrden || empty($det)) {
    echo json_encode(["success" => false, "message" => "Faltan datos obligatorios"]);
    exit;
}

try {
    $enlace->begin_transaction();

    // ── UPDATE EncabPedidoChile ───────────────────────────────────────────
    // Tipos: i s s s s d s i i d s s | i (WHERE)  → "issssdsiidss" + "i" = 13 vars
    $sqlUpd = "UPDATE EncabPedidoChile
               SET Id_ClienteChile=?, NumeroOrden=?, FechaRecepcionOrden=?,
                   FechaSolicitudEntrega=?, FechaFinalEntrega=?, CantidadEstibas=?,
                   GuiaAerea=?, IdAgencia=?, IdAerolinea=?,
                   DescuentoComercial=?, Observaciones=?, FacturaNo=?
               WHERE Id_EncabPedidoChile=?";

    $stmtUpd = $enlace->prepare($sqlUpd);
    $stmtUpd->bind_param(
        "issssdsiidssi",
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
        $facturaNo,
        $idPedido
    );
    $stmtUpd->execute();
    $stmtUpd->close();

    // ── DELETE detalle antiguo ────────────────────────────────────────────
    $stmtDel = $enlace->prepare("DELETE FROM DetPedidoChile WHERE Id_EncabPedidoChile=?");
    $stmtDel->bind_param("i", $idPedido);
    $stmtDel->execute();
    $stmtDel->close();

    // ── INSERT detalle nuevo ──────────────────────────────────────────────
    $sqlDet = "INSERT INTO DetPedidoChile
               (Id_EncabPedidoChile, Id_ProductoChile, Descripcion, CodigoCliente, CodigoSiesa,
                Lote, FechaElaboracion, FechaVencimiento,
                PesoNetoGr, CantidadCajas, EnvaseInternoxCaja,
                PesoEscurridoKg, FactorPesoBruto, ValorXKilo)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmtDet = $enlace->prepare($sqlDet);

    foreach ($det as $item) {
        $idProd    = val_int($item["productoId"]          ?? null);
        $desc      = limpiar($item["descripcion"]          ?? "");
        $codCli    = limpiar($item["codigoCliente"]        ?? "");
        $codSiesa  = limpiar($item["codigoSiesa"]          ?? "");
        $lote      = limpiar($item["lote"]                 ?? "");
        $fechaElab = val_date($item["fechaElaboracion"]    ?? "");
        $fechaVenc = val_date($item["fechaVencimiento"]    ?? "");
        $pesoNetoGr = val_float($item["pesoNetoGr"]       ?? 0) ?? 0;
        $cantCajas  = val_float($item["cantidadCajas"]    ?? 0) ?? 0;
        $envase     = val_int($item["envaseInternoxCaja"]  ?? 0) ?? 0;
        $pesoEsc    = val_float($item["pesoEscurridoKg"]  ?? 0) ?? 0;
        $factor     = val_float($item["factorPesoBruto"]  ?? 0) ?? 0;
        $valorKilo  = val_float($item["valorxKilo"]        ?? 0) ?? 0;

        if (!$idProd || !$cantCajas) {
            throw new Exception("Datos de detalle inválidos");
        }

        $stmtDet->bind_param(
            "iissssssddiddd",
            $idPedido,
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

    echo json_encode(["success" => true, "idPedido" => $idPedido]);
} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
